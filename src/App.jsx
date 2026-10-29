import { useEffect, useMemo, useState } from "react";
import { Activity, AudioLines, BatteryCharging, Check, ChevronDown, CircleHelp, Clock3, Cpu, Heart, History, Info, MessageCircle, Radio, RotateCcw, Settings2, ShieldCheck, Signal, SlidersHorizontal, Sparkles, Waves, X, Zap, Send, CircleDot, ArrowUpRight, Menu } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PHRASES } from "./data/phrases";
import { useDemoSignals } from "./hooks/useDemoSignals";

const nowText = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const demoPhrases = [{ id: "water", score: 94 }, { id: "yes", score: 89 }, { id: "help", score: 91 }, { id: "thanks", score: 86 }, { id: "no", score: 92 }];
const tooltipStyle = { background: "#111b2d", border: "1px solid #263650", color: "#fff", borderRadius: 10, fontSize: 12 };

function Badge({ children, tone = "neutral", dot = false }) {
  return <span className={`badge badge-${tone}`}>{dot && <i className="badge-dot" />}{children}</span>;
}
function IconButton({ label, onClick, children, className = "" }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}
function PanelTitle({ icon: Icon, title, subtitle, action }) {
  return <div className="panel-title"><div className="panel-title-icon"><Icon size={17} /></div><div className="panel-title-copy"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-title-action">{action}</div>}</div>;
}

