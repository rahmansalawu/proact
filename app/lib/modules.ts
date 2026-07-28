import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileCheck2,
  FileStack,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export const MODULE_KEYS = [
  "dashboard",
  "rams",
  "incidents",
  "inspections",
  "training",
  "legal",
  "iso",
  "documents",
  "emergency",
  "contractors",
  "change",
  "community",
  "marketplace",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  referencePrefix: string;
  statuses: string[];
  fields: { key: string; label: string; type: "text" | "textarea" | "number" | "select" | "date"; options?: string[]; required?: boolean }[];
};

export const MODULES: ModuleDefinition[] = [
  { key: "dashboard", label: "Dashboard & Analytics", shortLabel: "Overview", description: "Calculated RAG indicators, actions and operational assurance.", icon: LayoutDashboard, referencePrefix: "KPI", statuses: ["Active"], fields: [] },
  { key: "rams", label: "Risk Management & RAMS", shortLabel: "RAMS", description: "MEEPS method statements, risk controls, reviews and approvals.", icon: FileCheck2, referencePrefix: "RAMS", statuses: ["Draft", "Submitted", "Approved", "Changes requested", "Archived"], fields: [
    { key: "taskDescription", label: "Task description", type: "textarea", required: true },
    { key: "location", label: "Job location", type: "text", required: true },
    { key: "meepsCategory", label: "Primary MEEPS category", type: "select", options: ["Materials", "Equipment", "Environment", "People / Competence", "System"], required: true },
    { key: "hazards", label: "Hazards identified", type: "textarea", required: true },
    { key: "controls", label: "Controls", type: "textarea", required: true },
    { key: "likelihood", label: "Likelihood (1-5)", type: "number", required: true },
    { key: "consequence", label: "Consequence (1-5)", type: "number", required: true },
    { key: "residualLikelihood", label: "Residual likelihood (1-5)", type: "number" },
    { key: "residualConsequence", label: "Residual consequence (1-5)", type: "number" },
    { key: "approvedBy", label: "Competent approver", type: "text" },
    { key: "reviewDate", label: "Review date", type: "date" },
  ] },
  { key: "incidents", label: "Incident Management", shortLabel: "Incidents", description: "Report, investigate, analyse, act and share lessons learned.", icon: AlertTriangle, referencePrefix: "INC", statuses: ["Draft", "Submitted", "Investigating", "Actions open", "Closed"], fields: [
    { key: "eventType", label: "Event type", type: "select", options: ["Near miss", "High potential near miss", "Recordable", "Reportable", "Unsafe condition", "Environmental event"], required: true },
    { key: "location", label: "Location", type: "text", required: true },
    { key: "occurredAt", label: "Date occurred", type: "date", required: true },
    { key: "description", label: "What happened?", type: "textarea", required: true },
    { key: "immediateAction", label: "Immediate action taken", type: "textarea", required: true },
    { key: "riddor", label: "RIDDOR assessment", type: "select", options: ["Not assessed", "Not reportable", "Potentially reportable", "Reportable"], required: true },
    { key: "rootCause", label: "Root cause / 5 Whys conclusion", type: "textarea" },
    { key: "investigationSummary", label: "Investigation conclusion", type: "textarea" },
    { key: "correctiveActions", label: "Corrective and preventive actions", type: "textarea" },
    { key: "riddorReference", label: "RIDDOR submission reference", type: "text" },
  ] },
  { key: "inspections", label: "Inspection Management", shortLabel: "Inspections", description: "Schedule inspections, capture findings and close actions.", icon: ClipboardCheck, referencePrefix: "INSP", statuses: ["Scheduled", "In progress", "Completed", "Overdue", "Cancelled"], fields: [
    { key: "inspectionType", label: "Inspection type", type: "select", options: ["Site inspection", "Equipment pre-use", "Fire safety", "Environmental", "Welfare", "Ad hoc"], required: true },
    { key: "location", label: "Location", type: "text", required: true },
    { key: "checklist", label: "Checklist / scope", type: "textarea", required: true },
    { key: "findings", label: "Findings", type: "textarea" },
    { key: "score", label: "Compliance score (%)", type: "number" },
    { key: "correctiveActions", label: "Corrective actions / close-out evidence", type: "textarea" },
  ] },
  { key: "training", label: "Training Management", shortLabel: "Training", description: "Competence matrices, certificates, courses and expiry controls.", icon: GraduationCap, referencePrefix: "TRN", statuses: ["Assigned", "In progress", "Completed", "Expired", "Verified"], fields: [
    { key: "course", label: "Course / competence", type: "text", required: true },
    { key: "learner", label: "Learner", type: "text", required: true },
    { key: "provider", label: "Provider", type: "text" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "expiryDate", label: "Expiry date", type: "date" },
    { key: "verification", label: "Competence evidence / sign-off", type: "textarea" },
    { key: "certificateReference", label: "Certificate reference", type: "text" },
  ] },
  { key: "legal", label: "Legal Compliance Library", shortLabel: "Legal compliance", description: "UK legal register, applicability, evidence and review tracking.", icon: BookOpenCheck, referencePrefix: "LEG", statuses: ["Applicable", "Compliant", "Gap identified", "Review due", "Not applicable"], fields: [
    { key: "regulation", label: "Regulation", type: "text", required: true },
    { key: "summary", label: "Plain-English requirement", type: "textarea", required: true },
    { key: "applicability", label: "Why it applies", type: "textarea", required: true },
    { key: "evidence", label: "Compliance evidence", type: "textarea" },
    { key: "sourceUrl", label: "Official source URL", type: "text" },
    { key: "reviewDate", label: "Next review date", type: "date" },
  ] },
  { key: "iso", label: "Management System / ISO Suite", shortLabel: "ISO suite", description: "ISO gaps, NCRs, permits, SWOT and controlled policies.", icon: ShieldCheck, referencePrefix: "ISO", statuses: ["Open", "Evidence required", "Action in progress", "Conforming", "Closed"], fields: [
    { key: "framework", label: "Framework", type: "select", options: ["ISO 45001", "ISO 14001", "ISO 9001", "Permit to Work", "NCR", "SWOT", "Policy"], required: true },
    { key: "clause", label: "Clause / control", type: "text", required: true },
    { key: "assessment", label: "Assessment", type: "textarea", required: true },
    { key: "score", label: "Score (0-100)", type: "number", required: true },
    { key: "gap", label: "Gap / non-conformance", type: "textarea" },
    { key: "action", label: "Required action", type: "textarea" },
    { key: "evidence", label: "Conformance / close-out evidence", type: "textarea" },
  ] },
  { key: "documents", label: "Work Instructions & Documents", shortLabel: "Documents", description: "Controlled SOPs, policies, procedures and work instructions.", icon: FileStack, referencePrefix: "DOC", statuses: ["Draft", "In review", "Approved", "Published", "Obsolete"], fields: [
    { key: "documentType", label: "Document type", type: "select", options: ["SOP", "Policy", "Procedure", "Work instruction", "PMV", "Form"], required: true },
    { key: "version", label: "Version", type: "text", required: true },
    { key: "content", label: "Document content / purpose", type: "textarea", required: true },
    { key: "reviewer", label: "Reviewer / approver", type: "text" },
    { key: "reviewDate", label: "Review date", type: "date" },
  ] },
  { key: "emergency", label: "Emergency Response", shortLabel: "Emergency", description: "Muster, headcount, emergency roles, contacts and drills.", icon: ShieldAlert, referencePrefix: "EMR", statuses: ["Planned", "Active", "All clear", "Review required", "Closed"], fields: [
    { key: "eventType", label: "Event / drill type", type: "select", options: ["Fire drill", "Evacuation", "Chemical spill", "Medical emergency", "Security incident"], required: true },
    { key: "musterPoint", label: "Muster point", type: "text", required: true },
    { key: "expected", label: "Expected headcount", type: "number", required: true },
    { key: "accountedFor", label: "Accounted for", type: "number" },
    { key: "startedAt", label: "Start date", type: "date", required: true },
    { key: "observations", label: "Observations / lessons", type: "textarea" },
  ] },
  { key: "contractors", label: "Client / Contractor Management", shortLabel: "Contractors", description: "Onboarding, competence, orientations, RAMS and PTW controls.", icon: Building2, referencePrefix: "CON", statuses: ["Invited", "Onboarding", "Approved", "Restricted", "Offboarded"], fields: [
    { key: "company", label: "Contractor company", type: "text", required: true },
    { key: "contact", label: "Primary contact", type: "text", required: true },
    { key: "scope", label: "Scope of work", type: "textarea", required: true },
    { key: "orientation", label: "Orientation status", type: "select", options: ["Not assigned", "Assigned", "Completed"], required: true },
    { key: "ramsStatus", label: "RAMS status", type: "select", options: ["Not submitted", "Submitted", "Approved", "Rejected"], required: true },
    { key: "permitStatus", label: "PTW status", type: "select", options: ["Not required", "Required", "Issued", "Closed"], required: true },
  ] },
  { key: "change", label: "Change Management", shortLabel: "Change", description: "Assess, authorise and verify organisational or operational change.", icon: RefreshCw, referencePrefix: "MOC", statuses: ["Requested", "Assessing", "Approved", "Implementing", "Verified", "Rejected"], fields: [
    { key: "changeType", label: "Change type", type: "select", options: ["Process", "Equipment", "Organisation", "Legal", "Document", "Temporary"], required: true },
    { key: "reason", label: "Reason for change", type: "textarea", required: true },
    { key: "impact", label: "HSE impact assessment", type: "textarea", required: true },
    { key: "controls", label: "Controls / actions", type: "textarea", required: true },
    { key: "approver", label: "Approver", type: "text" },
    { key: "verification", label: "Post-implementation verification", type: "textarea" },
  ] },
  { key: "community", label: "Community & Knowledge", shortLabel: "Community", description: "Share lessons, articles, toolbox content and professional discussion.", icon: HeartHandshake, referencePrefix: "POST", statuses: ["Draft", "Published", "Flagged", "Archived"], fields: [
    { key: "contentType", label: "Content type", type: "select", options: ["Safety update", "Lesson learned", "Article", "Toolbox talk", "Discussion", "Video / podcast"], required: true },
    { key: "body", label: "Content", type: "textarea", required: true },
    { key: "topic", label: "Topic", type: "text", required: true },
    { key: "mediaUrl", label: "Media URL", type: "text" },
  ] },
  { key: "marketplace", label: "Consultant Marketplace", shortLabel: "Marketplace", description: "Verified consultants, briefs, engagements, milestones and ratings.", icon: BriefcaseBusiness, referencePrefix: "ENG", statuses: ["Proposed", "Negotiating", "Funded", "Active", "Completed", "Disputed"], fields: [
    { key: "consultant", label: "Consultant / firm", type: "text", required: true },
    { key: "specialism", label: "Specialism", type: "text", required: true },
    { key: "brief", label: "Project brief", type: "textarea", required: true },
    { key: "agreedRate", label: "Agreed rate (£)", type: "number", required: true },
    { key: "milestone", label: "Current milestone", type: "text" },
    { key: "rating", label: "Rating (1-5)", type: "number" },
    { key: "completionEvidence", label: "Milestone / completion evidence", type: "textarea" },
  ] },
];

export const MODULE_MAP = Object.fromEntries(MODULES.map((module) => [module.key, module])) as Record<ModuleKey, ModuleDefinition>;

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value);
}

export const WRITABLE_ROLES = ["SuperAdmin", "CompanyAdmin", "Manager", "Supervisor", "FrontLineEmployee", "Consultant"] as const;
