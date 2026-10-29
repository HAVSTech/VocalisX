import { useEffect, useMemo, useState } from "react";
import {
  Activity, AudioLines, BatteryCharging, Check, ChevronDown, CircleHelp, Clock3,
  Cpu, Heart, History, House, Info, MessageCircle, Monitor, Radio, RotateCcw,
  Settings2, ShieldCheck, Signal, SlidersHorizontal, Sparkles, Waves, Wifi,
  X, Zap, Send, CircleDot, ArrowUpRight, Volume2, PanelLeftClose, Menu
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PHRASES } from "./data/phrases";
import { useDemoSignals } from "./hooks/useDemoSignals";

const stamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const SAMPLE_TEXTS = [
  { phraseId: "water", confidence: 0.94 },
  { phraseId: "yes", confidence: 0.89 },
  { phraseId: "help", confidence: 0.91 },
  { phraseId: "thanks", confidence: 0.86 },
  { phraseId: "no", confidence: 0.92 },
];
const chartTooltip = { background: "#111b2d", border: "1px solid #263650", color: "#fff", borderRadius: 10, fontSize: 12 };

function Badge({ children, tone = "neutral", dot = false }) {
  return <span className={`badge badge-${tone}`}>{dot && <i className="badge-dot" />}{children}</span>;
}
function IconButton({ label, onClick, children, className = "" }) {
  return <button className={`icon-button ${className}`} title={label} aria-label={label} onClick={onClick}>{children}</button>;
}
function PanelTitle({ icon: Icon, title, subtitle, action }) {
  return <div className="panel-title"><div className="panel-title-icon"><Icon size={17} /></div><div className="panel-title-copy"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-title-action">{action}</div>}</div>;
}

