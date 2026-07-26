"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FilePlus2,
  GraduationCap,
  HardHat,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ModuleKey =
  | "Overview"
  | "Incidents"
  | "RAMS"
  | "Inspections"
  | "Training"
  | "Compliance"
  | "Marketplace";

const chartData = [
  { month: "Feb", score: 68, incidents: 7 },
  { month: "Mar", score: 72, incidents: 6 },
  { month: "Apr", score: 76, incidents: 5 },
  { month: "May", score: 79, incidents: 5 },
  { month: "Jun", score: 83, incidents: 3 },
  { month: "Jul", score: 87, incidents: 2 },
];

const navItems: { label: ModuleKey; icon: typeof LayoutDashboard; badge?: string }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Incidents", icon: AlertTriangle, badge: "3" },
  { label: "RAMS", icon: FileCheck2 },
  { label: "Inspections", icon: ClipboardCheck, badge: "5" },
  { label: "Training", icon: GraduationCap },
  { label: "Compliance", icon: ShieldCheck },
  { label: "Marketplace", icon: BriefcaseBusiness },
];

const actions = [
  { title: "Mobile plant inspection", meta: "North Yard · due today", level: "red", owner: "AH" },
  { title: "Working at height RAMS", meta: "Approval overdue by 2 days", level: "red", owner: "JM" },
  { title: "First aid certificate", meta: "Sarah K. · expires in 12 days", level: "amber", owner: "SK" },
  { title: "Close corrective action #128", meta: "Warehouse 3 · due 29 Jul", level: "amber", owner: "DO" },
];

const incidents = [
  { id: "INC-0248", type: "Near miss", location: "North Yard", date: "25 Jul 2026", severity: "Medium", status: "Investigating" },
  { id: "INC-0247", type: "Unsafe condition", location: "Warehouse 3", date: "24 Jul 2026", severity: "Low", status: "Action open" },
  { id: "INC-0246", type: "Recordable", location: "Fabrication Shop", date: "21 Jul 2026", severity: "High", status: "Review due" },
  { id: "INC-0245", type: "Near miss", location: "Main Site", date: "18 Jul 2026", severity: "Low", status: "Closed" },
];

const rams = [
  { title: "Working at height – roof access", version: "v3", owner: "James Miller", risk: "Medium", status: "Awaiting approval" },
  { title: "Mobile crane lifting operation", version: "v2", owner: "Aisha Hassan", risk: "High", status: "Changes requested" },
  { title: "Confined space tank entry", version: "v5", owner: "David Okoro", risk: "Medium", status: "Approved" },
  { title: "Electrical isolation – Panel B", version: "v1", owner: "Sarah King", risk: "Low", status: "Draft" },
];

const inspections = [
  { title: "Weekly site walk", location: "Main Site", date: "Today, 14:00", progress: 0, status: "Scheduled" },
  { title: "Mobile plant inspection", location: "North Yard", date: "Due today", progress: 35, status: "In progress" },
  { title: "Fire equipment check", location: "Warehouse 3", date: "28 Jul", progress: 0, status: "Scheduled" },
  { title: "Welfare facilities audit", location: "Fabrication Shop", date: "Completed 24 Jul", progress: 100, status: "Complete" },
];

