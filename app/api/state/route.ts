import { env } from "cloudflare:workers";
import { z } from "zod";
import { isModuleKey, MODULE_MAP, WRITABLE_ROLES } from "../../lib/modules";
import { UK_LEGAL_STARTERS } from "../../lib/uk-legal";

export const dynamic = "force-dynamic";

type WorkflowInput = {
  module: string;
  status: string;
  payload: Record<string, unknown>;
};

function hasValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function workflowIssues(input: WorkflowInput) {
  const p = input.payload;
  const issues: { key: string; message: string }[] = [];
  const requireFields = (keys: string[], message: string) => {
    for (const key of keys) if (!hasValue(p, key)) issues.push({ key, message });
  };

  if (input.module === "rams") {
    for (const key of ["likelihood", "consequence", "residualLikelihood", "residualConsequence"]) {
      if (hasValue(p, key) && (Number(p[key]) < 1 || Number(p[key]) > 5)) issues.push({ key, message: "Risk values must be from 1 to 5." });
    }
    if (input.status === "Approved") requireFields(["residualLikelihood", "residualConsequence", "approvedBy", "reviewDate"], "Approved RAMS require residual risk, a competent approver and review date.");
  }
  if (input.module === "incidents" && input.status === "Closed") {
    requireFields(["rootCause", "investigationSummary", "correctiveActions"], "Closed incidents require a root cause, investigation conclusion and corrective actions.");
    if (p.riddor === "Not assessed" || !hasValue(p, "riddor")) issues.push({ key: "riddor", message: "A final RIDDOR assessment is required before closure." });
    if (p.riddor === "Reportable" && !hasValue(p, "riddorReference")) issues.push({ key: "riddorReference", message: "Record the RIDDOR submission reference before closure." });
  }
  if (input.module === "inspections" && input.status === "Completed") {
    requireFields(["findings", "score"], "Completed inspections require findings and a compliance score.");
    if (hasValue(p, "score") && (Number(p.score) < 0 || Number(p.score) > 100)) issues.push({ key: "score", message: "Compliance score must be from 0 to 100." });
  }
  if (input.module === "training" && ["Completed", "Verified"].includes(input.status)) {
    requireFields(["issueDate", "verification"], "Completed training requires an issue date and competence evidence.");
  }
  if (input.module === "legal" && input.status === "Compliant") {
    requireFields(["evidence", "reviewDate"], "A compliant legal entry requires evidence and a next review date.");
  }
  if (input.module === "iso" && ["Conforming", "Closed"].includes(input.status)) {
    requireFields(["evidence"], "Conforming or closed assurance records require close-out evidence.");
  }
  if (input.module === "documents" && ["Approved", "Published"].includes(input.status)) {
    requireFields(["reviewer", "reviewDate"], "Approved documents require an approver and review date.");
  }
  if (input.module === "emergency" && ["All clear", "Closed"].includes(input.status)) {
    requireFields(["accountedFor", "observations"], "Emergency close-out requires a headcount and observations.");
    if (Number(p.accountedFor) !== Number(p.expected)) issues.push({ key: "accountedFor", message: "All expected people must be accounted for before all-clear or closure." });
  }
  if (input.module === "contractors" && input.status === "Approved") {
    if (p.orientation !== "Completed" || p.ramsStatus !== "Approved" || p.permitStatus === "Required") {
      issues.push({ key: "orientation", message: "Approval requires completed orientation, approved RAMS and no unissued required permit." });
    }
  }
  if (input.module === "change" && input.status === "Approved") requireFields(["approver"], "Approved changes require an approver.");
  if (input.module === "change" && input.status === "Verified") requireFields(["approver", "verification"], "Verified changes require an approver and post-implementation verification.");
  if (input.module === "marketplace" && input.status === "Completed") requireFields(["milestone", "completionEvidence", "rating"], "Completed engagements require milestone evidence and a rating.");
  return issues;
}