export default function App() {
  const [view, setView] = useState("communication");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoRunning, setDemoRunning] = useState(true);
  const [historyItems, setHistoryItems] = useState([
    { id: 1, text: "I need water", time: "10:42 AM", source: "Demo sample", confidence: 94 },
    { id: 2, text: "Yes", time: "10:40 AM", source: "Demo sample", confidence: 89 },
    { id: 3, text: "Thank you", time: "10:36 AM", source: "Demo sample", confidence: 86 },
  ]);
  const [currentText, setCurrentText] = useState({ text: "I need water", confidence: 94, time: "10:42 AM", pending: false });
  const [manualText, setManualText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { samples, signal, sampleCount } = useDemoSignals(demoRunning);
  const phraseMap = useMemo(() => Object.fromEntries(PHRASES.map((p) => [p.id, p])), []);

  useEffect(() => {
    if (!demoRunning) return undefined;
    const timer = window.setInterval(() => {
      const item = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
      const phrase = phraseMap[item.phraseId];
      if (!phrase) return;
      setCurrentText({ text: phrase.text, confidence: Math.round(item.confidence * 100), time: stamp(), pending: false });
    }, 7200);
    return () => window.clearInterval(timer);
  }, [demoRunning, phraseMap]);

  const createMessage = (text, confidence = 100, source = "Quick phrase") => {
    const clean = text.trim();
    if (!clean) return;
    const time = stamp();
    setCurrentText({ text: clean, confidence, time, pending: false });
    setHistoryItems((items) => [{ id: Date.now(), text: clean, time, source, confidence }, ...items].slice(0, 50));
    setManualText("");
  };
  const choosePhrase = (phrase) => createMessage(phrase.text, 100, "Selected phrase");
  const filteredHistory = historyItems.filter((entry) => activeTab === "all" || (activeTab === "phrases" ? entry.source !== "Demo sample" : entry.source === "Demo sample"));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Waves size={23} strokeWidth={2.3} /></div>
          <div><div className="brand-name">vocalis<span>x</span></div><div className="brand-caption">SILENT SPEECH PROJECT</div></div>
          <IconButton label="Close navigation" className="mobile-close" onClick={() => setMenuOpen(false)}><X size={18}/></IconButton>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <button className={view === "communication" ? "nav-item active" : "nav-item"} onClick={() => {setView("communication");setMenuOpen(false);}}><MessageCircle size={18}/><span>Communication</span><span className="nav-pip"/></button>
          <button className={view === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => {setView("dashboard");setMenuOpen(false);}}><Activity size={18}/><span>Signal dashboard</span></button>
          <button className={view === "history" ? "nav-item active" : "nav-item"} onClick={() => {setView("history");setMenuOpen(false);}}><History size={18}/><span>Message history</span><span className="nav-count">{historyItems.length}</span></button>
        </nav>
        <div className="sidebar-divider"/>
        <div className="workspace-label">DEVICE</div>
        <div className="device-mini">
          <div className="device-mini-icon"><Cpu size={18}/></div>
          <div className="device-mini-copy"><strong>VocalisX collar</strong><span><i className="status-dot"/> Demo simulation</span></div>
          <ChevronDown size={15} className="device-chevron"/>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><div className="help-icon"><CircleHelp size={17}/></div><div><b>Building VocalisX?</b><p>Phase 1 · UI prototype</p><button onClick={() => setView("dashboard")}>View signal panel <ArrowUpRight size={13}/></button></div></div>
          <div className="profile-row"><div className="profile-avatar">VX</div><div className="profile-info"><strong>Project workspace</strong><span>Local demo</span></div><IconButton label="Workspace settings" onClick={() => setView("dashboard")}><Settings2 size={17}/></IconButton></div>
        </div>
      </aside>
      {menuOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><IconButton label="Open navigation" className="mobile-menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></IconButton><div className="breadcrumbs"><span>VocalisX</span><span className="crumb-slash">/</span><strong>{view === "communication" ? "Communication" : view === "dashboard" ? "Signal dashboard" : "Message history"}</strong></div></div>
          <div className="topbar-right"><span className="topbar-date"><Clock3 size={14}/>{new Date().toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" })}</span><span className="topbar-separator"/><Badge tone="warning" dot>Simulation mode</Badge><div className="topbar-avatar">VX</div></div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line"/>ASSISTIVE COMMUNICATION</div><h1>{view === "communication" ? "A voice, without sound." : view === "dashboard" ? "Signal observability." : "Message history."}</h1><p className="page-lede">{view === "communication" ? "Turn intended words into a message the world can see." : view === "dashboard" ? "Explore the simulated sensor stream and prepare for hardware integration." : "A record of phrases selected and sample predictions in this session."}</p></div>
            <div className="heading-actions"><span className="session-chip"><span className="session-dot"/>SESSION ACTIVE</span><button className="secondary-button" onClick={() => setDemoRunning((v) => !v)}>{demoRunning ? <><span className="button-dot"/>Pause demo</> : <><Zap size={15}/>Resume demo</>}</button></div>
          </div>
          <div className="demo-notice"><div className="notice-icon"><Info size={17}/></div><div><strong>Phase 1 preview · simulated data</strong><span>Words, signal values and sensor activity shown here are examples only. No collar hardware or trained recognition model is connected.</span></div><button aria-label="Go to signal dashboard" onClick={() => setView("dashboard")}>Explore signal data <ArrowUpRight size={14}/></button></div>

          {view === "communication" && <CommunicationView currentText={currentText} phrases={PHRASES} onPhrase={choosePhrase} onSend={() => createMessage(manualText, 100, "Typed message")} manualText={manualText} setManualText={setManualText} historyItems={historyItems} onNavigateHistory={() => setView("history")} />}
          {view === "dashboard" && <DashboardView samples={samples} signal={signal} sampleCount={sampleCount} demoRunning={demoRunning} setDemoRunning={setDemoRunning} />}
          {view === "history" && <HistoryView entries={filteredHistory} activeTab={activeTab} setActiveTab={setActiveTab} onClear={() => setHistoryItems([])} onRepeat={(entry) => createMessage(entry.text, entry.confidence, "Repeated message")} />}
          <footer className="page-footer"><div><span className="footer-logo"><Waves size={15}/></span><span>VocalisX <b>·</b> making communication more accessible</span></div><span>Prototype v0.1 <i/> Phase 1</span></footer>
        </div>
      </main>
    </div>
  );
}

function CommunicationView({ currentText, phrases, onPhrase, onSend, manualText, setManualText, historyItems, onNavigateHistory }) {
  return <div className="communication-layout">
    <section className="primary-column">
      <div className="panel live-output-panel">
        <div className="output-head"><PanelTitle icon={AudioLines} title="Communication output" subtitle="Your message appears here"/><Badge tone="purple" dot>LIVE PREVIEW</Badge></div>
        <div className="output-stage">
          <div className="output-orb"><span/><Waves size={31}/></div>
          <div className="output-label"><span className="output-label-dot"/>LATEST MESSAGE</div>
          <div className="recognized-text" aria-live="polite" aria-atomic="true">{currentText.text || "Your words will appear here"}</div>
          <div className="output-meta"><span><Check size={14}/>Ready to share</span><span className="meta-divider"/><span><Clock3 size={13}/>{currentText.time || "—"}</span><span className="confidence-pill">{currentText.confidence}% demo confidence</span></div>
          <p className="output-disclaimer">Example output · not a real AI prediction</p>
        </div>
        <div className="output-bottom"><span><ShieldCheck size={15}/> You stay in control of every message.</span><span className="privacy-label"><span/>No account required</span></div>
      </div>

      <div className="panel phrase-panel">
        <PanelTitle icon={Sparkles} title="Quick phrases" subtitle="Tap a phrase to display it as a message"/>
        <div className="phrase-grid">{phrases.map((phrase) => <button key={phrase.id} className={`phrase-card phrase-${phrase.category.toLowerCase()}`} onClick={() => onPhrase(phrase)}><span className="phrase-icon">{phrase.icon}</span><span className="phrase-text">{phrase.text}</span><ArrowUpRight size={15} className="phrase-arrow"/></button>)}</div>
        <div className="phrase-footnote"><Info size={14}/><span>Quick phrases are UI controls, not sensor-recognised words. We’ll connect the model in a later phase.</span></div>
      </div>

      <div className="panel type-panel">
        <div className="type-copy"><div className="type-icon"><MessageCircle size={17}/></div><div><h3>Type a message</h3><p>A keyboard fallback for communication.</p></div></div>
        <form className="type-form" onSubmit={(e) => { e.preventDefault(); onSend(); }}><input aria-label="Write a message" value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Write something to communicate…" maxLength={240}/><button className="send-button" type="submit" disabled={!manualText.trim()}><Send size={15}/> Display</button></form>
      </div>
    </section>

    <aside className="right-column">
      <div className="panel status-panel">
        <PanelTitle icon={Radio} title="Device status" subtitle="Current session"/>
        <div className="status-card"><div className="status-card-top"><div className="device-illustration"><Waves size={26}/><span/></div><div><strong>VocalisX collar</strong><span className="status-online"><i/>Simulated device</span></div><Badge tone="warning">DEMO</Badge></div><div className="status-stats"><div><span>Connection</span><b><i className="tiny-dot"/>Simulated</b></div><div><span>Signal stream</span><b className="green-value">Active</b></div><div><span>Battery</span><b><BatteryCharging size={14}/> —</b></div></div></div>
        <div className="status-info"><Info size={15}/><span>Live hardware status will be available after ESP32 integration.</span></div>
      </div>

      <div className="panel recent-panel">
        <div className="recent-title"><PanelTitle icon={History} title="Recent messages"/><button className="text-action" onClick={onNavigateHistory}>View all <ArrowUpRight size={13}/></button></div>
        {historyItems.length ? <div className="recent-list">{historyItems.slice(0, 4).map((item, i) => <div key={item.id} className="recent-item"><div className={`recent-marker recent-marker-${i % 3}`}>{item.source === "Demo sample" ? <Activity size={14}/> : <MessageCircle size={14}/>}</div><div className="recent-message"><strong>{item.text}</strong><span>{item.source}</span></div><time>{item.time}</time></div>)}</div> : <div className="empty-state small-empty"><History size={22}/><p>No messages yet</p></div>}
        <button className="full-history-button" onClick={onNavigateHistory}>Open message history <ArrowUpRight size={14}/></button>
      </div>

      <div className="care-card"><div className="care-top"><div className="care-symbol"><Heart size={16}/></div><span>DESIGNED AROUND PEOPLE</span></div><h3>Communication comes first.</h3><p>VocalisX is being built to support a person’s voice, choice and independence. This prototype is not for emergency or clinical use.</p><div className="care-line"/></div>
    </aside>
  </div>;
}

function DashboardView({ samples, signal, sampleCount, demoRunning, setDemoRunning }) {
  const [timeRange, setTimeRange] = useState("10s");
  const chartData = useMemo(() => samples.map((value, i) => ({ time: i, emg: value, positive: Math.max(0, value) })), [samples]);
  return <div className="dashboard-grid">
    <div className="dashboard-main">
      <div className="panel signal-panel">
        <div className="signal-panel-heading"><PanelTitle icon={Waves} title="sEMG signal monitor" subtitle="Mock waveform · arbitrary normalized units"/><div className="chart-controls"><Badge tone={demoRunning ? "success" : "neutral"} dot>{demoRunning ? "Streaming" : "Paused"}</Badge><button className="range-button" onClick={() => setTimeRange((v) => v === "10s" ? "30s" : "10s")}>{timeRange}<ChevronDown size={14}/></button></div></div>
        <div className="signal-chart-legend"><span><i className="legend-emg"/>EMG amplitude</span><span><i className="legend-zero"/>Baseline</span><span className="mock-tag">SIMULATED</span></div>
        <div className="chart-container"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="emgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5dfc" stopOpacity={0.24}/><stop offset="95%" stopColor="#6d5dfc" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#eef0f6" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="time" tickLine={false} axisLine={false} tick={false}/><YAxis domain={[-1,1]} tickCount={5} tickLine={false} axisLine={false} tick={{ fill:"#8b95a8",fontSize:11 }}/><Tooltip contentStyle={chartTooltip} formatter={(v) => [Number(v).toFixed(3), "Normalized signal"]} labelFormatter={() => "Simulated sample"}/><Area type="monotone" dataKey="emg" stroke="#7968f7" strokeWidth={2} fill="url(#emgFill)" isAnimationActive={false} dot={false}/></AreaChart></ResponsiveContainer></div>
        <div className="chart-xlabels"><span>Older samples</span><span>Live <span className="live-wave-dot"/></span></div>
        <div className="chart-footer"><span><CircleDot size={13}/>Sample count: {sampleCount.toLocaleString()}</span><button className="subtle-button" onClick={() => setDemoRunning((v) => !v)}>{demoRunning ? "Pause stream" : "Resume stream"}</button></div>
      </div>

      <div className="metric-grid">
        <MetricCard icon={Activity} label="EMG RMS" value={signal.emgRms.toFixed(3)} unit="norm." note="Mock signal strength" tone="purple"/>
        <MetricCard icon={Zap} label="EMG peak" value={signal.emgPeak.toFixed(3)} unit="norm." note="Mock peak amplitude" tone="amber"/>
        <MetricCard icon={Signal} label="Stream samples" value={sampleCount.toLocaleString()} unit="samples" note="Since this session" tone="blue"/>
      </div>

      <div className="panel imu-panel"><PanelTitle icon={SlidersHorizontal} title="IMU orientation" subtitle="Mock accelerometer and gyroscope readings"/><div className="imu-sections"><div className="imu-group"><div className="imu-group-title"><span>ACCELEROMETER</span><span>g</span></div><div className="axis-rows">{["X","Y","Z"].map((axis,i)=><AxisRow key={axis} axis={axis} value={signal.accel[i]} max={1.2}/>)}</div></div><div className="imu-group"><div className="imu-group-title"><span>GYROSCOPE</span><span>°/s · demo</span></div><div className="axis-rows">{["X","Y","Z"].map((axis,i)=><AxisRow key={axis} axis={axis} value={signal.gyro[i]} max={1}/>)}</div></div></div><div className="imu-footnote"><Info size={14}/>Orientation estimates are not computed in Phase 1; values are mock data.</div></div>
    </div>
    <aside className="dashboard-side">
      <div className="panel signal-state-panel"><PanelTitle icon={Activity} title="Signal state"/><div className="state-visual"><div className={`state-ring ${signal.activity.includes("Articulation") ? "state-ring-active" : ""}`}><div className="state-ring-inner"><Waves size={25}/></div><span className="ring-dot ring-dot-one"/><span className="ring-dot ring-dot-two"/><span className="ring-dot ring-dot-three"/></div><Badge tone={signal.activity.includes("Articulation") ? "purple" : "neutral"} dot>{signal.activity}</Badge><p>Example activity label generated by the demo, not detected articulation.</p></div><div className="state-separator"/><div className="state-row"><span>Input source</span><b>Signal simulator</b></div><div className="state-row"><span>Device link</span><b><i className="tiny-dot"/> Not connected</b></div><div className="state-row"><span>Sample rate</span><b>Not measured</b></div></div>
      <div className="panel pipeline-panel"><PanelTitle icon={Cpu} title="Recognition pipeline" subtitle="Planned integration path"/><div className="pipeline-list"><PipelineItem number="01" title="Sensor acquisition" status="Planned" desc="ESP32-S3 sample stream" /><PipelineItem number="02" title="Signal processing" status="Planned" desc="Filter and window EMG data" /><PipelineItem number="03" title="Word classifier" status="Not trained" desc="Personalised fixed vocabulary" /><PipelineItem number="04" title="Text output" status="UI ready" desc="Communication display" last /></div><div className="pipeline-notice"><Info size={14}/><span>No AI model is connected or trained yet.</span></div></div>
      <div className="dashboard-tip"><div><Sparkles size={17}/></div><strong>Next milestone</strong><p>Validate signal quality with real sEMG recordings before collecting labelled word samples.</p></div>
    </aside>
  </div>;
}

function MetricCard({ icon: Icon, label, value, unit, note, tone }) {
  return <div className="panel metric-card"><div className={`metric-icon metric-icon-${tone}`}><Icon size={17}/></div><span className="metric-label">{label}</span><div className="metric-value">{value}<small>{unit}</small></div><span className="metric-note">{note}</span></div>;
}
function AxisRow({ axis, value, max }) {
  const width = Math.min(100, Math.abs(value) / max * 100);
  return <div className="axis-row"><span className="axis-label">{axis}</span><div className="axis-track"><i style={{width: `${width}%`}}/></div><span className="axis-value">{value.toFixed(2)}</span></div>;
}
function PipelineItem({ number, title, status, desc, last }) {
  return <div className={`pipeline-item ${last ? "pipeline-last" : ""}`}><div className="pipeline-number">{number}</div><div className="pipeline-copy"><strong>{title}</strong><span>{desc}</span></div><span className={`pipeline-status ${status === "UI ready" ? "status-ready" : ""}`}>{status}</span></div>;
}

function HistoryView({ entries, activeTab, setActiveTab, onClear, onRepeat }) {
  return <div className="panel history-page-panel">
    <div className="history-head"><PanelTitle icon={History} title="Communication history" subtitle="Messages created in this browser session"/><button className="secondary-button" onClick={onClear}><RotateCcw size={15}/>Clear history</button></div>
    <div className="history-toolbar"><div className="history-tabs"><button className={activeTab === "all" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("all")}>All messages <span>{entries.length}</span></button><button className={activeTab === "phrases" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("phrases")}>Quick / typed</button><button className={activeTab === "demo" ? "history-tab selected" : "history-tab"} onClick={() => setActiveTab("demo")}>Demo samples</button></div><Badge tone="warning">Local session only</Badge></div>
    {entries.length ? <div className="history-table-wrap"><table className="history-table"><thead><tr><th>MESSAGE</th><th>SOURCE</th><th>TIME</th><th>DEMO SCORE</th><th/></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td><span className="history-message-icon"><MessageCircle size={15}/></span><strong>{entry.text}</strong></td><td><span className="source-label">{entry.source}</span></td><td>{entry.time}</td><td><span className="score-label">{entry.confidence}% <span>example</span></span></td><td><button className="repeat-button" onClick={() => onRepeat(entry)} title="Display this message again"><RotateCcw size={14}/>Repeat</button></td></tr>)}</tbody></table></div> : <div className="empty-state"><History size={28}/><h3>No messages in this view</h3><p>Select a quick phrase or type a message to see it here.</p></div>}
    <div className="history-footnote"><Info size={15}/>History remains in React memory only and clears on refresh. It is not saved to a server.</div>
  </div>;
}