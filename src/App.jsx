import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AudioLines, BatteryCharging, Check, ChevronDown, CircleHelp, Clock3, Cpu, Heart, History, Info, MessageCircle, Radio, RotateCcw, Settings2, ShieldCheck, Signal, SlidersHorizontal, Sparkles, Waves, X, Zap, Send, CircleDot, ArrowUpRight, Menu, Usb, Unplug } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PHRASES } from "./data/phrases";

const nowText = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const tooltipStyle = { background: "#111b2d", border: "1px solid #263650", color: "#fff", borderRadius: 10, fontSize: 12 };
const WORDS = ["Hello", "Yes", "No", "Help", "Water"];
const DEFAULT_RANGES = [
  { word: "Hello", min: 1, max: 5 }, { word: "Yes", min: 6, max: 10 },
  { word: "No", min: 11, max: 15 }, { word: "Help", min: 16, max: 20 },
  { word: "Water", min: 21, max: 25 },
];

function Badge({ children, tone = "neutral", dot = false }) {
  return <span className={`badge badge-${tone}`}>{dot && <i className="badge-dot" />}{children}</span>;
}
function IconButton({ label, onClick, children, className = "" }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}
function PanelTitle({ icon: Icon, title, subtitle, action }) {
  return <div className="panel-title"><div className="panel-title-icon"><Icon size={17} /></div><div className="panel-title-copy"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-title-action">{action}</div>}</div>;
}
function readRanges() {
  try {
    const stored = JSON.parse(localStorage.getItem("vocalisx-frequency-ranges") || "null");
    if (Array.isArray(stored) && stored.length === 5) return stored;
  } catch { /* use defaults */ }
  return DEFAULT_RANGES;
}
function classifyFrequency(hz, ranges) {
  if (!Number.isFinite(hz) || hz <= 0) return null;
  return ranges.find((range) => hz >= Number(range.min) && hz <= Number(range.max))?.word || null;
}

