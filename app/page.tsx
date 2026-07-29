"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  CloudOff,
  Download,
  FileClock,
  Filter,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, FormEvent, useEffect, useMemo, useState } from "react";
import { CommunityWorkspace } from "./components/community-workspace";
import { MarketplaceWorkspace } from "./components/marketplace-workspace";
import { MODULE_MAP, MODULES, type ModuleDefinition, type ModuleKey } from "./lib/modules";

type ProductRecord = {
  id: string;
  module: ModuleKey;
  reference: string;
  title: string;
  status: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  owner: string;
  dueDate: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type AuditRecord = {
  id: string;
  action: string;
  entity_id: string;
  created_at: string;
};

type EvidenceAttachment = {
  id: string;
  record_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
};

type RecordAction = {
  id: string;
  record_id: string;
  description: string;
  owner: string;
  due_date: string | null;
  status: "Open" | "In progress" | "Closed";
  priority: ProductRecord["priority"];
  created_by: string;
  created_at: string;
  updated_at: string;
};

type StateResponse = {
  organisation: { id: string; name: string; subscription_tier: string; jurisdiction: string };
  actor: { id: string; displayName: string; email: string; role: string; demoMode: boolean };
  records: ProductRecord[];
  audit: AuditRecord[];
  attachments: EvidenceAttachment[];
  actions: RecordAction[];
};

const completionStatuses = new Set(["Approved", "Completed", "Closed", "Conforming", "Published", "Verified", "All clear"]);
const riskStatuses = new Set(["Overdue", "Expired", "Gap identified", "Review required", "Disputed", "Restricted", "Rejected"]);
const LOCAL_ASSIST_MODULES = new Set<ModuleKey>(["rams", "incidents", "iso", "training"]);
const MODULE_WORKFLOWS: Partial<Record<ModuleKey, { title: string; detail: string }[]>> = {
  rams: [
    { title: "MEEPS Method Statement", detail: "Materials, equipment, environment, people and safe-system sequence." },
    { title: "COSHH Assessment", detail: "Substances, SDS links, exposure limits and health controls." },
    { title: "Return-to-Work Plan", detail: "Occupational-health risk and reasonable adjustments." },
  ],
  incidents: [
    { title: "Initial report", detail: "Classify the event, capture witnesses and make the area safe." },
    { title: "Investigation & RCA", detail: "Evidence, supervisor statement, 5 Whys and fishbone factors." },
    { title: "RIDDOR & learning", detail: "Decision record, corrective actions and lesson learnt." },
  ],
  inspections: [
    { title: "Scheduled inspection", detail: "Assign an inspector, frequency, checklist and due date." },
    { title: "Pre-use check", detail: "Mobile-friendly equipment check and failed-item capture." },
    { title: "Close findings", detail: "Score compliance, assign actions and retain evidence." },
  ],
  training: [
    { title: "Training matrix", detail: "Map job roles to mandatory competence requirements." },
    { title: "Course & assessment", detail: "Record content, assessment type, pass grade and result." },
    { title: "Certificate & sign-off", detail: "Track expiry and manager competence verification." },
  ],
  legal: [
    { title: "UK regulation register", detail: "Plain-English duties with official source links." },
    { title: "Applicability review", detail: "Record sector relevance, owner and compliance evidence." },
    { title: "Review control", detail: "Track update dates, gaps and next competent-person review." },
  ],
  iso: [
    { title: "ISO gap analysis", detail: "Clause scoring for ISO 45001, 14001 and 9001." },
    { title: "NCR & corrective action", detail: "Turn low scores into owned, due-dated actions." },
    { title: "PTW, SWOT & policy", detail: "Issue permits and control strategic management records." },
  ],
  documents: [
    { title: "Author", detail: "Create an SOP, policy, procedure, form or work instruction." },
    { title: "Review & approve", detail: "Named reviewer, effective date and controlled version." },
    { title: "Publish & supersede", detail: "Retain revision history and obsolete earlier versions." },
  ],
  emergency: [
    { title: "Muster & headcount", detail: "Expected, present, exempt and unaccounted totals." },
    { title: "Roles & contacts", detail: "Fire Marshals, First Aiders, IMT and emergency contacts." },
    { title: "Drill record", detail: "Start/all-clear time, accuracy, observations and actions." },
  ],
  contractors: [
    { title: "Onboard contractor", detail: "Scope, competence, insurance and orientation." },
    { title: "Approve RAMS", detail: "Link and approve contractor task risk controls." },
    { title: "Issue PTW", detail: "Track permit reference through issue and close-out." },
  ],
  change: [
    { title: "Request & assess", detail: "Reason, affected systems, HSE impact and consultation." },
    { title: "Approve & implement", detail: "Named approval, actions and implementation date." },
    { title: "Verify effectiveness", detail: "Post-change review linked to affected records." },
  ],
  community: [
    { title: "Safety update", detail: "Short-form operational and professional updates." },
    { title: "Article or toolbox talk", detail: "Long-form learning linked to a source record." },
    { title: "Discussion & media", detail: "Topic-led knowledge sharing with controlled links." },
  ],
};
const MODULE_CONNECTIONS: Partial<Record<ModuleKey, ModuleKey[]>> = {
  rams: ["contractors", "incidents", "documents"],
  incidents: ["rams", "community", "training"],
  inspections: ["incidents", "contractors", "iso"],
  training: ["contractors", "emergency", "incidents"],
  legal: ["iso", "documents", "change"],
  iso: ["legal", "documents", "change"],
  documents: ["rams", "iso", "change"],
  emergency: ["training", "incidents", "documents"],
  contractors: ["rams", "iso", "training"],
  change: ["rams", "documents", "training"],
  community: ["incidents", "training", "marketplace"],
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function pretty(value: unknown) {
  if (value == null || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function safeExternalUrl(value: unknown) {
  try {
    const parsed = new URL(String(value ?? ""));
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch { return ""; }
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function Brand() {
  return <div className="brand"><div className="brand-mark"><ShieldCheck size={23} strokeWidth={2.5} /></div><div><strong>ProAct</strong><span>HSE PRO</span></div></div>;
}

function ApiError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="api-error"><CircleAlert size={28} /><h2>We couldn’t load your workspace</h2><p>{message}</p><button className="primary-button" onClick={onRetry}>Try again</button></div>;
}

export default function Home() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [selected, setSelected] = useState<ProductRecord | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const loadState = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/state?audit=1", { cache: "no-store" });
      const data = await response.json() as StateResponse & { error?: { message: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "The workspace is unavailable.");
      setState(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The workspace is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadState(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const moduleRecords = useMemo(() => {
    if (!state) return [];
    return state.records.filter((record) => record.module === activeModule);
  }, [state, activeModule]);

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return moduleRecords.filter((record) => {
      const matchesSearch = !term || `${record.reference} ${record.title} ${record.owner} ${JSON.stringify(record.payload)}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [moduleRecords, search, statusFilter]);

  const chooseModule = (moduleKey: ModuleKey) => {
    setActiveModule(moduleKey);
    setSearch("");
    setStatusFilter("All");
    setSelected(null);
    setSidebarOpen(false);
  };

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (record: ProductRecord) => {
    setEditing(record);
    setSelected(null);
    setEditorOpen(true);
  };

  const refreshRecord = (record: ProductRecord) => {
    setState((current) => current ? { ...current, records: current.records.some((item) => item.id === record.id) ? current.records.map((item) => item.id === record.id ? record : item) : [record, ...current.records] } : current);
  };

  const saveRecord = async (input: Omit<ProductRecord, "id" | "reference" | "createdAt" | "updatedAt"> & { id?: string }) => {
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: input.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json() as { record?: ProductRecord; error?: { message: string } };
      if (!response.ok || !data.record) throw new Error(data.error?.message ?? "The record could not be saved.");
      refreshRecord(data.record);
      setEditorOpen(false);
      setEditing(null);
      setToast(`${data.record.reference} saved and added to the audit trail.`);
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The record could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (record: ProductRecord, status: string) => {
    await saveRecord({ ...record, id: record.id, status });
    setSelected((current) => current?.id === record.id ? { ...current, status } : current);
  };

  const deleteRecord = async (record: ProductRecord) => {
    if (!window.confirm(`Delete ${record.reference}? This action will be permanently recorded in the audit trail.`)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/state", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: record.id }) });
      const data = await response.json() as { error?: { message: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "The record could not be deleted.");
      setState((current) => current ? { ...current, records: current.records.filter((item) => item.id !== record.id) } : current);
      setSelected(null);
      setToast(`${record.reference} deleted. The audit entry has been retained.`);
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The record could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  const loadAudit = async () => {
    try {
      const response = await fetch("/api/state?audit=1", { cache: "no-store" });
      const data = await response.json() as StateResponse;
      if (response.ok) setState(data);
    } catch { /* The committed write remains successful even if refresh fails. */ }
  };

  const seedUkLegal = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "seed_uk_legal" }),
      });
      const data = await response.json() as { inserted?: number; error?: { message: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "The UK starter register could not be loaded.");
      await loadState();
      setToast(data.inserted ? `${data.inserted} official UK starter entries added.` : "The UK starter register is already up to date.");
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The UK starter register could not be loaded.");
    } finally {
      setSaving(false);
    }
  };

  const seedSimulation = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "seed_simulation" }),
      });
      const data = await response.json() as { recordsInserted?: number; recordsExisting?: number; actionsInserted?: number; modulesPopulated?: number; error?: { message: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "The simulated workspace could not be loaded.");
      await loadState();
      setToast(data.recordsInserted
        ? `${data.recordsInserted} simulated records and ${data.actionsInserted ?? 0} actions added across ${data.modulesPopulated ?? 12} modules.`
        : "The operational simulation is already fully loaded.");
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The simulated workspace could not be loaded.");
    } finally {
      setSaving(false);
    }
  };

  const uploadEvidence = async (record: ProductRecord, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setToast("Evidence files must be 2 MB or smaller.");
      return;
    }
    setSaving(true);
    try {
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("The evidence file could not be read."));
        reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "upload_evidence", recordId: record.id, fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, contentBase64 }),
      });
      const data = await response.json() as { attachment?: EvidenceAttachment; error?: { message: string } };
      if (!response.ok || !data.attachment) throw new Error(data.error?.message ?? "The evidence file could not be uploaded.");
      setState((current) => current ? { ...current, attachments: [data.attachment!, ...current.attachments] } : current);
      setToast(`${data.attachment.file_name} attached to ${record.reference}.`);
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The evidence file could not be uploaded.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvidence = async (attachment: EvidenceAttachment) => {
    if (!window.confirm(`Delete evidence file ${attachment.file_name}? The audit event will be retained.`)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attachmentId: attachment.id }),
      });
      const data = await response.json() as { error?: { message: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "The evidence file could not be deleted.");
      setState((current) => current ? { ...current, attachments: current.attachments.filter((item) => item.id !== attachment.id) } : current);
      setToast(`${attachment.file_name} deleted; its audit event was retained.`);
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The evidence file could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  const createRecordAction = async (record: ProductRecord, input: { description: string; owner: string; dueDate: string | null; priority: ProductRecord["priority"] }) => {
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create_action", recordId: record.id, ...input }),
      });
      const data = await response.json() as { action?: RecordAction; error?: { message: string } };
      if (!response.ok || !data.action) throw new Error(data.error?.message ?? "The corrective action could not be created.");
      setState((current) => current ? { ...current, actions: [data.action!, ...current.actions] } : current);
      setToast(`Corrective action added to ${record.reference}.`);
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The corrective action could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const updateRecordAction = async (action: RecordAction, status: RecordAction["status"]) => {
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actionId: action.id, status }),
      });
      const data = await response.json() as { action?: RecordAction; error?: { message: string } };
      if (!response.ok || !data.action) throw new Error(data.error?.message ?? "The corrective action could not be updated.");
      setState((current) => current ? { ...current, actions: current.actions.map((item) => item.id === data.action!.id ? data.action! : item) } : current);
      setToast(`Action moved to ${status.toLowerCase()}.`);
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The corrective action could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRecordAction = async (action: RecordAction) => {
    if (!window.confirm("Delete this corrective action? Its audit history will be retained.")) return;
    setSaving(true);
    try {
      const response = await fetch("/api/state", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actionId: action.id }),
      });
      const data = await response.json() as { error?: { message: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "The corrective action could not be deleted.");
      setState((current) => current ? { ...current, actions: current.actions.filter((item) => item.id !== action.id) } : current);
      setToast("Corrective action deleted; its audit event was retained.");
      void loadAudit();
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The corrective action could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Reference", "Title", "Status", "Priority", "Owner", "Due date", ...MODULE_MAP[activeModule].fields.map((field) => field.label)];
    const rows = visibleRecords.map((record) => [
      record.reference, record.title, record.status, record.priority, record.owner, record.dueDate ?? "",
      ...MODULE_MAP[activeModule].fields.map((field) => pretty(record.payload[field.key])),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `proact-${activeModule}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`${visibleRecords.length} records exported to CSV.`);
  };

  const exportFullBackup = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/state?backup=1", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json() as { error?: { message: string } };
        throw new Error(data.error?.message ?? "The backup could not be generated.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `proact-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setToast("Full backup downloaded. Store it securely; it contains organisation data.");
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : "The backup could not be generated.");
    } finally {
      setSaving(false);
    }
  };

  const actor = state?.actor;
  const activeDefinition = MODULE_MAP[activeModule];

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to main content</a>
    <aside className={`sidebar full-nav ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-top"><Brand /><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
      <div className="org-switcher"><div className="org-icon"><ShieldCheck size={18} /></div><div><strong>{state?.organisation.name ?? "ProAct workspace"}</strong><span>{state ? `${state.organisation.jurisdiction} · ${state.organisation.subscription_tier.replace("_", " ")}` : "Loading workspace"}</span></div><ChevronDown size={15} /></div>
      <nav aria-label="Product modules">
        <span className="nav-label">OPERATIONS</span>
        {MODULES.slice(0, 7).map((item) => <NavButton key={item.key} definition={item} active={activeModule === item.key} count={state?.records.filter((record) => record.module === item.key).length ?? 0} onClick={() => chooseModule(item.key)} />)}
        <span className="nav-label lower">ASSURANCE & GROWTH</span>
        {MODULES.slice(7).map((item) => <NavButton key={item.key} definition={item} active={activeModule === item.key} count={state?.records.filter((record) => record.module === item.key).length ?? 0} onClick={() => chooseModule(item.key)} />)}
      </nav>
      <button className="audit-link" onClick={() => setAuditOpen(true)}><FileClock size={17} /><span><strong>Immutable audit trail</strong><small>{state?.audit.length ?? 0} recent events</small></span><ChevronRight size={16} /></button>
      <div className="user-block"><div className="avatar">{actor ? initials(actor.displayName) : "..."}</div><div><strong>{actor?.displayName ?? "Loading user"}</strong><span>{actor?.role ?? "Authenticating"}</span></div><MoreHorizontal size={17} /></div>
    </aside>
    <div className={`sidebar-scrim ${sidebarOpen ? "visible" : ""}`} onClick={() => setSidebarOpen(false)} />

    <div className="workspace">
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="breadcrumb"><span>ProAct HSE Pro</span><ChevronRight size={14} /><strong>{activeDefinition.shortLabel}</strong></div>
        <div className="top-actions">
          {!online && <span className="offline-badge"><CloudOff size={14} /> Offline</span>}
          <span className="uk-badge">UK</span>
          {(actor?.role === "CompanyAdmin" || actor?.role === "SuperAdmin") && <button className="backup-button" onClick={() => void exportFullBackup()} disabled={saving}><Download size={14} /> Backup</button>}
          <button className="icon-button" onClick={() => setToast("You’re up to date.")} aria-label="Notifications"><Bell size={18} /></button>
          <div className="top-avatar">{actor ? initials(actor.displayName) : "..."}</div>
        </div>
      </header>
      {actor?.demoMode && <div className="demo-banner"><CircleAlert size={16} /><div><strong>Public demo mode</strong><span>No login is required. This is a shared testing workspace—do not enter personal, confidential or commercially sensitive information.</span></div></div>}

      <main id="main">
        {loading ? <LoadingState /> : error || !state ? <ApiError message={error} onRetry={() => void loadState()} /> : activeModule === "dashboard"
          ? <Dashboard state={state} saving={saving} onSeedSimulation={() => void seedSimulation()} onNavigate={chooseModule} onCreate={(moduleKey) => { chooseModule(moduleKey); window.setTimeout(openCreate, 0); }} />
          : activeModule === "community"
            ? <CommunityWorkspace records={moduleRecords} allRecords={state.records} actorName={state.actor.displayName} saving={saving} onSave={saveRecord} />
          : activeModule === "marketplace"
            ? <MarketplaceWorkspace records={moduleRecords} actor={state.actor} saving={saving} onSave={saveRecord} />
          : <ModuleWorkspace definition={activeDefinition} records={visibleRecords} allRecords={moduleRecords} allProductRecords={state.records} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onCreate={openCreate} onSelect={setSelected} onExport={exportCsv} onSeedUkLegal={() => void seedUkLegal()} onNavigate={chooseModule} saving={saving} />}
      </main>
    </div>

    {editorOpen && <RecordEditor definition={activeDefinition} record={editing} actorName={actor?.displayName ?? ""} saving={saving} onClose={() => { setEditorOpen(false); setEditing(null); }} onSave={saveRecord} />}
    {selected && <RecordDrawer record={selected} definition={MODULE_MAP[selected.module]} attachments={state?.attachments.filter((item) => item.record_id === selected.id) ?? []} actions={state?.actions.filter((item) => item.record_id === selected.id) ?? []} canDeleteEvidence={actor?.role === "CompanyAdmin" || actor?.role === "SuperAdmin"} saving={saving} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => void deleteRecord(selected)} onStatus={(status) => void changeStatus(selected, status)} onUpload={(file) => void uploadEvidence(selected, file)} onDeleteEvidence={(attachment) => void deleteEvidence(attachment)} onCreateAction={(input) => void createRecordAction(selected, input)} onUpdateAction={(action, status) => void updateRecordAction(action, status)} onDeleteAction={(action) => void deleteRecordAction(action)} />}
    {auditOpen && <AuditDrawer audit={state?.audit ?? []} records={state?.records ?? []} onClose={() => setAuditOpen(false)} />}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={16} /></button></div>}
  </div>;
}

function NavButton({ definition, active, count, onClick }: { definition: ModuleDefinition; active: boolean; count: number; onClick: () => void }) {
  const Icon = definition.icon;
  return <button className={active ? "active" : ""} onClick={onClick}><Icon size={18} /><span>{definition.shortLabel}</span>{count > 0 && <b>{count}</b>}</button>;
}

function LoadingState() {
  return <div className="page"><div className="page-heading skeleton-heading"><div><i /><b /><span /></div></div><div className="skeleton-grid">{[1,2,3,4].map((item) => <i key={item} />)}</div><div className="skeleton-panel" /></div>;
}

function Dashboard({ state, saving, onSeedSimulation, onNavigate, onCreate }: { state: StateResponse; saving: boolean; onSeedSimulation: () => void; onNavigate: (moduleKey: ModuleKey) => void; onCreate: (moduleKey: ModuleKey) => void }) {
  const records = state.records;
  const actions = state.actions ?? [];
  const now = new Date();
  const overdue = records.filter((record) => record.dueDate && new Date(record.dueDate) < now && !completionStatuses.has(record.status)).length + actions.filter((action) => action.due_date && new Date(action.due_date) < now && action.status !== "Closed").length;
  const priority = records.filter((record) => record.priority === "Critical" || record.priority === "High" || riskStatuses.has(record.status)).length + actions.filter((action) => action.status !== "Closed" && (action.priority === "High" || action.priority === "Critical")).length;
  const completed = records.filter((record) => completionStatuses.has(record.status)).length;
  const assurance = records.length ? Math.round((completed / records.length) * 100) : 0;
  const activeModules = new Set(records.map((record) => record.module)).size;
  const recent = [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const incidents = records.filter((record) => record.module === "incidents");
  const inspections = records.filter((record) => record.module === "inspections");
  const training = records.filter((record) => record.module === "training");
  const year = new Date().getFullYear();
  const riddorYtd = incidents.filter((record) => String(record.payload.riddor) === "Reportable" && new Date(String(record.payload.occurredAt || record.createdAt)).getFullYear() === year).length;
  const nearMisses = incidents.filter((record) => ["Near miss", "High potential near miss"].includes(String(record.payload.eventType))).length;
  const dafw = incidents.reduce((total, record) => total + Number(record.payload.daysAwayFromWork || 0), 0);
  const completedInspections = inspections.filter((record) => record.status === "Completed").length;
  const expiringTraining = training.filter((record) => {
    const expiry = new Date(String(record.payload.expiryDate || ""));
    const days = (expiry.getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= 30;
  }).length;
  const safetyAlert = records.find((record) => record.module === "community" && record.priority === "Critical" && record.status === "Published");
  const simulationCount = records.filter((record) => record.payload.simulatedData === true).length;

  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">UK ASSURANCE WORKSPACE</span><h1>Good morning, {state.actor.displayName.split(" ")[0]}.</h1><p>Your live HSE position is calculated from {records.length} controlled records.</p></div><div className="heading-actions"><button className="secondary-button" onClick={onSeedSimulation} disabled={saving}><Activity size={16} /> {simulationCount ? "Simulation loaded" : "Load simulation"}</button><button className="secondary-button" onClick={() => onNavigate("incidents")}><AlertTriangle size={16} /> View incidents</button><button className="primary-button" onClick={() => onCreate("incidents")}><Plus size={16} /> Report incident</button></div></div>
    {simulationCount > 0 && <div className="simulation-banner"><Activity size={17} /><div><strong>Operational simulation active</strong><span>{simulationCount} clearly labelled simulated records are driving the dashboards and workflows. Existing workspace records remain unchanged.</span></div></div>}
    <section className="command-card live-command">
      <div className="score-block"><div className="score-ring" style={{ background: `conic-gradient(#49c58a 0 ${assurance}%, rgba(255,255,255,.13) ${assurance}% 100%)` }}><span>{assurance}</span><small>/100</small></div><div><span className="eyebrow light">LIVE ASSURANCE SCORE</span><h2>{assurance >= 80 ? "Controls are performing strongly" : assurance >= 60 ? "Assurance needs attention" : "Control gaps require action"}</h2><p>Based on closed, approved, verified and conforming records across every active module.</p><div className="trend-up"><Activity size={15} /> Recalculates as workflows progress</div></div></div>
      <div className="status-grid">
        <button onClick={() => onNavigate("incidents")}><span className="status-dot red" /><div><strong>{priority}</strong><small>Priority items</small></div><ChevronRight size={17} /></button>
        <button onClick={() => onNavigate("inspections")}><span className="status-dot amber" /><div><strong>{overdue}</strong><small>Overdue records</small></div><ChevronRight size={17} /></button>
        <button onClick={() => onNavigate("documents")}><span className="status-dot green" /><div><strong>{activeModules}/12</strong><small>Modules active</small></div><ChevronRight size={17} /></button>
      </div>
    </section>
    {safetyAlert && <button className="safety-alert" onClick={() => onNavigate("community")}><AlertTriangle size={18} /><div><strong>Priority safety alert</strong><span>{safetyAlert.title}</span></div><ChevronRight size={17} /></button>}
    <section className="hse-kpi-grid" aria-label="HSE performance indicators">
      <button onClick={() => onNavigate("incidents")}><span>RIDDOR YTD</span><strong>{riddorYtd}</strong><small>Reportable events</small></button>
      <button onClick={() => onNavigate("incidents")}><span>DAFW</span><strong>{dafw}</strong><small>Days away from work</small></button>
      <button onClick={() => onNavigate("incidents")}><span>Near misses</span><strong>{nearMisses}</strong><small>Leading indicator</small></button>
      <button onClick={() => onNavigate("inspections")}><span>Inspections</span><strong>{completedInspections}/{inspections.length}</strong><small>Completed</small></button>
      <button onClick={() => onNavigate("training")}><span>Training alerts</span><strong>{expiringTraining}</strong><small>Expiring within 30 days</small></button>
    </section>
    <section className="module-health-grid">
      {MODULES.filter((item) => item.key !== "dashboard").map((item) => {
        const moduleRows = records.filter((record) => record.module === item.key);
        const needsAttention = moduleRows.filter((record) => record.priority === "High" || record.priority === "Critical" || riskStatuses.has(record.status)).length;
        const Icon = item.icon;
        return <button key={item.key} className="module-health-card" onClick={() => onNavigate(item.key)}><span className={`module-health-icon ${needsAttention ? "attention" : ""}`}><Icon size={19} /></span><div><strong>{item.shortLabel}</strong><small>{moduleRows.length ? `${moduleRows.length} records · ${needsAttention} need attention` : "Ready for first record"}</small></div><span className={`rag-dot ${needsAttention ? "amber" : moduleRows.length ? "green" : "neutral"}`} /><ChevronRight size={16} /></button>;
      })}
    </section>
    <section className="dashboard-grid operational-grid">
      <div className="panel"><div className="panel-heading"><div><h3>Recently updated</h3><p>Latest controlled records across the organisation</p></div></div>{recent.length ? <div className="recent-records">{recent.map((record) => <button key={record.id} onClick={() => onNavigate(record.module)}><span className={`priority-mark ${record.priority.toLowerCase()}`} /><div><strong>{record.title}</strong><small>{record.reference} · {MODULE_MAP[record.module].shortLabel}</small></div><span>{record.status}</span><ChevronRight size={16} /></button>)}</div> : <MiniEmpty title="No records yet" text="Start with an incident, RAMS or inspection." />}</div>
      <div className="panel quick-panel"><div className="panel-heading"><div><h3>Start a workflow</h3><p>Every submission is validated and audited</p></div></div><div className="quick-grid dashboard-quick">
        {(["incidents","rams","inspections","training"] as ModuleKey[]).map((key) => { const item = MODULE_MAP[key]; const Icon = item.icon; return <button key={key} onClick={() => onCreate(key)}><span className="quick-icon blue"><Icon size={18} /></span><div><strong>New {item.shortLabel}</strong><small>{item.description.split(",")[0]}</small></div><ChevronRight size={15} /></button>; })}
      </div></div>
    </section>
    <div className="proof-strip"><ShieldCheck size={17} /><span>Tenant-scoped SQLite persistence, server validation, role checks and append-only audit events are active.</span><button onClick={() => onNavigate("legal")}>UK compliance workspace <ArrowRight size={14} /></button></div>
  </div>;
}

function ModuleWorkspace({ definition, records, allRecords, allProductRecords, search, setSearch, statusFilter, setStatusFilter, onCreate, onSelect, onExport, onSeedUkLegal, onNavigate, saving }: {
  definition: ModuleDefinition; records: ProductRecord[]; allRecords: ProductRecord[]; allProductRecords: ProductRecord[]; search: string; setSearch: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; onCreate: () => void; onSelect: (record: ProductRecord) => void; onExport: () => void; onSeedUkLegal: () => void; onNavigate: (moduleKey: ModuleKey) => void; saving: boolean;
}) {
  const Icon = definition.icon;
  const complete = allRecords.filter((record) => completionStatuses.has(record.status)).length;
  const attention = allRecords.filter((record) => record.priority === "High" || record.priority === "Critical" || riskStatuses.has(record.status)).length;
  const due = allRecords.filter((record) => record.dueDate && new Date(record.dueDate) < new Date() && !completionStatuses.has(record.status)).length;

  const workflows = MODULE_WORKFLOWS[definition.key] ?? [];
  const connections = MODULE_CONNECTIONS[definition.key] ?? [];

  return <div className="page">
    <div className="page-heading module-heading"><div><span className="eyebrow">MODULE {String(MODULES.findIndex((item) => item.key === definition.key)).padStart(2, "0")} OF 12</span><h1>{definition.label}</h1><p>{definition.description}</p></div><div className="heading-actions">{definition.key === "legal" && <button className="secondary-button" onClick={onSeedUkLegal} disabled={saving}><BookOpenCheck size={16} /> {saving ? "Loading..." : "Load UK starter register"}</button>}<button className="secondary-button" onClick={onExport} disabled={!records.length}><Download size={16} /> Export CSV</button><button className="primary-button" onClick={onCreate}><Plus size={16} /> New record</button></div></div>
    <section className="module-workflow-grid" aria-label={`${definition.label} workflows`}>
      {workflows.map((workflow, index) => <button key={workflow.title} onClick={onCreate}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{workflow.title}</strong><small>{workflow.detail}</small></div><Plus size={15} /></button>)}
    </section>
    <section className="summary-row module-summary"><Summary label="Total records" value={String(allRecords.length)} detail="Tenant-controlled" tone="blue" /><Summary label="Completed / controlled" value={String(complete)} detail={`${allRecords.length ? Math.round(complete/allRecords.length*100) : 0}% completion`} tone="green" /><Summary label="Need attention" value={String(attention)} detail="High priority or exception" tone="red" /><Summary label="Overdue" value={String(due)} detail="Past due and still open" tone="amber" /></section>
    {connections.length > 0 && <section className="module-connections"><span>CONNECTED CONTROLS</span>{connections.map((key) => <button key={key} onClick={() => onNavigate(key)}>{MODULE_MAP[key].shortLabel}<b>{allProductRecords.filter((record) => record.module === key).length}</b><ChevronRight size={13} /></button>)}</section>}
    <section className="panel records-panel">
      <div className="records-toolbar"><div className="inner-search"><Search size={16} /><input aria-label={`Search ${definition.label}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${definition.shortLabel.toLowerCase()} records...`} /></div><label><Filter size={15} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{definition.statuses.map((status) => <option key={status}>{status}</option>)}</select></label><span>{records.length} shown</span></div>
      {records.length ? <div className="record-table"><div className="record-table-head"><span>REFERENCE</span><span>RECORD</span><span>OWNER</span><span>DUE</span><span>PRIORITY</span><span>STATUS</span><span /></div>{records.map((record) => <button className="record-table-row" key={record.id} onClick={() => onSelect(record)}><strong>{record.reference}</strong><span><b>{record.title}{record.payload.simulatedData === true && <em className="simulated-badge">Simulated</em>}</b><small>{firstPayloadValue(record.payload)}</small></span><span>{record.owner}</span><span>{formatDate(record.dueDate)}</span><span><PriorityPill priority={record.priority} /></span><span><StatusPill status={record.status} /></span><ChevronRight size={17} /></button>)}</div>
        : <div className="large-empty"><span><Icon size={31} /></span><h2>{allRecords.length ? "No matching records" : `Start using ${definition.shortLabel}`}</h2><p>{allRecords.length ? "Clear the search or status filter to see more records." : `Create the first controlled record for ${definition.description.toLowerCase()}`}</p><button className="primary-button" onClick={onCreate}><Plus size={16} /> Create first record</button></div>}
    </section>
  </div>;
}

function Summary({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article className="summary-stat"><span className={`summary-accent ${tone}`} /><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
}

function fieldVisible(field: ModuleDefinition["fields"][number], payload: Record<string, unknown>) {
  return !field.condition || field.condition.values.includes(String(payload[field.condition.key] ?? ""));
}

function RecordEditor({ definition, record, actorName, saving, onClose, onSave }: { definition: ModuleDefinition; record: ProductRecord | null; actorName: string; saving: boolean; onClose: () => void; onSave: (input: Omit<ProductRecord, "id" | "reference" | "createdAt" | "updatedAt"> & { id?: string }) => Promise<void> }) {
  const [title, setTitle] = useState(record?.title ?? "");
  const [status, setStatus] = useState(record?.status ?? definition.statuses[0]);
  const [priority, setPriority] = useState<ProductRecord["priority"]>(record?.priority ?? "Medium");
  const [owner, setOwner] = useState(record?.owner ?? actorName);
  const [dueDate, setDueDate] = useState(record?.dueDate ?? "");
  const [payload, setPayload] = useState<Record<string, unknown>>(record?.payload ?? {});
  const [validation, setValidation] = useState("");
  const [assisting, setAssisting] = useState(false);
  const [assistantResult, setAssistantResult] = useState<{ title: string; explanation: string; questions: string[]; disclaimer: string } | null>(null);
  const visibleFields = definition.fields.filter((field) => fieldVisible(field, payload));

  const runAssistant = async () => {
    setAssisting(true);
    setValidation("");
    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ module: definition.key, title, payload }),
      });
      const data = await response.json() as { title?: string; explanation?: string; questions?: string[]; patch?: Record<string, unknown>; disclaimer?: string; error?: { message: string } };
      if (!response.ok || !data.patch) throw new Error(data.error?.message ?? "The local assistant could not process this record.");
      setPayload((current) => ({ ...current, ...data.patch }));
      setAssistantResult({ title: data.title ?? "Local assistance", explanation: data.explanation ?? "", questions: data.questions ?? [], disclaimer: data.disclaimer ?? "" });
    } catch (requestError) {
      setValidation(requestError instanceof Error ? requestError.message : "The local assistant could not process this record.");
    } finally {
      setAssisting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const missing = visibleFields.find((field) => field.required && (payload[field.key] == null || String(payload[field.key]).trim() === ""));
    if (!title.trim() || !owner.trim() || missing) {
      setValidation(missing ? `${missing.label} is required.` : "Title and owner are required.");
      return;
    }
    const nextPayload = { ...payload };
    if (definition.key === "rams") {
      const likelihood = Number(payload.likelihood || 0);
      const consequence = Number(payload.consequence || 0);
      nextPayload.initialRiskScore = likelihood * consequence;
      nextPayload.riskRating = likelihood * consequence >= 17 ? "Very high" : likelihood * consequence >= 10 ? "High" : likelihood * consequence >= 5 ? "Medium" : "Low";
    }
    await onSave({ id: record?.id, module: definition.key, title: title.trim(), status, priority, owner: owner.trim(), dueDate: dueDate || null, payload: nextPayload });
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal record-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="modal-header"><div><span className="eyebrow">{record ? `EDIT ${record.reference}` : `NEW ${definition.shortLabel.toUpperCase()}`}</span><h2 id="editor-title">{record ? record.title : `Create ${definition.shortLabel} record`}</h2><p>Required fields are validated before the record is written to the audit trail.</p></div><button className="icon-button" onClick={onClose} aria-label="Close editor"><X size={19} /></button></div>
      <form onSubmit={(event) => void submit(event)}>
        {validation && <div className="form-alert" role="alert"><CircleAlert size={16} />{validation}</div>}
        <label>Record title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required /></label>
        <div className="form-row"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{definition.statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as ProductRecord["priority"])}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label></div>
        <div className="form-row"><label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} required /></label><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div>
        {definition.key === "incidents" && <div className="workflow-guidance"><CircleAlert size={17} /><div><strong>RIDDOR decision support</strong><span>Use the current HSE criteria and record the final decision. ProAct does not submit a report for you.</span><a href="https://www.hse.gov.uk/riddor/reportable-incidents.htm" target="_blank" rel="noreferrer">Open official HSE guidance</a></div></div>}
        {LOCAL_ASSIST_MODULES.has(definition.key) && <section className="local-assistant">
          <div className="local-assistant-heading"><Activity size={18} /><div><strong>Local AI simulator</strong><span>Rule-based UK suggestions · no API key · no external data transfer</span></div><button type="button" onClick={() => void runAssistant()} disabled={assisting}>{assisting ? "Analysing…" : assistantResult ? "Run again" : "Assist this record"}</button></div>
          {assistantResult && <div className="local-assistant-result"><strong>{assistantResult.title}</strong><p>{assistantResult.explanation}</p>{assistantResult.questions.length > 0 && <div><span>Questions to confirm</span><ol>{assistantResult.questions.map((question) => <li key={question}>{question}</li>)}</ol></div>}<small><CircleAlert size={13} />{assistantResult.disclaimer}</small></div>}
        </section>}
        <div className="module-form-fields">{visibleFields.map((field, index) => <DynamicField key={field.key} field={field} showGroup={Boolean(field.group && visibleFields[index - 1]?.group !== field.group)} value={payload[field.key]} onChange={(value) => setPayload((current) => ({ ...current, [field.key]: value }))} />)}</div>
        {definition.key === "rams" && <RiskPreview payload={payload} />}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : record ? "Save changes" : "Create record"}<ArrowRight size={15} /></button></div>
      </form>
    </section>
  </div>;
}

function DynamicField({ field, showGroup, value, onChange }: { field: ModuleDefinition["fields"][number]; showGroup: boolean; value: unknown; onChange: (value: unknown) => void }) {
  const textValue = value == null ? "" : String(value);
  const heading = showGroup ? <div className="field-group-title"><span>{field.group}</span></div> : null;
  if (field.type === "textarea") return <Fragment>{heading}<label>{field.label}{field.required && <em>Required</em>}{field.hint && <small>{field.hint}</small>}<textarea rows={3} value={textValue} onChange={(event) => onChange(event.target.value)} required={field.required} /></label></Fragment>;
  if (field.type === "select") return <Fragment>{heading}<label>{field.label}{field.required && <em>Required</em>}{field.hint && <small>{field.hint}</small>}<select value={textValue} onChange={(event) => onChange(event.target.value)} required={field.required}><option value="">Select...</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></label></Fragment>;
  return <Fragment>{heading}<label>{field.label}{field.required && <em>Required</em>}{field.hint && <small>{field.hint}</small>}<input type={field.type} value={textValue} min={field.type === "number" ? 0 : undefined} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} required={field.required} /></label></Fragment>;
}

function RiskPreview({ payload }: { payload: Record<string, unknown> }) {
  const score = Number(payload.likelihood || 0) * Number(payload.consequence || 0);
  const rating = score >= 17 ? "Very high" : score >= 10 ? "High" : score >= 5 ? "Medium" : score > 0 ? "Low" : "Not calculated";
  const residualScore = Number(payload.residualLikelihood || 0) * Number(payload.residualConsequence || 0);
  const residualRating = residualScore >= 17 ? "Very high" : residualScore >= 10 ? "High" : residualScore >= 5 ? "Medium" : residualScore > 0 ? "Low" : "Not calculated";
  return <div className={`risk-preview ${rating.toLowerCase().replace(" ", "-")}`}><span>Initial risk</span><strong>{score || "—"}</strong><b>{rating}</b><span>Residual risk</span><strong>{residualScore || "—"}</strong><b>{residualRating}</b><small>Likelihood × consequence. Approval requires recorded residual risk and review by a competent person.</small></div>;
}

function RecordDrawer({ record, definition, attachments, actions, canDeleteEvidence, saving, onClose, onEdit, onDelete, onStatus, onUpload, onDeleteEvidence, onCreateAction, onUpdateAction, onDeleteAction }: { record: ProductRecord; definition: ModuleDefinition; attachments: EvidenceAttachment[]; actions: RecordAction[]; canDeleteEvidence: boolean; saving: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void; onStatus: (status: string) => void; onUpload: (file: File) => void; onDeleteEvidence: (attachment: EvidenceAttachment) => void; onCreateAction: (input: { description: string; owner: string; dueDate: string | null; priority: ProductRecord["priority"] }) => void; onUpdateAction: (action: RecordAction, status: RecordAction["status"]) => void; onDeleteAction: (action: RecordAction) => void }) {
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="record-drawer" role="dialog" aria-modal="true" aria-labelledby="record-title">
    <div className="drawer-header"><div><span className="eyebrow">{record.reference}</span><h2 id="record-title">{record.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close record"><X size={19} /></button></div>
    <div className="drawer-summary"><PriorityPill priority={record.priority} /><StatusPill status={record.status} />{record.payload.simulatedData === true && <em className="simulated-badge">Simulated data</em>}<span>Updated {formatDate(record.updatedAt)}</span></div>
    <div className="drawer-actions"><button className="secondary-button" onClick={onEdit}><Pencil size={15} /> Edit</button><label>Move to<select aria-label="Change record status" value={record.status} onChange={(event) => onStatus(event.target.value)} disabled={saving}>{definition.statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
    <dl className="record-details"><div><dt>Owner</dt><dd>{record.owner}</dd></div><div><dt>Due date</dt><dd>{formatDate(record.dueDate)}</dd></div>{definition.fields.filter((field) => fieldVisible(field, record.payload)).map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{field.key === "sourceUrl" && safeExternalUrl(record.payload[field.key]) ? <a href={safeExternalUrl(record.payload[field.key])} target="_blank" rel="noreferrer">Open official source</a> : pretty(record.payload[field.key])}</dd></div>)}</dl>
    <section className="evidence-section"><div className="evidence-heading"><div><strong>Evidence files</strong><span>PDF, JPG, PNG, WebP, TXT or CSV · maximum 2 MB</span></div><label className={`secondary-button ${saving ? "disabled" : ""}`}><Plus size={14} /> Attach<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv" disabled={saving} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.currentTarget.value = ""; }} /></label></div>{attachments.length ? <div className="evidence-list">{attachments.map((attachment) => <article key={attachment.id}><FileClock size={17} /><div><a href={`/api/state?attachment=${encodeURIComponent(attachment.id)}`}>{attachment.file_name}</a><span>{attachment.mime_type} · {Math.ceil(attachment.size_bytes / 1024)} KB</span></div>{canDeleteEvidence && <button onClick={() => onDeleteEvidence(attachment)} disabled={saving} aria-label={`Delete ${attachment.file_name}`}><Trash2 size={14} /></button>}</article>)}</div> : <p className="evidence-empty">No evidence attached yet.</p>}</section>
    <ActionPanel record={record} actions={actions} saving={saving} canDelete={canDeleteEvidence} onCreate={onCreateAction} onUpdate={onUpdateAction} onDelete={onDeleteAction} />
    <div className="drawer-proof"><ShieldCheck size={17} /><span>Changes to this record are tenant-scoped and appended to the immutable audit log.</span></div>
    <button className="danger-button" onClick={onDelete} disabled={saving}><Trash2 size={15} /> Delete record</button>
  </aside></div>;
}

function ActionPanel({ record, actions, saving, canDelete, onCreate, onUpdate, onDelete }: { record: ProductRecord; actions: RecordAction[]; saving: boolean; canDelete: boolean; onCreate: (input: { description: string; owner: string; dueDate: string | null; priority: ProductRecord["priority"] }) => void; onUpdate: (action: RecordAction, status: RecordAction["status"]) => void; onDelete: (action: RecordAction) => void }) {
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState(record.owner);
  const [dueDate, setActionDueDate] = useState("");
  const [priority, setActionPriority] = useState<ProductRecord["priority"]>("Medium");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!description.trim() || !owner.trim()) return;
    onCreate({ description: description.trim(), owner: owner.trim(), dueDate: dueDate || null, priority });
    setDescription("");
    setActionDueDate("");
  };
  return <section className="action-section"><div className="action-heading"><div><strong>Corrective actions</strong><span>{actions.filter((item) => item.status !== "Closed").length} open · {actions.length} total</span></div></div><form onSubmit={submit}><textarea aria-label="Corrective action description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the action required..." maxLength={500} required /><div><input aria-label="Action owner" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Owner" required /><input aria-label="Action due date" type="date" value={dueDate} onChange={(event) => setActionDueDate(event.target.value)} /><select aria-label="Action priority" value={priority} onChange={(event) => setActionPriority(event.target.value as ProductRecord["priority"])}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><button className="primary-button" disabled={saving}><Plus size={14} /> Add</button></div></form>{actions.length ? <div className="action-list">{actions.map((action) => <article key={action.id}><span className={`priority-mark ${action.priority.toLowerCase()}`} /><div><strong>{action.description}</strong><span>{action.owner} · {formatDate(action.due_date)}</span></div><select aria-label={`Status for ${action.description}`} value={action.status} onChange={(event) => onUpdate(action, event.target.value as RecordAction["status"])} disabled={saving}><option>Open</option><option>In progress</option><option>Closed</option></select>{canDelete && <button onClick={() => onDelete(action)} disabled={saving} aria-label={`Delete action ${action.description}`}><Trash2 size={13} /></button>}</article>)}</div> : <p className="evidence-empty">No corrective actions assigned.</p>}</section>;
}