function derivePayload(module: string, payload: Record<string, unknown>) {
  const next = { ...payload };
  if (module === "rams") {
    const initial = Number(payload.likelihood || 0) * Number(payload.consequence || 0);
    const residual = Number(payload.residualLikelihood || 0) * Number(payload.residualConsequence || 0);
    next.initialRiskScore = initial;
    next.initialRiskRating = initial >= 17 ? "Very high" : initial >= 10 ? "High" : initial >= 5 ? "Medium" : initial > 0 ? "Low" : "Not calculated";
    next.residualRiskScore = residual;
    next.residualRiskRating = residual >= 17 ? "Very high" : residual >= 10 ? "High" : residual >= 5 ? "Medium" : residual > 0 ? "Low" : "Not calculated";
  }
  return next;
}

const ALLOWED_EVIDENCE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
]);
const MAX_EVIDENCE_BYTES = 2 * 1024 * 1024;

const evidenceInput = z.object({
  action: z.literal("upload_evidence"),
  recordId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().refine((value) => ALLOWED_EVIDENCE_TYPES.has(value), "Only PDF, JPG, PNG, WebP, TXT and CSV evidence is supported."),
  sizeBytes: z.number().int().positive().max(MAX_EVIDENCE_BYTES),
  contentBase64: z.string().min(4).max(Math.ceil(MAX_EVIDENCE_BYTES * 4 / 3) + 8),
});

function safeFileName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f/\\:]/g, "_").slice(0, 180);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