export default function App() {
  const [page, setPage] = useState("communication");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoRunning, setDemoRunning] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [typedText, setTypedText] = useState("");
  const [currentMessage, setCurrentMessage] = useState({ text: "I need water", score: 94, time: "10:42 AM", source: "Demo sample" });
  const [messages, setMessages] = useState([
    { id: 1, text: "I need water", time: "10:42 AM", source: "Demo sample", score: 94 },
    { id: 2, text: "Yes", time: "10:40 AM", source: "Demo sample", score: 89 },
    { id: 3, text: "Thank you", time: "10:36 AM", source: "Demo sample", score: 86 },
  ]);
  const { samples: wave, signal, sampleCount } = useDemoSignals(demoRunning);
  const phraseLookup = useMemo(() => Object.fromEntries(PHRASES.map((phrase) => [phrase.id, phrase])), []);

  useEffect(() => {
    if (!demoRunning) return undefined;
    const timer = window.setInterval(() => {
      const candidate = demoPhrases[Math.floor(Math.random() * demoPhrases.length)];
      const phrase = phraseLookup[candidate.id];
      if (phrase) setCurrentMessage({ text: phrase.text, score: candidate.score, time: nowText(), source: "Demo sample" });
    }, 7200);
    return () => window.clearInterval(timer);
  }, [demoRunning, phraseLookup]);

  const publishMessage = (value, source = "Selected phrase", score = 100) => {
    const text = value.trim();
    if (!text) return;
    const time = nowText();
    const entry = { id: Date.now(), text, time, source, score };
    setCurrentMessage(entry);
    setMessages((old) => [entry, ...old].slice(0, 50));
    setTypedText("");
  };
  const filteredMessages = messages.filter((item) =>
    activeTab === "all" ||
    (activeTab === "phrases" ? item.source !== "Demo sample" : item.source === "Demo sample")
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
      <div className="device-mini"><div className="device-mini-icon"><Cpu size={18}/></div><div className="device-mini-copy"><strong>VocalisX collar</strong><span><i className="status-dot"/> Demo simulation</span></div><ChevronDown size={15} className="device-chevron"/></div>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div className="help-icon"><CircleHelp size={17}/></div><div><b>Building VocalisX?</b><p>Phase 1 · UI prototype</p><button onClick={() => setPage("dashboard")}>View signal panel <ArrowUpRight size={13}/></button></div></div>
        <div className="profile-row"><div className="profile-avatar">VX</div><div className="profile-info"><strong>Project workspace</strong><span>Local demo</span></div><IconButton label="Workspace settings" onClick={() => setPage("dashboard")}><Settings2 size={17}/></IconButton></div>
      </div>
    </aside>
    {menuOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><IconButton label="Open navigation" className="mobile-menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></IconButton><div className="breadcrumbs"><span>VocalisX</span><span className="crumb-slash">/</span><strong>{page === "communication" ? "Communication" : page === "dashboard" ? "Signal dashboard" : "Message history"}</strong></div></div><div className="topbar-right"><span className="topbar-date"><Clock3 size={14}/>{new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span><span className="topbar-separator"/><Badge tone="warning" dot>Simulation mode</Badge><div className="topbar-avatar">VX</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>ASSISTIVE COMMUNICATION</div><h1>{page === "communication" ? "A voice, without sound." : page === "dashboard" ? "Signal observability." : "Message history."}</h1><p className="page-lede">{page === "communication" ? "Turn intended words into a message the world can see." : page === "dashboard" ? "Explore simulated sensor values and prepare for hardware integration." : "Review messages selected during this browser session."}</p></div><div className="heading-actions"><span className="session-chip"><span className="session-dot"/>SESSION ACTIVE</span><button className="secondary-button" onClick={() => setDemoRunning((value) => !value)}>{demoRunning ? <><span className="button-dot"/>Pause demo</> : <><Zap size={15}/>Resume demo</>}</button></div></div>
        <div className="demo-notice"><div className="notice-icon"><Info size={17}/></div><div><strong>Phase 1 preview · simulated data</strong><span>Sensor readings, scores and example predictions are illustrative. No collar hardware or trained recognition model is connected.</span></div><button onClick={() => setPage("dashboard")}>Explore signal data <ArrowUpRight size={14}/></button></div>

        {page === "communication" && <div className="communication-layout">
          <section className="primary-column">
            <div className="panel live-output-panel"><div className="output-head"><PanelTitle icon={AudioLines} title="Communication output" subtitle="Your message appears here"/><Badge tone="purple" dot>LIVE PREVIEW</Badge></div><div className="output-stage"><div className="output-orb"><span/><Waves size={31}/></div><div className="output-label"><span className="output-label-dot"/>LATEST MESSAGE</div><div className="recognized-text" aria-live="polite" aria-atomic="true">{currentMessage.text}</div><div className="output-meta"><span><Check size={14}/>Ready to share</span><span className="meta-divider"/><span><Clock3 size={13}/>{currentMessage.time}</span><span className="confidence-pill">{currentMessage.score}% demo score</span></div><p className="output-disclaimer">Example output · not a real AI prediction</p></div><div className="output-bottom"><span><ShieldCheck size={15}/> You stay in control of every message.</span><span className="privacy-label"><span/>No account required</span></div></div>
            <div className="panel phrase-panel"><PanelTitle icon={Sparkles} title="Quick phrases" subtitle="Tap a phrase to display it as a message"/><div className="phrase-grid">{PHRASES.map((phrase) => <button key={phrase.id} className={`phrase-card phrase-${phrase.category.toLowerCase()}`} onClick={() => publishMessage(phrase.text)}><span className="phrase-icon">{phrase.icon}</span><span className="phrase-text">{phrase.text}</span><ArrowUpRight size={15} className="phrase-arrow"/></button>)}</div><div className="phrase-footnote"><Info size={14}/><span>These buttons are manual communication shortcuts, not sensor-recognised words. Model integration comes later.</span></div></div>
            <div className="panel type-panel"><div className="type-copy"><div className="type-icon"><MessageCircle size={17}/></div><div><h3>Type a message</h3><p>A keyboard fallback for communication.</p></div></div><form className="type-form" onSubmit={(event) => { event.preventDefault(); publishMessage(typedText, "Typed message"); }}><input aria-label="Write a message" value={typedText} onChange={(event) => setTypedText(event.target.value)} placeholder="Write something to communicate…" maxLength={240}/><button className="send-button" type="submit" disabled={!typedText.trim()}><Send size={15}/> Display</button></form></div>
          </section>
          <aside className="right-column">
            <div className="panel status-panel"><PanelTitle icon={Radio} title="Device status" subtitle="Current session"/><div className="status-card"><div className="status-card-top"><div className="device-illustration"><Waves size={26}/><span/></div><div><strong>VocalisX collar</strong><span className="status-online"><i/>Simulated device</span></div><Badge tone="warning">DEMO</Badge></div><div className="status-stats"><div><span>Connection</span><b><i className="tiny-dot"/>Simulated</b></div><div><span>Signal stream</span><b className="green-value">Active</b></div><div><span>Battery</span><b><BatteryCharging size={14}/> —</b></div></div></div><div className="status-info"><Info size={15}/><span>Real hardware status will appear after ESP32 integration.</span></div></div>
            <div className="panel recent-panel"><div className="recent-title"><PanelTitle icon={History} title="Recent messages"/><button className="text-action" onClick={() => setPage("history")}>View all <ArrowUpRight size={13}/></button></div>{messages.length ? messages.slice(0, 4).map((item, index) => <div key={item.id} className="recent-item"><div className={`recent-marker recent-marker-${index % 3}`}>{item.source === "Demo sample" ? <Activity size={14}/> : <MessageCircle size={14}/>}</div><div className="recent-message"><strong>{item.text}</strong><span>{item.source}</span></div><time>{item.time}</time></div>) : <div className="empty-state small-empty"><History size={22}/><p>No messages yet</p></div>}<button className="full-history-button" onClick={() => setPage("history")}>Open message history <ArrowUpRight size={14}/></button></div>
            <div className="care-card"><div className="care-top"><div className="care-symbol"><Heart size={16}/></div><span>DESIGNED AROUND PEOPLE</span></div><h3>Communication comes first.</h3><p>This prototype is for exploration and must not be relied on for emergency or clinical use.</p><div className="care-line"/></div>
          </aside>
        </div>}

        {page === "dashboard" && <div className="dashboard-grid"><div className="dashboard-main">
          <div className="panel signal-panel"><div className="signal-panel-heading"><PanelTitle icon={Waves} title="sEMG signal monitor" subtitle="Mock waveform · normalized demo units"/><div className="chart-controls"><Badge tone={demoRunning ? "success" : "neutral"} dot>{demoRunning ? "Streaming" : "Paused"}</Badge></div></div><div className="signal-chart-legend"><span><i className="legend-emg"/>Mock EMG amplitude</span><span><i className="legend-zero"/>Baseline</span><span className="mock-tag">SIMULATED</span></div><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><AreaChart data={wave.map((emg, index) => ({ emg, index }))} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="emgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5dfc" stopOpacity={0.24}/><stop offset="95%" stopColor="#6d5dfc" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#eef0f6" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="index" tickLine={false} axisLine={false} tick={false}/><YAxis domain={[-1, 1]} tickCount={5} tickLine={false} axisLine={false} tick={{ fill: "#8b95a8", fontSize: 11 }}/><Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toFixed(3), "Normalized demo signal"]}/><Area type="monotone" dataKey="emg" stroke="#7968f7" strokeWidth={2} fill="url(#emgFill)" isAnimationActive={false} dot={false}/></AreaChart></ResponsiveContainer></div><div className="chart-xlabels"><span>Earlier samples</span><span>Live <span className="live-wave-dot"/></span></div><div className="chart-footer"><span><CircleDot size={13}/>Samples generated: {sampleCount.toLocaleString()}</span><button className="subtle-button" onClick={() => setDemoRunning((value) => !value)}>{demoRunning ? "Pause stream" : "Resume stream"}</button></div></div>
          <div className="metric-grid"><Metric icon={Activity} label="EMG RMS" value={signal.emgRms.toFixed(3)} unit="norm." note="Mock signal strength"/><Metric icon={Zap} label="EMG peak" value={signal.emgPeak.toFixed(3)} unit="norm." note="Mock peak amplitude"/><Metric icon={Signal} label="Generated samples" value={sampleCount.toLocaleString()} unit="samples" note="Illustrative counter"/></div>
          <div className="panel imu-panel"><PanelTitle icon={SlidersHorizontal} title="IMU readings" subtitle="Mock accelerometer and gyroscope readings"/><div className="imu-sections">{[{ name: "ACCELEROMETER", unit: "g · demo", values: signal.accel }, { name: "GYROSCOPE", unit: "°/s · demo", values: signal.gyro }].map((group) => <div className="imu-group" key={group.name}><div className="imu-group-title"><span>{group.name}</span><span>{group.unit}</span></div><div className="axis-rows">{["X", "Y", "Z"].map((axis, index) => <div className="axis-row" key={axis}><span className="axis-label">{axis}</span><div className="axis-track"><i style={{ width: `${Math.min(100, Math.abs(group.values[index]) / 1.2 * 100)}%` }}/></div><span className="axis-value">{group.values[index].toFixed(2)}</span></div>)}</div></div>)}</div><div className="imu-footnote"><Info size={14}/>All values shown are simulated. No orientation model runs in Phase 1.</div></div>
        </div><aside className="dashboard-side">
          <div className="panel signal-state-panel"><PanelTitle icon={Activity} title="Signal state"/><div className="state-visual"><div className="state-ring"><div className="state-ring-inner"><Waves size={25}/></div><span className="ring-dot ring-dot-one"/><span className="ring-dot ring-dot-two"/><span className="ring-dot ring-dot-three"/></div><Badge tone="neutral" dot>Simulated activity</Badge><p>This label is generated by the demo, not detected articulation.</p></div><div className="state-separator"/><div className="state-row"><span>Input source</span><b>Local simulator</b></div><div className="state-row"><span>Device link</span><b><i className="tiny-dot"/> Not connected</b></div><div className="state-row"><span>Sample rate</span><b>Not measured</b></div></div>
          <div className="panel pipeline-panel"><PanelTitle icon={Cpu} title="Recognition pipeline" subtitle="Planned integration path"/><div className="pipeline-list">{[{ number: "01", title: "Sensor acquisition", status: "Planned", desc: "ESP32-S3 stream" }, { number: "02", title: "Signal processing", status: "Planned", desc: "Filter and window EMG" }, { number: "03", title: "Word classifier", status: "Not trained", desc: "Personalised fixed vocabulary" }, { number: "04", title: "Text output", status: "UI ready", desc: "Communication display" }].map((item, index) => <div className={`pipeline-item ${index === 3 ? "pipeline-last" : ""}`} key={item.number}><div className="pipeline-number">{item.number}</div><div className="pipeline-copy"><strong>{item.title}</strong><span>{item.desc}</span></div><span className={`pipeline-status ${item.status === "UI ready" ? "status-ready" : ""}`}>{item.status}</span></div>)}</div><div className="pipeline-notice"><Info size={14}/><span>The AI model is not connected or trained.</span></div></div>
          <div className="dashboard-tip"><div><Sparkles size={17}/></div><strong>Next milestone</strong><p>Validate signal quality using real sEMG recordings before collecting labelled word samples.</p></div>
        </aside></div>}

        {page === "history" && <div className="panel history-page-panel"><div className="history-head"><PanelTitle icon={History} title="Communication history" subtitle="Messages created in this browser session"/><button className="secondary-button" onClick={() => setMessages([])}><RotateCcw size={15}/>Clear history</button></div><div className="history-toolbar"><div className="history-tabs"><button className={activeTab === "all" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("all")}>All messages <span>{messages.length}</span></button><button className={activeTab === "phrases" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("phrases")}>Quick / typed</button><button className={activeTab === "demo" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("demo")}>Demo samples</button></div><Badge tone="warning">Local session only</Badge></div>{filteredMessages.length ? filteredMessages.map((item) => <div className="recent-item" key={item.id}><div className="recent-marker"><MessageCircle size={14}/></div><div className="recent-message"><strong>{item.text}</strong><span>{item.source}</span></div><time>{item.time}</time><button className="repeat-button" onClick={() => publishMessage(item.text, "Repeated message", item.score)}>Repeat</button></div>) : <div className="empty-state"><History size={28}/><h3>No messages in this view</h3><p>Choose a phrase or type a message to see it here.</p></div>}<div className="history-footnote"><Info size={15}/>History is held in browser memory only and clears on refresh. Nothing is sent to a server.</div></div>}
        <footer className="page-footer"><div><span className="footer-logo"><Waves size={15}/></span><span>VocalisX <b>·</b> making communication more accessible</span></div><span>Prototype v0.1 <i/> Phase 1</span></footer>
      </div>
    </main>
  </div>;
}
function Metric({ icon: Icon, label, value, unit, note }) {
  return <div className="panel metric-card"><div className="metric-icon metric-icon-purple"><Icon size={17}/></div><span className="metric-label">{label}</span><div className="metric-value">{value}<small>{unit}</small></div><span className="metric-note">{note}</span></div>;
}