function AuditDrawer({ audit, records, onClose }: { audit: AuditRecord[]; records: ProductRecord[]; onClose: () => void }) {
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="record-drawer audit-drawer" role="dialog" aria-modal="true" aria-labelledby="audit-title"><div className="drawer-header"><div><span className="eyebrow">APPEND-ONLY CONTROL</span><h2 id="audit-title">Immutable audit trail</h2></div><button className="icon-button" onClick={onClose} aria-label="Close audit trail"><X size={19} /></button></div><p className="drawer-intro">Every create, update and delete action is recorded with the responsible user and timestamp.</p><div className="audit-list">{audit.length ? audit.map((item) => { const record = records.find((row) => row.id === item.entity_id); return <article key={item.id}><span className={`audit-action ${item.action.toLowerCase()}`}>{item.action[0]}</span><div><strong>{item.action} · {record?.reference ?? item.entity_id.slice(0,8)}</strong><p>{record?.title ?? "Deleted record"}</p></div><time>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time></article>; }) : <MiniEmpty title="No audit events" text="Activity will appear after the first saved record." />}</div></aside></div>;
}

function PriorityPill({ priority }: { priority: ProductRecord["priority"] }) {
  return <span className={`priority-pill ${priority.toLowerCase()}`}><i />{priority}</span>;
}

function StatusPill({ status }: { status: string }) {
  const tone = completionStatuses.has(status) ? "green" : riskStatuses.has(status) ? "red" : "blue";
  return <span className={`status-pill ${tone}`}><i />{status}</span>;
}

function firstPayloadValue(payload: Record<string, unknown>) {
  const first = Object.values(payload).find((value) => typeof value === "string" && value.trim());
  return first ? String(first).slice(0, 90) : "Open record for full details";
}

function MiniEmpty({ title, text }: { title: string; text: string }) {
  return <div className="mini-empty"><ClipboardList size={24} /><strong>{title}</strong><span>{text}</span></div>;
}