const recordBase = z.object({
  module: z.string().refine(isModuleKey, "Unknown module"),
  title: z.string().trim().min(3).max(180),
  status: z.string().trim().min(2).max(60),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  owner: z.string().trim().min(2).max(120),
  dueDate: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const recordInput = recordBase.superRefine((input, context) => {
  if (!isModuleKey(input.module)) return;
  if (!MODULE_MAP[input.module].statuses.includes(input.status)) {
    context.addIssue({ code: "custom", path: ["status"], message: "Status is not valid for this module." });
  }
  if (JSON.stringify(input.payload).length > 100_000) {
    context.addIssue({ code: "custom", path: ["payload"], message: "Record data is too large." });
  }
  for (const issue of workflowIssues(input)) {
    context.addIssue({ code: "custom", path: ["payload", issue.key], message: issue.message });
  }
});

const updateInput = recordBase.partial().extend({
  id: z.string().uuid(),
});

type Actor = {
  id: string;
  organisationId: string;
  email: string;
  displayName: string;
  role: string;
};

type DbRecord = {
  id: string;
  organisation_id: string;
  module: string;
  reference: string;
  title: string;
  status: string;
  priority: string;
  owner: string;
  due_date: string | null;
  payload: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS organisations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subscription_tier TEXT NOT NULL DEFAULT 'company_standard',
    jurisdiction TEXT NOT NULL DEFAULT 'UK',
    settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL REFERENCES organisations(id),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CompanyAdmin',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS users_organisation_idx ON users(organisation_id)`,
  `CREATE TABLE IF NOT EXISTS module_records (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL REFERENCES organisations(id),
    module TEXT NOT NULL,
    reference TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    priority TEXT NOT NULL DEFAULT 'Medium',
    owner TEXT NOT NULL,
    due_date TEXT,
    payload TEXT NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(organisation_id, reference)
  )`,
  `CREATE INDEX IF NOT EXISTS module_records_module_idx ON module_records(organisation_id, module)`,
  `CREATE INDEX IF NOT EXISTS module_records_status_idx ON module_records(organisation_id, status)`,
  `CREATE TABLE IF NOT EXISTS record_attachments (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL REFERENCES organisations(id),
    record_id TEXT NOT NULL REFERENCES module_records(id),
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    content_base64 TEXT NOT NULL,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS record_attachments_record_idx ON record_attachments(organisation_id, record_id)`,
  `CREATE TABLE IF NOT EXISTS feature_entitlements (
    id TEXT PRIMARY KEY,
    tier TEXT NOT NULL,
    feature TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    limit_value INTEGER,
    created_at TEXT NOT NULL,
    UNIQUE(tier, feature)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organisation_id TEXT NOT NULL REFERENCES organisations(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS audit_logs_organisation_idx ON audit_logs(organisation_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id)`,
  `CREATE TRIGGER IF NOT EXISTS audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    BEGIN SELECT RAISE(ABORT, 'audit logs are immutable'); END`,
  `CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    BEGIN SELECT RAISE(ABORT, 'audit logs are immutable'); END`,
];

function db() {
  if (!env.DB) throw new Error("SQLite/D1 binding is unavailable");
  return env.DB;
}

async function ensureSchema() {
  const database = db();
  await database.batch(schemaStatements.map((statement) => database.prepare(statement)));
}

function requestIdentity(request: Request) {
  const url = new URL(request.url);
  const forwardedEmail = request.headers.get("oai-authenticated-user-email");
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  if (!forwardedEmail && !isLocal) return null;

  const encodedName = request.headers.get("oai-authenticated-user-full-name");
  const encodedCorrectly = request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8";
  let fullName: string | null = null;
  if (encodedName && encodedCorrectly) {
    try { fullName = decodeURIComponent(encodedName); } catch { fullName = null; }
  }

  return {
    email: forwardedEmail?.toLowerCase() ?? "alex.king@proact.local",
    displayName: fullName ?? (forwardedEmail ? forwardedEmail.split("@")[0] : "Alex King"),
  };
}

async function getActor(request: Request): Promise<Actor | null> {
  const identity = requestIdentity(request);
  if (!identity) return null;
  await ensureSchema();
  const database = db();
  const now = new Date().toISOString();

  let organisation = await database.prepare(
    "SELECT id, name, subscription_tier, jurisdiction FROM organisations WHERE slug = ? LIMIT 1",
  ).bind("apex-infrastructure").first<{ id: string; name: string; subscription_tier: string; jurisdiction: string }>();

  if (!organisation) {
    const organisationId = crypto.randomUUID();
    await database.prepare(
      "INSERT INTO organisations (id, name, slug, subscription_tier, jurisdiction, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(organisationId, "Apex Infrastructure", "apex-infrastructure", "company_standard", "UK", "{}", now, now).run();
    organisation = { id: organisationId, name: "Apex Infrastructure", subscription_tier: "company_standard", jurisdiction: "UK" };
  }

  let actor = await database.prepare(
    "SELECT id, organisation_id, email, display_name, role FROM users WHERE email = ? AND is_active = 1 LIMIT 1",
  ).bind(identity.email).first<{
    id: string; organisation_id: string; email: string; display_name: string; role: string;
  }>();

  if (!actor) {
    const userCount = await database.prepare(
      "SELECT COUNT(*) AS total FROM users WHERE organisation_id = ?",
    ).bind(organisation.id).first<{ total: number }>();
    if ((userCount?.total ?? 0) > 0) return null;
    const userId = crypto.randomUUID();
    await database.prepare(
      "INSERT INTO users (id, organisation_id, email, display_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
    ).bind(userId, organisation.id, identity.email, identity.displayName, "CompanyAdmin", now, now).run();
    actor = { id: userId, organisation_id: organisation.id, email: identity.email, display_name: identity.displayName, role: "CompanyAdmin" };
  }

  return {
    id: actor.id,
    organisationId: actor.organisation_id,
    email: actor.email,
    displayName: actor.display_name,
    role: actor.role,
  };
}

function canWrite(role: string) {
  return (WRITABLE_ROLES as readonly string[]).includes(role);
}

function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestUrl = new URL(request.url);
  try {
    const originUrl = new URL(origin);
    return originUrl.host === requestUrl.host && originUrl.protocol === requestUrl.protocol;
  } catch {
    return false;
  }
}

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

async function writeAudit(request: Request, actor: Actor, action: string, entityId: string, oldValues: unknown, newValues: unknown, entityType = "module_record") {
  await db().prepare(
    "INSERT INTO audit_logs (id, organisation_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    crypto.randomUUID(),
    actor.organisationId,
    actor.id,
    action,
    entityType,
    entityId,
    oldValues == null ? null : JSON.stringify(oldValues),
    newValues == null ? null : JSON.stringify(newValues),
    clientIp(request),
    request.headers.get("user-agent"),
    new Date().toISOString(),
  ).run();
}

function parseRecord(row: DbRecord) {
  let payload: Record<string, unknown> = {};
  try { payload = JSON.parse(row.payload || "{}"); } catch { payload = {}; }
  return {
    id: row.id,
    organisationId: row.organisation_id,
    module: row.module,
    reference: row.reference,
    title: row.title,
    status: row.status,
    priority: row.priority,
    owner: row.owner,
    dueDate: row.due_date,
    payload,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return response({ error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Please correct the highlighted fields.", details: error.flatten() } }, 400);
  }
  console.error("ProAct API error", error instanceof Error ? error.message : "Unknown error");
  return response({ error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } }, 500);
}

export async function GET(request: Request) {
  try {
    const actor = await getActor(request);
    if (!actor) return response({ error: { code: "UNAUTHENTICATED", message: "Sign in is required." } }, 401);
    const url = new URL(request.url);
    const selectedModule = url.searchParams.get("module");
    const includeAudit = url.searchParams.get("audit") === "1";
    const attachmentId = url.searchParams.get("attachment");
    if (selectedModule && !isModuleKey(selectedModule)) return response({ error: { code: "INVALID_MODULE", message: "Unknown module." } }, 400);
    if (attachmentId) {
      const attachment = await db().prepare(
        "SELECT id, file_name, mime_type, size_bytes, content_base64 FROM record_attachments WHERE id = ? AND organisation_id = ? LIMIT 1",
      ).bind(attachmentId, actor.organisationId).first<{ id: string; file_name: string; mime_type: string; size_bytes: number; content_base64: string }>();
      if (!attachment) return response({ error: { code: "NOT_FOUND", message: "Evidence file not found." } }, 404);
      const bytes = decodeBase64(attachment.content_base64);
      return new Response(bytes, {
        headers: {
          "content-type": attachment.mime_type,
          "content-length": String(bytes.byteLength),
          "content-disposition": `attachment; filename="${safeFileName(attachment.file_name).replaceAll('"', "")}"`,
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    const query = selectedModule
      ? db().prepare("SELECT * FROM module_records WHERE organisation_id = ? AND module = ? ORDER BY updated_at DESC").bind(actor.organisationId, selectedModule)
      : db().prepare("SELECT * FROM module_records WHERE organisation_id = ? ORDER BY updated_at DESC").bind(actor.organisationId);
    const recordsResult = await query.all<DbRecord>();
    const organisation = await db().prepare(
      "SELECT id, name, slug, subscription_tier, jurisdiction, settings FROM organisations WHERE id = ?",
    ).bind(actor.organisationId).first();

    const audits = includeAudit
      ? (await db().prepare(
          "SELECT id, action, entity_type, entity_id, old_values, new_values, created_at FROM audit_logs WHERE organisation_id = ? ORDER BY created_at DESC LIMIT 100",
        ).bind(actor.organisationId).all()).results
      : [];
    const attachments = (await db().prepare(
      "SELECT id, record_id, file_name, mime_type, size_bytes, uploaded_by, created_at FROM record_attachments WHERE organisation_id = ? ORDER BY created_at DESC",
    ).bind(actor.organisationId).all()).results;

    return response({
      organisation,
      actor,
      records: recordsResult.results.map(parseRecord),
      audit: audits,
      attachments,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return response({ error: { code: "INVALID_ORIGIN", message: "Cross-origin writes are not allowed." } }, 403);
    const actor = await getActor(request);
    if (!actor) return response({ error: { code: "UNAUTHENTICATED", message: "Sign in is required." } }, 401);
    if (!canWrite(actor.role)) return response({ error: { code: "FORBIDDEN", message: "Your role cannot create records." } }, 403);
    const body = await request.json();
    const evidence = evidenceInput.safeParse(body);
    if (evidence.success) {
      const database = db();
      const record = await database.prepare(
        "SELECT id, reference, title FROM module_records WHERE id = ? AND organisation_id = ? LIMIT 1",
      ).bind(evidence.data.recordId, actor.organisationId).first<{ id: string; reference: string; title: string }>();
      if (!record) return response({ error: { code: "NOT_FOUND", message: "The evidence record was not found." } }, 404);
      let bytes: Uint8Array;
      try { bytes = decodeBase64(evidence.data.contentBase64); } catch { return response({ error: { code: "INVALID_FILE", message: "The evidence content is not valid base64." } }, 400); }
      if (bytes.byteLength !== evidence.data.sizeBytes || bytes.byteLength > MAX_EVIDENCE_BYTES) {
        return response({ error: { code: "INVALID_FILE_SIZE", message: "The evidence size does not match or exceeds 2 MB." } }, 400);
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const metadata = {
        id,
        record_id: record.id,
        file_name: safeFileName(evidence.data.fileName),
        mime_type: evidence.data.mimeType,
        size_bytes: bytes.byteLength,
        uploaded_by: actor.id,
        created_at: now,
      };
      await database.prepare(
        "INSERT INTO record_attachments (id, organisation_id, record_id, file_name, mime_type, size_bytes, content_base64, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(id, actor.organisationId, record.id, metadata.file_name, metadata.mime_type, metadata.size_bytes, evidence.data.contentBase64, actor.id, now).run();
      await writeAudit(request, actor, "UPLOAD", id, null, { ...metadata, record_reference: record.reference }, "record_attachment");
      return response({ attachment: metadata }, 201);
    }
    if (z.object({ action: z.literal("seed_uk_legal") }).safeParse(body).success) {
      const database = db();
      const now = new Date().toISOString();
      let inserted = 0;
      for (const starter of UK_LEGAL_STARTERS) {
        const existing = await database.prepare(
          "SELECT id FROM module_records WHERE organisation_id = ? AND module = 'legal' AND title = ? LIMIT 1",
        ).bind(actor.organisationId, starter.title).first<{ id: string }>();
        if (existing) continue;
        const moduleCount = await database.prepare(
          "SELECT COUNT(*) AS total FROM module_records WHERE organisation_id = ? AND module = 'legal'",
        ).bind(actor.organisationId).first<{ total: number }>();
        const id = crypto.randomUUID();
        const reference = `LEG-${String((moduleCount?.total ?? 0) + 1).padStart(4, "0")}`;
        const payload = {
          regulation: starter.title,
          summary: starter.summary,
          applicability: starter.applicability,
          evidence: "",
          sourceUrl: starter.sourceUrl,
          reviewDate: "",
          starterLibrary: true,
          disclaimer: "Starter information only. Confirm applicability and current requirements with a competent person.",
        };
        await database.prepare(
          "INSERT INTO module_records (id, organisation_id, module, reference, title, status, priority, owner, due_date, payload, created_by, created_at, updated_at) VALUES (?, ?, 'legal', ?, ?, 'Review due', 'Medium', ?, NULL, ?, ?, ?, ?)",
        ).bind(id, actor.organisationId, reference, starter.title, actor.displayName, JSON.stringify(payload), actor.id, now, now).run();
        const created = await database.prepare("SELECT * FROM module_records WHERE id = ?").bind(id).first<DbRecord>();
        await writeAudit(request, actor, "CREATE", id, null, created);
        inserted += 1;
      }
      return response({ inserted }, inserted ? 201 : 200);
    }
    const input = recordInput.parse(body);
    const database = db();
    const moduleCount = await database.prepare(
      "SELECT COUNT(*) AS total FROM module_records WHERE organisation_id = ? AND module = ?",
    ).bind(actor.organisationId, input.module).first<{ total: number }>();
    const reference = `${MODULE_MAP[input.module].referencePrefix}-${String((moduleCount?.total ?? 0) + 1).padStart(4, "0")}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const enrichedPayload = derivePayload(input.module, input.payload);
    await database.prepare(
      "INSERT INTO module_records (id, organisation_id, module, reference, title, status, priority, owner, due_date, payload, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, actor.organisationId, input.module, reference, input.title, input.status, input.priority, input.owner, input.dueDate ?? null, JSON.stringify(enrichedPayload), actor.id, now, now).run();
    const created = await database.prepare("SELECT * FROM module_records WHERE id = ?").bind(id).first<DbRecord>();
    await writeAudit(request, actor, "CREATE", id, null, created);
    return response({ record: parseRecord(created!) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return response({ error: { code: "INVALID_ORIGIN", message: "Cross-origin writes are not allowed." } }, 403);
    const actor = await getActor(request);
    if (!actor) return response({ error: { code: "UNAUTHENTICATED", message: "Sign in is required." } }, 401);
    if (!canWrite(actor.role)) return response({ error: { code: "FORBIDDEN", message: "Your role cannot update records." } }, 403);
    const input = updateInput.parse(await request.json());
    const existing = await db().prepare(
      "SELECT * FROM module_records WHERE id = ? AND organisation_id = ? LIMIT 1",
    ).bind(input.id, actor.organisationId).first<DbRecord>();
    if (!existing) return response({ error: { code: "NOT_FOUND", message: "Record not found." } }, 404);

    const current = parseRecord(existing);
    const next = {
      module: input.module ?? current.module,
      title: input.title ?? current.title,
      status: input.status ?? current.status,
      priority: input.priority ?? current.priority,
      owner: input.owner ?? current.owner,
      dueDate: input.dueDate === undefined ? current.dueDate : input.dueDate,
      payload: input.payload ?? current.payload,
    };
    const validatedNext = recordInput.parse(next);
    const enrichedPayload = derivePayload(validatedNext.module, validatedNext.payload);
    const now = new Date().toISOString();
    await db().prepare(
      "UPDATE module_records SET module = ?, title = ?, status = ?, priority = ?, owner = ?, due_date = ?, payload = ?, updated_at = ? WHERE id = ? AND organisation_id = ?",
    ).bind(validatedNext.module, validatedNext.title, validatedNext.status, validatedNext.priority, validatedNext.owner, validatedNext.dueDate, JSON.stringify(enrichedPayload), now, input.id, actor.organisationId).run();
    const updated = await db().prepare("SELECT * FROM module_records WHERE id = ?").bind(input.id).first<DbRecord>();
    await writeAudit(request, actor, "UPDATE", input.id, existing, updated);
    return response({ record: parseRecord(updated!) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return response({ error: { code: "INVALID_ORIGIN", message: "Cross-origin writes are not allowed." } }, 403);
    const actor = await getActor(request);
    if (!actor) return response({ error: { code: "UNAUTHENTICATED", message: "Sign in is required." } }, 401);
    if (!["SuperAdmin", "CompanyAdmin"].includes(actor.role)) return response({ error: { code: "FORBIDDEN", message: "Only an administrator can delete records." } }, 403);
    const body = await request.json();
    const attachmentDelete = z.object({ attachmentId: z.string().uuid() }).safeParse(body);
    if (attachmentDelete.success) {
      const attachment = await db().prepare(
        "SELECT id, record_id, file_name, mime_type, size_bytes, uploaded_by, created_at FROM record_attachments WHERE id = ? AND organisation_id = ? LIMIT 1",
      ).bind(attachmentDelete.data.attachmentId, actor.organisationId).first();
      if (!attachment) return response({ error: { code: "NOT_FOUND", message: "Evidence file not found." } }, 404);
      await db().prepare("DELETE FROM record_attachments WHERE id = ? AND organisation_id = ?").bind(attachmentDelete.data.attachmentId, actor.organisationId).run();
      await writeAudit(request, actor, "DELETE", attachmentDelete.data.attachmentId, attachment, null, "record_attachment");
      return response({ success: true });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(body);
    const existing = await db().prepare(
      "SELECT * FROM module_records WHERE id = ? AND organisation_id = ? LIMIT 1",
    ).bind(id, actor.organisationId).first<DbRecord>();
    if (!existing) return response({ error: { code: "NOT_FOUND", message: "Record not found." } }, 404);
    const attachments = (await db().prepare(
      "SELECT id, file_name, mime_type, size_bytes FROM record_attachments WHERE record_id = ? AND organisation_id = ?",
    ).bind(id, actor.organisationId).all()).results;
    await db().prepare("DELETE FROM record_attachments WHERE record_id = ? AND organisation_id = ?").bind(id, actor.organisationId).run();
    await db().prepare("DELETE FROM module_records WHERE id = ? AND organisation_id = ?").bind(id, actor.organisationId).run();
    await writeAudit(request, actor, "DELETE", id, { ...existing, attachments }, null);
    return response({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