const consultants = [
  { initials: "EN", name: "Eleanor Nash", role: "Chartered H&S Consultant", tags: ["ISO 45001", "Construction"], rating: "4.9", rate: "£650/day", tone: "teal" },
  { initials: "MA", name: "Michael Adeyemi", role: "Environmental & ESG Lead", tags: ["ISO 14001", "ESG"], rating: "4.8", rate: "£575/day", tone: "navy" },
  { initials: "SA", name: "Samir Al-Mansoori", role: "Process Safety Specialist", tags: ["COMAH", "Oil & Gas"], rating: "5.0", rate: "£780/day", tone: "amber" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`} aria-label="ProAct HSE Pro">
      <div className="brand-mark"><ShieldCheck size={23} strokeWidth={2.5} /></div>
      {!compact && <div><strong>ProAct</strong><span>HSE PRO</span></div>}
    </div>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`status-pill ${tone}`}><i />{children}</span>;
}

function EmptyIllustration() {
  return (
    <div className="empty-illustration" aria-hidden="true">
      <div><ClipboardCheck size={30} /></div>
      <CheckCircle2 size={19} />
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<ModuleKey>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [incidentType, setIncidentType] = useState("Near miss");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredIncidents = useMemo(
    () => incidents.filter((item) => `${item.id} ${item.type} ${item.location}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const chooseModule = (label: ModuleKey) => {
    setActive(label);
    setSidebarOpen(false);
  };

  const submitIncident = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalOpen(false);
    setToast(`${incidentType} saved as draft — ready to review`);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <BrandMark />
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <div className="org-switcher">
          <div className="org-icon"><Building2 size={18} /></div>
          <div><strong>Apex Infrastructure</strong><span>Company Standard</span></div>
          <ChevronDown size={16} />
        </div>
        <nav aria-label="Primary navigation">
          <span className="nav-label">WORKSPACE</span>
          {navItems.map((item) => (
            <button key={item.label} className={active === item.label ? "active" : ""} onClick={() => chooseModule(item.label)}>
              <item.icon size={19} /><span>{item.label}</span>{item.badge && <b>{item.badge}</b>}
            </button>
          ))}
          <span className="nav-label lower">MANAGE</span>
          <button><Users size={19} /><span>People & teams</span></button>
          <button><BookOpenCheck size={19} /><span>Documents</span></button>
          <button><Settings size={19} /><span>Settings</span></button>
        </nav>
        <div className="plan-card">
          <div className="plan-icon"><Sparkles size={17} /></div>
          <div><strong>Company Standard</strong><span>18 of 25 seats used</span></div>
          <div className="progress"><i /></div>
          <button onClick={() => setToast("Plan comparison opened")}>Manage plan <ArrowRight size={14} /></button>
        </div>
        <div className="user-block">
          <div className="avatar">AK</div>
          <div><strong>Alex King</strong><span>Company Admin</span></div>
          <MoreHorizontal size={18} />
        </div>
      </aside>
      <div className={`sidebar-scrim ${sidebarOpen ? "visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="mobile-brand"><BrandMark compact /></div>
          <div className="global-search">
            <Search size={18} />
            <input aria-label="Search ProAct HSE Pro" placeholder="Search incidents, RAMS, people..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-actions">
            <button className="ai-button" onClick={() => setToast("ProAct AI is ready to help")}><Sparkles size={16} /> Ask ProAct AI</button>
            <button className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="top-avatar">AK</div>
          </div>
          {notificationsOpen && (
            <div className="notification-panel">
              <div><strong>Notifications</strong><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={17} /></button></div>
              <article><span className="note-icon red"><AlertTriangle size={16} /></span><p><b>Approval overdue</b><small>Working at height RAMS needs review</small></p><time>12m</time></article>
              <article><span className="note-icon amber"><Clock3 size={16} /></span><p><b>Certificate expiring</b><small>First aid certificate expires in 12 days</small></p><time>1h</time></article>
              <article><span className="note-icon green"><Check size={16} /></span><p><b>Inspection complete</b><small>Welfare facilities audit scored 94%</small></p><time>3h</time></article>
              <button className="view-all">View all notifications</button>
            </div>
          )}
        </header>

        <main id="main">
          {active === "Overview" && <Overview onNewIncident={() => setModalOpen(true)} onNavigate={chooseModule} setToast={setToast} />}
          {active === "Incidents" && <IncidentsView items={filteredIncidents} onNew={() => setModalOpen(true)} search={search} setSearch={setSearch} setToast={setToast} />}
          {active === "RAMS" && <RamsView setToast={setToast} />}
          {active === "Inspections" && <InspectionsView setToast={setToast} />}
          {active === "Training" && <TrainingView setToast={setToast} />}
          {active === "Compliance" && <ComplianceView setToast={setToast} />}
          {active === "Marketplace" && <MarketplaceView setToast={setToast} />}
        </main>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="incident-title">
            <div className="modal-header">
              <div><span className="eyebrow">QUICK CAPTURE</span><h2 id="incident-title">Report an incident</h2><p>Capture the essentials now. You can complete the investigation later.</p></div>
              <button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close incident form"><X size={20} /></button>
            </div>
            <form onSubmit={submitIncident}>
              <label>Incident type<select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}><option>Near miss</option><option>Unsafe condition</option><option>Recordable incident</option><option>Environmental event</option></select></label>
              <div className="form-row">
                <label>Location<input required placeholder="e.g. North Yard" /></label>
                <label>Date & time<input required type="datetime-local" /></label>
              </div>
              <label>What happened?<textarea required placeholder="Describe what you saw or what happened..." rows={4} /></label>
              <button type="button" className="ai-suggestion" onClick={() => setToast("AI guidance added to the form")}><Sparkles size={17} /><span><strong>Improve with ProAct AI</strong><small>Check for missing details and clarify the narrative</small></span><ChevronRight size={18} /></button>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit">Save incident <ArrowRight size={16} /></button></div>
            </form>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button onClick={() => setToast("")} aria-label="Dismiss"><X size={16} /></button></div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, actions: actionSlot }: { eyebrow: string; title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
      {actionSlot && <div className="heading-actions">{actionSlot}</div>}
    </div>
  );
}

function Overview({ onNewIncident, onNavigate, setToast }: { onNewIncident: () => void; onNavigate: (key: ModuleKey) => void; setToast: (message: string) => void }) {
  return (
    <div className="page">
      <PageHeading
        eyebrow="SUNDAY, 26 JULY"
        title="Good morning, Alex."
        subtitle="Here’s what needs your attention across Apex Infrastructure."
        actions={<><button className="secondary-button" onClick={() => setToast("Report is being prepared")}><FilePlus2 size={16} /> Generate report</button><button className="primary-button" onClick={onNewIncident}><Plus size={17} /> Report incident</button></>}
      />

      <section className="command-card">
        <div className="score-block">
          <div className="score-ring"><span>87</span><small>/100</small></div>
          <div><span className="eyebrow light">ORGANISATION HEALTH</span><h2>Your compliance is strong</h2><p>Up 4 points this month. Two priority actions need attention to stay on track.</p><div className="trend-up"><ArrowUpRight size={15} /> 4.8% improvement</div></div>
        </div>
        <div className="status-grid">
          <button onClick={() => onNavigate("Incidents")}><span className="status-dot red" /><div><strong>2</strong><small>Priority risks</small></div><ChevronRight size={18} /></button>
          <button onClick={() => onNavigate("Inspections")}><span className="status-dot amber" /><div><strong>7</strong><small>Due this week</small></div><ChevronRight size={18} /></button>
          <button onClick={() => onNavigate("Compliance")}><span className="status-dot green" /><div><strong>91%</strong><small>Controls effective</small></div><ChevronRight size={18} /></button>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Incident-free days" value="46" note="Best: 124 days" trend="12 days" up icon={HardHat} tone="navy" />
        <MetricCard label="Open actions" value="14" note="2 overdue" trend="3 this week" icon={ClipboardCheck} tone="amber" />
        <MetricCard label="Training compliance" value="94%" note="5 certificates due" trend="2.1%" up icon={GraduationCap} tone="green" />
        <MetricCard label="Inspections completed" value="28" note="of 31 scheduled" trend="90%" up icon={FileCheck2} tone="blue" />
      </section>

      <section className="dashboard-grid">
        <div className="panel performance-panel">
          <div className="panel-heading"><div><h3>Safety performance</h3><p>Compliance score across the last 6 months</p></div><button className="period-button">Last 6 months <ChevronDown size={15} /></button></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -24, bottom: 0 }}>
                <defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2e86ab" stopOpacity={0.26}/><stop offset="95%" stopColor="#2e86ab" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke="#edf1f3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#788991", fontSize: 12 }} />
                <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fill: "#9aa7ad", fontSize: 11 }} />
                <Tooltip contentStyle={{ border: "0", borderRadius: 10, boxShadow: "0 8px 30px rgba(25,54,67,.14)" }} />
                <Area type="monotone" dataKey="score" stroke="#2e86ab" strokeWidth={3} fill="url(#scoreFill)" />
                <Line type="monotone" dataKey="score" stroke="#2e86ab" dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-summary"><span><i className="blue" /> Compliance score</span><strong>87%</strong><small>+4 pts vs. Jun</small></div>
        </div>

        <div className="panel attention-panel">
          <div className="panel-heading"><div><h3>Needs attention</h3><p>Prioritised by risk and due date</p></div><button className="text-button" onClick={() => onNavigate("Incidents")}>View all <ArrowRight size={15} /></button></div>
          <div className="action-list">
            {actions.map((action) => <button key={action.title} onClick={() => setToast(`${action.title} opened`)}><span className={`risk-line ${action.level}`} /><div><strong>{action.title}</strong><small>{action.meta}</small></div><span className="owner">{action.owner}</span><ChevronRight size={17} /></button>)}
          </div>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel activity-panel">
          <div className="panel-heading"><div><h3>Recent activity</h3><p>Your organisation’s latest updates</p></div><button className="text-button">View audit trail <ArrowRight size={15} /></button></div>
          <div className="timeline">
            <Timeline icon={CheckCircle2} tone="green" title="Inspection completed" text="David Okoro completed Welfare Facilities Audit · 94% score" time="34 min ago" />
            <Timeline icon={FileCheck2} tone="blue" title="RAMS submitted for approval" text="James Miller submitted Working at Height – Roof Access v3" time="2 hours ago" />
            <Timeline icon={AlertTriangle} tone="amber" title="Near miss reported" text="Aisha Hassan reported an event at North Yard" time="Yesterday, 16:42" />
          </div>
        </div>
        <div className="panel quick-panel">
          <div className="panel-heading"><div><h3>Quick actions</h3><p>Start a common workflow</p></div></div>
          <div className="quick-grid">
            <button onClick={onNewIncident}><span className="quick-icon red"><AlertTriangle size={19} /></span><div><strong>Report incident</strong><small>Capture an event</small></div><ChevronRight size={16} /></button>
            <button onClick={() => onNavigate("RAMS")}><span className="quick-icon blue"><FilePlus2 size={19} /></span><div><strong>Create RAMS</strong><small>Assess a task</small></div><ChevronRight size={16} /></button>
            <button onClick={() => onNavigate("Inspections")}><span className="quick-icon green"><ClipboardCheck size={19} /></span><div><strong>Start inspection</strong><small>Use a checklist</small></div><ChevronRight size={16} /></button>
            <button onClick={() => onNavigate("Marketplace")}><span className="quick-icon purple"><Users size={19} /></span><div><strong>Find a consultant</strong><small>Get expert support</small></div><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>
      <div className="proof-strip"><ShieldCheck size={17} /><span>Every action is protected by role-based access and recorded in your immutable audit trail.</span><button onClick={() => onNavigate("Compliance")}>View security controls <ArrowRight size={14} /></button></div>
    </div>
  );
}

function MetricCard({ label, value, note, trend, up, icon: Icon, tone }: { label: string; value: string; note: string; trend: string; up?: boolean; icon: typeof HardHat; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={20} /></div><span>{label}</span><div className="metric-value"><strong>{value}</strong><small className={up ? "positive" : ""}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{trend}</small></div><p>{note}</p></article>;
}

function Timeline({ icon: Icon, tone, title, text, time }: { icon: typeof CheckCircle2; tone: string; title: string; text: string; time: string }) {
  return <div className="timeline-item"><span className={`timeline-icon ${tone}`}><Icon size={16} /></span><div><strong>{title}</strong><p>{text}</p></div><time>{time}</time></div>;
}

function IncidentsView({ items, onNew, search, setSearch, setToast }: { items: typeof incidents; onNew: () => void; search: string; setSearch: (v: string) => void; setToast: (v: string) => void }) {
  return <div className="page">
    <PageHeading eyebrow="CAPTURE & INVESTIGATE" title="Incident management" subtitle="Report, investigate and close the loop on every safety event." actions={<button className="primary-button" onClick={onNew}><Plus size={17} /> Report incident</button>} />
    <div className="summary-row"><SummaryStat label="Open incidents" value="8" detail="2 high priority" tone="red" /><SummaryStat label="Avg. closure time" value="6.2 days" detail="↓ 1.4 days" tone="green" /><SummaryStat label="Near-miss ratio" value="4.8 : 1" detail="Healthy reporting" tone="blue" /><SummaryStat label="RIDDOR reportable" value="1" detail="Submission in review" tone="amber" /></div>
    <div className="panel data-panel">
      <div className="table-tools"><div className="inner-search"><Search size={17} /><input aria-label="Search incidents" placeholder="Search incidents..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><button className="filter-button">All statuses <ChevronDown size={15} /></button><button className="filter-button">Last 90 days <ChevronDown size={15} /></button></div>
      <div className="data-table">
        <div className="table-row table-head"><span>REFERENCE</span><span>EVENT</span><span>LOCATION</span><span>DATE</span><span>SEVERITY</span><span>STATUS</span><span /></div>
        {items.map((item) => <button className="table-row" key={item.id} onClick={() => setToast(`${item.id} opened for review`)}><strong>{item.id}</strong><span>{item.type}</span><span>{item.location}</span><span>{item.date}</span><span><StatusPill tone={item.severity.toLowerCase()}>{item.severity}</StatusPill></span><span>{item.status}</span><ChevronRight size={17} /></button>)}
      </div>
      {!items.length && <div className="empty-state"><EmptyIllustration /><h3>No incidents found</h3><p>Try a different search or clear the current filters.</p></div>}
    </div>
  </div>;
}

function RamsView({ setToast }: { setToast: (v: string) => void }) {
  return <div className="page">
    <PageHeading eyebrow="ASSESS & CONTROL" title="Risk assessments & RAMS" subtitle="Build safer methods of work with structured MEEPS risk assessment." actions={<button className="primary-button" onClick={() => setToast("New RAMS builder started")}><Sparkles size={17} /> Create with AI</button>} />
    <div className="feature-banner"><div className="feature-copy"><span className="banner-icon"><Sparkles size={20} /></span><div><span className="eyebrow light">PROACT AI ASSISTANT</span><h2>Turn a task description into a stronger first draft.</h2><p>Identify hazards across Materials, Equipment, Environment, People and Systems—then review every suggestion before approval.</p></div></div><button onClick={() => setToast("AI RAMS assistant opened")}>Start a guided RAMS <ArrowRight size={16} /></button></div>
    <div className="panel cards-panel"><div className="panel-heading"><div><h3>Recent RAMS</h3><p>Drafts, submissions and approved assessments</p></div><button className="text-button">View archive <ArrowRight size={15} /></button></div>
      <div className="record-grid">{rams.map((item) => <button className="record-card" key={item.title} onClick={() => setToast(`${item.title} opened`)}><div className="document-symbol"><FileCheck2 size={22} /></div><div className="record-main"><div><StatusPill tone={item.status === "Approved" ? "green" : item.status === "Changes requested" ? "high" : "amber"}>{item.status}</StatusPill><span className="version">{item.version}</span></div><h3>{item.title}</h3><p>Owner: {item.owner}</p><div className="record-footer"><span>Residual risk</span><b className={`risk-text ${item.risk.toLowerCase()}`}>{item.risk}</b></div></div><ChevronRight size={18} /></button>)}</div>
    </div>
  </div>;
}

function InspectionsView({ setToast }: { setToast: (v: string) => void }) {
  return <div className="page">
    <PageHeading eyebrow="CHECK & VERIFY" title="Inspections" subtitle="Stay ahead of defects with scheduled, mobile-ready checks." actions={<><button className="secondary-button"><CalendarDays size={16} /> Calendar</button><button className="primary-button" onClick={() => setToast("Inspection checklist opened")}><Plus size={17} /> Start inspection</button></>} />
    <div className="summary-row"><SummaryStat label="Due today" value="2" detail="1 in progress" tone="amber" /><SummaryStat label="Overdue" value="3" detail="Requires attention" tone="red" /><SummaryStat label="Pass rate" value="91%" detail="↑ 3.2%" tone="green" /><SummaryStat label="Open findings" value="12" detail="4 high risk" tone="blue" /></div>
    <div className="inspection-layout"><div className="panel schedule-panel"><div className="panel-heading"><div><h3>Upcoming schedule</h3><p>This week across all locations</p></div><button className="period-button">Week 30 <ChevronDown size={15} /></button></div>
      <div className="schedule-list">{inspections.map((item) => <button key={item.title} onClick={() => setToast(`${item.title} opened`)}><div className={`date-tile ${item.status === "Complete" ? "done" : ""}`}><strong>{item.date.startsWith("Today") || item.date.startsWith("Due") ? "26" : item.date.match(/\d+/)?.[0]}</strong><span>JUL</span></div><div className="schedule-copy"><strong>{item.title}</strong><span>{item.location} · {item.date}</span>{item.progress > 0 && item.progress < 100 && <div className="mini-progress"><i style={{ width: `${item.progress}%` }} /></div>}</div><StatusPill tone={item.status === "Complete" ? "green" : item.status === "In progress" ? "blue" : "neutral"}>{item.status}</StatusPill><ChevronRight size={17} /></button>)}</div>
    </div><div className="panel insight-panel"><div className="panel-heading"><div><h3>Inspection insight</h3><p>AI-detected pattern</p></div><Zap size={18} /></div><div className="insight-body"><div className="insight-ring"><span>3×</span></div><h3>Housekeeping findings are rising</h3><p>Three locations recorded repeated access-route obstructions this month.</p><button onClick={() => setToast("Corrective action created")}>Create group action <ArrowRight size={15} /></button></div></div></div>
  </div>;
}

function TrainingView({ setToast }: { setToast: (v: string) => void }) {
  const courses = [
    { name: "Manual Handling Essentials", assigned: 18, complete: 94, due: "31 Jul" },
    { name: "Working at Height Awareness", assigned: 12, complete: 83, due: "05 Aug" },
    { name: "Environmental Spill Response", assigned: 8, complete: 63, due: "12 Aug" },
  ];
  return <div className="page">
    <PageHeading eyebrow="BUILD CAPABILITY" title="Training & competence" subtitle="Keep every role competent, current and audit-ready." actions={<button className="primary-button" onClick={() => setToast("Course assignment opened")}><Plus size={17} /> Assign training</button>} />
    <div className="training-hero"><div><span className="eyebrow light">ORGANISATION COMPLIANCE</span><strong>94%</strong><h2>Training is on track</h2><p>169 of 180 required learning items are current.</p></div><div className="training-stats"><span><b>5</b> Expiring in 30 days</span><span><b>3</b> Overdue items</span><span><b>18</b> Active learners</span></div></div>
    <div className="panel data-panel"><div className="panel-heading"><div><h3>Active learning plans</h3><p>Completion by assigned course</p></div><button className="text-button">Training matrix <ArrowRight size={15} /></button></div>
      <div className="course-list">{courses.map((course) => <button key={course.name} onClick={() => setToast(`${course.name} opened`)}><div className="course-icon"><GraduationCap size={20} /></div><div><strong>{course.name}</strong><span>{course.assigned} people assigned · due {course.due}</span></div><div className="course-progress"><span><b>{course.complete}%</b> complete</span><div><i style={{ width: `${course.complete}%` }} /></div></div><ChevronRight size={17} /></button>)}</div>
    </div>
  </div>;
}

function ComplianceView({ setToast }: { setToast: (v: string) => void }) {
  const frameworks = [
    { code: "ISO 45001", name: "Occupational health & safety", score: 92, gaps: 3, tone: "green" },
    { code: "ISO 14001", name: "Environmental management", score: 84, gaps: 7, tone: "amber" },
    { code: "CDM 2015", name: "Construction design & management", score: 89, gaps: 4, tone: "green" },
    { code: "RIDDOR 2013", name: "Incident reporting compliance", score: 96, gaps: 1, tone: "green" },
  ];
  return <div className="page">
    <PageHeading eyebrow="PROVE COMPLIANCE" title="Legal & ISO compliance" subtitle="See your obligations, evidence and gaps in one defensible view." actions={<button className="primary-button" onClick={() => setToast("AI gap analysis queued")}><Sparkles size={17} /> Run gap analysis</button>} />
    <div className="compliance-intro"><div className="compliance-score"><div><strong>89</strong><span>/100</span></div><p>Overall assurance score</p></div><div><span className="eyebrow light">ASSURANCE SNAPSHOT</span><h2>Your critical controls are evidenced.</h2><p>15 of 16 high-priority obligations have current evidence. Focus next on environmental operational controls.</p></div><button onClick={() => setToast("Evidence report generated")}><FileCheck2 size={17} /> Export evidence pack</button></div>
    <div className="framework-grid">{frameworks.map((item) => <button className="framework-card" key={item.code} onClick={() => setToast(`${item.code} register opened`)}><div className="framework-top"><div className="framework-icon"><ShieldCheck size={20} /></div><StatusPill tone={item.tone}>{item.score >= 90 ? "Strong" : "On track"}</StatusPill></div><h3>{item.code}</h3><p>{item.name}</p><div className="framework-score"><div><i style={{ width: `${item.score}%` }} /></div><strong>{item.score}%</strong></div><footer><span>{item.gaps} open {item.gaps === 1 ? "gap" : "gaps"}</span><span>View register <ChevronRight size={15} /></span></footer></button>)}</div>
  </div>;
}

function MarketplaceView({ setToast }: { setToast: (v: string) => void }) {
  return <div className="page">
    <PageHeading eyebrow="CONNECT WITH EXPERTS" title="Consultant marketplace" subtitle="Find verified HSE expertise for your next project or compliance challenge." actions={<button className="primary-button" onClick={() => setToast("Project brief builder opened")}><Plus size={17} /> Post a brief</button>} />
    <div className="market-search"><div><Search size={20} /><input aria-label="Search consultants" placeholder="Try “ISO 45001 auditor” or “construction safety”" /></div><button>Search experts</button></div>
    <div className="market-layout"><div><div className="section-heading"><div><h2>Recommended for Apex</h2><p>Matched to your industry, jurisdiction and current gaps</p></div><button>View all experts <ArrowRight size={15} /></button></div>
      <div className="consultant-grid">{consultants.map((person) => <article className="consultant-card" key={person.name}><div className={`consultant-avatar ${person.tone}`}>{person.initials}<span><Check size={11} /></span></div><StatusPill tone="green">Verified</StatusPill><h3>{person.name}</h3><p>{person.role}</p><div className="tag-row">{person.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="consultant-meta"><span><Award size={15} /> {person.rating} rating</span><strong>{person.rate}</strong></div><button onClick={() => setToast(`Profile for ${person.name} opened`)}>View profile <ArrowRight size={15} /></button></article>)}</div>
    </div><aside className="market-trust"><ShieldCheck size={26} /><h3>Hire with confidence</h3><p>Verified qualifications, protected milestone payments and transparent ratings.</p><ul><li><Check size={14} /> Identity & credentials checked</li><li><Check size={14} /> Funds held securely in escrow</li><li><Check size={14} /> 14-day dispute window</li></ul><button onClick={() => setToast("Marketplace guide opened")}>How ProAct protects you</button></aside></div>
  </div>;
}

function SummaryStat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article className="summary-stat"><span className={`summary-accent ${tone}`} /><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
}