export default function App() {
  const [page, setPage] = useState("communication");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [typedText, setTypedText] = useState("");
  const [currentMessage, setCurrentMessage] = useState({ text: "Connect your ESP32 to begin", score: null, time: nowText(), source: "System" });
  const [messages, setMessages] = useState([]);
  const [ranges, setRanges] = useState(readRanges);
  const [serialStatus, setSerialStatus] = useState("Disconnected");
  const [serialError, setSerialError] = useState("");
  const [frequency, setFrequency] = useState(0);
  const [rms, setRms] = useState(0);
  const [signalPresent, setSignalPresent] = useState(false);
  const [windowNumber, setWindowNumber] = useState(null);
  const [wave, setWave] = useState([]);
  const [rawWave, setRawWave] = useState([]);
  const [sampleCount, setSampleCount] = useState(0);
  const [demoRunningLegacy] = useState(false);
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);
  const lastPredictionRef = useRef("");
  const currentWord = signalPresent ? classifyFrequency(frequency, ranges) : null;
  const phraseLookup = useMemo(() => Object.fromEntries(PHRASES.map((phrase) => [phrase.id, phrase])), []);

  useEffect(() => {
    if (!currentWord || currentWord === lastPredictionRef.current) return;
    lastPredictionRef.current = currentWord;
    const text = currentWord === "Help" ? "I need help" : currentWord === "Water" ? "I need water" : currentWord;
    const entry = { id: Date.now(), text, time: nowText(), source: "ESP32 frequency", score: null };
    setCurrentMessage(entry);
    setMessages((old) => [entry, ...old].slice(0, 50));
  }, [currentWord]);

  useEffect(() => {
    if (signalPresent) return;
    lastPredictionRef.current = "";
  }, [signalPresent, frequency]);

  useEffect(() => () => { disconnectSerial(); }, []);

  const disconnectSerial = async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
    } catch { /* reader may already be closed */ }
    try {
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch { /* port may already be closed */ }
    setSerialStatus("Disconnected");
    setSignalPresent(false);
    setFrequency(0);
  };

  const handleSerialLine = (line) => {
    if (!line.trim()) return;
    try {
      const data = JSON.parse(line);
      if (data.type === "vocalisx_status") {
        setSerialStatus(data.status === "started" ? "Connected · ESP32 ready" : String(data.status || "Connected"));
        return;
      }
      if (data.type !== "vocalisx_data") return;
      const hz = Number(data.frequency_hz);
      const nextRms = Number(data.rms);
      const present = data.signal_present === true && Number.isFinite(hz) && hz > 0;
      setFrequency(Number.isFinite(hz) ? hz : 0);
      setRms(Number.isFinite(nextRms) ? nextRms : 0);
      setSignalPresent(present);
      setWindowNumber(Number.isFinite(Number(data.window)) ? Number(data.window) : null);
      setSampleCount((count) => count + 1);
      setWave((old) => [...old.slice(-119), Number.isFinite(hz) ? hz : 0]);
      if (Array.isArray(data.samples)) {
        const validSamples = data.samples.map(Number).filter(Number.isFinite);
        if (validSamples.length) setRawWave((old) => [...old, ...validSamples].slice(-1500));
      }
      setSerialStatus("Connected · Receiving data");
    } catch {
      // Ignore incomplete or non-JSON serial lines; the next newline ends the record.
    }
  };

  const connectSerial = async () => {
    setSerialError("");
    if (!("serial" in navigator)) {
      setSerialError("Web Serial is not available. Open this page in Chrome or Edge on localhost or HTTPS.");
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      keepReadingRef.current = true;
      setSerialStatus("Connected · Waiting for ESP32 data");
      const decoder = new TextDecoder();
      let buffer = "";
      const reader = port.readable.getReader();
      readerRef.current = reader;
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\\r?\\n/);
        buffer = lines.pop() || "";
        for (const line of lines) handleSerialLine(line);
      }
    } catch (error) {
      if (error?.name !== "AbortError") setSerialError(error?.message || "Unable to read the serial port.");
    } finally {
      try { readerRef.current?.releaseLock(); } catch { /* already released */ }
      readerRef.current = null;
      try { if (portRef.current) await portRef.current.close(); } catch { /* closed */ }
      portRef.current = null;
      keepReadingRef.current = false;
      setSerialStatus("Disconnected");
      setSignalPresent(false);
    }
  };

  const saveRanges = (next) => {
    setRanges(next);
    localStorage.setItem("vocalisx-frequency-ranges", JSON.stringify(next));
  };

  const publishMessage = (value, source = "Selected phrase", score = null) => {
    const text = value.trim();
    if (!text) return;
    const entry = { id: Date.now(), text, time: nowText(), source, score };
    setCurrentMessage(entry);
    setMessages((old) => [entry, ...old].slice(0, 50));
    setTypedText("");
  };
  const resetHistory = () => setMessages([]);
  const filteredMessages = messages.filter((item) =>
    activeTab === "all" ||
    (activeTab === "phrases" ? item.source !== "ESP32 frequency" : item.source === "ESP32 frequency")
  );

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="brand-lockup"><div className="brand-mark"><Waves size={23}/></div><div><div className="brand-name">vocalis<span>x</span></div><div className="brand-caption">SILENT SPEECH PROJECT</div></div><IconButton label="Close navigation" className="mobile-close" onClick={() => setMenuOpen(false)}><X size={18}/></IconButton></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        <button className={page === "communication" ? "nav-item active" : "nav-item"} onClick={() => { setPage("communication"); setMenuOpen(false); }}><MessageCircle size={18}/><span>Communication</span><span className="nav-pip"/></button>
        <button className={page === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => { setPage("dashboard"); setMenuOpen(false); }}><Activity size={18}/><span>Signal dashboard</span></button>
        <button className={page === "history" ? "nav-item active" : "nav-item"} onClick={() => { setPage("history"); setMenuOpen(false); }}><History size={18}/><span>Message history</span><span className="nav-count">{messages.length}</span></button>
      </nav>
      <div className="sidebar-divider"/><div className="workspace-label sidebar-device-label">DEVICE</div>
      <div className="device-mini"><div className="device-mini-icon"><Cpu size={18}/></div><div className="device-mini-copy"><strong>ESP32 + AD8232</strong><span><i className={serialStatus.startsWith("Connected") ? "status-dot connected-dot" : "status-dot"}/>{serialStatus}</span></div><ChevronDown size={15} className="device-chevron"/></div>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div className="help-icon"><CircleHelp size={17}/></div><div><b>Hardware integration</b><p>USB serial · 115200 baud</p><button onClick={() => setPage("dashboard")}>View signal panel <ArrowUpRight size={13}/></button></div></div>
        <div className="profile-row"><div className="profile-avatar">VX</div><div className="profile-info"><strong>Project workspace</strong><span>Local device session</span></div><IconButton label="Workspace settings" onClick={() => setPage("dashboard")}><Settings2 size={17}/></IconButton></div>
      </div>
    </aside>
    {menuOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><IconButton label="Open navigation" className="mobile-menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></IconButton><div className="breadcrumbs"><span>VocalisX</span><span className="crumb-slash">/</span><strong>{page === "communication" ? "Communication" : page === "dashboard" ? "Signal dashboard" : "Message history"}</strong></div></div><div className="topbar-right"><span className="topbar-date"><Clock3 size={14}/>{new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span><span className="topbar-separator"/><Badge tone={serialStatus.startsWith("Connected") ? "success" : "warning"} dot>{serialStatus.startsWith("Connected") ? "Hardware connected" : "USB disconnected"}</Badge><div className="topbar-avatar">VX</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>ASSISTIVE COMMUNICATION</div><h1>{page === "communication" ? "A voice, without sound." : page === "dashboard" ? "Signal observability." : "Message history."}</h1><p className="page-lede">{page === "communication" ? "Turn intended words into a message the world can see." : page === "dashboard" ? "Live frequency stream from your ESP32 over USB serial." : "Review messages predicted from live sensor readings."}</p></div><div className="heading-actions"><span className="session-chip"><span className="session-dot"/>SESSION ACTIVE</span>{portRef.current ? <button className="secondary-button" onClick={disconnectSerial}><Unplug size={15}/>Disconnect ESP32</button> : <button className="secondary-button" onClick={connectSerial}><Usb size={15}/>Connect ESP32</button>}</div></div>
        {serialError && <div className="serial-error" role="alert"><Info size={15}/>{serialError}</div>}

        {page === "communication" && <div className="communication-layout">
          <section className="primary-column">
            <div className="panel live-output-panel"><div className="output-head"><PanelTitle icon={AudioLines} title="Communication output" subtitle="Predicted message from live frequency"/><Badge tone={signalPresent ? "success" : "warning"} dot>{signalPresent ? "SIGNAL DETECTED" : "NO SIGNAL"}</Badge></div><div className="output-stage"><div className="output-orb"><span/><Waves size={31}/></div><div className="output-label"><span className="output-label-dot"/>PREDICTED WORD</div><div className="recognized-text" aria-live="polite" aria-atomic="true">{signalPresent ? (currentWord || "Unmatched frequency") : "—"}</div><div className="output-meta"><span>{signalPresent ? <><Check size={14}/>Live ESP32 reading</> : <><Info size={14}/>Connect sensor signal</>}</span><span className="meta-divider"/><span><Clock3 size={13}/>{currentMessage.time}</span><span className="confidence-pill">{frequency.toFixed(2)} Hz</span></div><p className="output-disclaimer">Frequency-range prototype · not a trained speech recognizer</p></div><div className="output-bottom"><span><ShieldCheck size={15}/> Review predicted messages before relying on them.</span><span className="privacy-label"><span/>USB local</span></div></div>
            <div className="panel type-panel"><div className="type-copy"><div className="type-icon"><MessageCircle size={17}/></div><div><h3>Type a message</h3><p>Keyboard fallback for communication.</p></div></div><form className="type-form" onSubmit={(event) => { event.preventDefault(); publishMessage(typedText, "Typed message"); }}><input aria-label="Write a message" value={typedText} onChange={(event) => setTypedText(event.target.value)} placeholder="Write something to communicate…" maxLength={240}/><button className="send-button" type="submit" disabled={!typedText.trim()}><Send size={15}/> Display</button></form></div>
          </section>
          <aside className="right-column">
            <div className="panel status-panel"><PanelTitle icon={Radio} title="Device status" subtitle="USB serial session"/><div className="status-card"><div className="status-card-top"><div className="device-illustration"><Waves size={26}/><span/></div><div><strong>ESP32 + AD8232</strong><span className={serialStatus.startsWith("Connected") ? "status-online status-connected" : "status-online"}><i/>{serialStatus}</span></div><Badge tone={serialStatus.startsWith("Connected") ? "success" : "warning"}>{serialStatus.startsWith("Connected") ? "LIVE" : "OFFLINE"}</Badge></div><div className="status-stats"><div><span>Connection</span><b>{serialStatus}</b></div><div><span>Frequency</span><b>{frequency.toFixed(2)} Hz</b></div><div><span>Signal</span><b className={signalPresent ? "green-value" : ""}>{signalPresent ? "Present" : "Absent"}</b></div></div></div><div className="status-info"><Info size={15}/><span>Close Arduino Serial Monitor before connecting from the browser. Use Chrome or Edge.</span></div></div>
            <div className="panel recent-panel"><div className="recent-title"><PanelTitle icon={History} title="Recent messages"/><button className="text-action" onClick={() => setPage("history")}>View all <ArrowUpRight size={13}/></button></div>{messages.length ? messages.slice(0, 4).map((item, index) => <div key={item.id} className="recent-item"><div className={`recent-marker recent-marker-${index % 3}`}>{item.source === "ESP32 frequency" ? <Activity size={14}/> : <MessageCircle size={14}/>}</div><div className="recent-message"><strong>{item.text}</strong><span>{item.source}</span></div><time>{item.time}</time></div>) : <div className="empty-state small-empty"><History size={22}/><p>No messages yet</p></div>}<button className="full-history-button" onClick={() => setPage("history")}>Open message history <ArrowUpRight size={14}/></button></div>

          </aside>
        </div>}

        {page === "dashboard" && <div className="dashboard-grid"><div className="dashboard-main">
          <div className="panel signal-panel"><div className="signal-panel-heading"><PanelTitle icon={Waves} title="Live sensor frequency" subtitle="Raw ADC waveform received from ESP32"/><div className="chart-controls"><Badge tone={serialStatus.startsWith("Connected") ? "success" : "neutral"} dot>{serialStatus.startsWith("Connected") ? "Connected" : "Waiting"}</Badge></div></div><div className="signal-chart-legend"><span><i className="legend-emg"/>Sensor amplitude (ADC)</span><span className="mock-tag">REAL SENSOR DATA</span></div><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rawWave.map((adc, index) => ({ adc, index }))} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="frequencyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7968f7" stopOpacity={0.25}/><stop offset="95%" stopColor="#7968f7" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid stroke="#eef0f6" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="index" tickLine={false} axisLine={false} tick={false}/><YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} tick={{ fill: "#8b95a8", fontSize: 11 }}/><Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toFixed(0) + " ADC", "Sensor amplitude"]}/><Area type="linear" dataKey="adc" stroke="#7968f7" strokeWidth={2} fill="url(#frequencyFill)" isAnimationActive={false} dot={false}/></AreaChart></ResponsiveContainer></div><div className="chart-xlabels"><span>Previous windows</span><span>Latest <span className="live-wave-dot"/></span></div><div className="chart-footer"><span><CircleDot size={13}/>Raw ADC samples: {rawWave.length.toLocaleString()}</span><span>Window: {windowNumber ?? "—"}</span></div><div className="imu-footnote"><Info size={14}/>Each plotted point is a raw ADC sample streamed by the ESP32. Flash the updated firmware in firmware/VocalisX_AD8232.ino to populate this waveform.</div></div>
          <div className="metric-grid"><Metric icon={Activity} label="Frequency" value={frequency.toFixed(2)} unit="Hz" note="Zero-crossing estimate"/><Metric icon={Zap} label="RMS" value={rms.toFixed(3)} unit="ADC" note="ESP32 signal level"/><Metric icon={Signal} label="Serial windows" value={sampleCount.toLocaleString()} unit="windows" note="Received from ESP32"/></div>
        </div><aside className="dashboard-side">
          <div className="panel signal-state-panel"><PanelTitle icon={Activity} title="Signal state"/><div className="state-visual"><div className={`state-ring ${signalPresent ? "state-ring-active" : ""}`}><div className="state-ring-inner"><Waves size={25}/></div><span className="ring-dot ring-dot-one"/><span className="ring-dot ring-dot-two"/><span className="ring-dot ring-dot-three"/></div><Badge tone={signalPresent ? "success" : "warning"} dot>{signalPresent ? "Signal detected" : "No signal"}</Badge><p>{signalPresent ? `Current estimate: ${frequency.toFixed(2)} Hz` : "No valid non-zero signal is arriving from GPIO34."}</p></div><div className="state-separator"/><div className="state-row"><span>Input source</span><b>ESP32 USB serial</b></div><div className="state-row"><span>Device link</span><b>{serialStatus}</b></div><div className="state-row"><span>Classifier output</span><b>{currentWord || "—"}</b></div></div>
          <div className="dashboard-tip"><div><Waves size={17}/></div><strong>Live frequency trace</strong><p>The graph plots each frequency estimate received from the ESP32 over time. A raw ADC waveform requires the firmware to transmit individual ADC samples.</p></div>
        </aside></div>}

        {page === "history" && <div className="panel history-page-panel"><div className="history-head"><PanelTitle icon={History} title="Communication history" subtitle="Messages created in this browser session"/><button className="secondary-button" onClick={resetHistory}><RotateCcw size={15}/>Clear history</button></div><div className="history-toolbar"><div className="history-tabs"><button className={activeTab === "all" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("all")}>All messages <span>{messages.length}</span></button><button className={activeTab === "phrases" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("phrases")}>Manual / typed</button><button className={activeTab === "demo" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("demo")}>Sensor predictions</button></div><Badge tone="warning">Local session only</Badge></div>{filteredMessages.length ? filteredMessages.map((item) => <div className="recent-item" key={item.id}><div className="recent-marker"><MessageCircle size={14}/></div><div className="recent-message"><strong>{item.text}</strong><span>{item.source}</span></div><time>{item.time}</time><button className="repeat-button" onClick={() => publishMessage(item.text, "Repeated message")}>Repeat</button></div>) : <div className="empty-state"><History size={28}/><h3>No messages in this view</h3><p>Connect the ESP32 or choose a manual phrase to see messages here.</p></div>}<div className="history-footnote"><Info size={15}/>History is held in browser memory only and clears on refresh.</div></div>}
        <footer className="page-footer"><div><span className="footer-logo"><Waves size={15}/></span><span>VocalisX <b>·</b> making communication more accessible</span></div><span>Prototype v0.2 <i/> USB frequency experiment</span></footer>
      </div>
    </main>
  </div>;
}
function Metric({ icon: Icon, label, value, unit, note }) {
  return <div className="panel metric-card"><div className="metric-icon metric-icon-purple"><Icon size={17}/></div><span className="metric-label">{label}</span><div className="metric-value">{value}<small>{unit}</small></div><span className="metric-note">{note}</span></div>;
}