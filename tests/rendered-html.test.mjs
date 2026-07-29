import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the ProAct product shell and metadata", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /ProAct HSE Pro/);
  assert.match(layout, /Capture\. Control\. Prove\./);
  assert.match(page, /Tenant-scoped SQLite persistence/);
  assert.match(packageJson, /"name": "proact-hse-pro"/);
  assert.doesNotMatch(`${layout}\n${page}`, /Your site is taking shape|codex-preview|SkeletonPreview/);
});

test("defines every blueprint module and functional record operations", async () => {
  const [catalog, route, schema] = await Promise.all([
    readFile(new URL("../app/lib/modules.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  for (const moduleKey of [
    "dashboard", "rams", "incidents", "inspections", "training", "legal",
    "iso", "documents", "emergency", "contractors", "change", "community",
    "marketplace",
  ]) {
    assert.match(catalog, new RegExp(`key: "${moduleKey}"`));
  }

  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /export async function DELETE/);
  assert.match(route, /organisation_id = \?/);
  assert.match(route, /audit_logs_no_update/);
  assert.match(route, /audit_logs_no_delete/);
  assert.match(schema, /module_records/);
  assert.match(schema, /audit_logs/);
  assert.match(schema, /feature_entitlements/);
});

test("enforces UK legal and module-specific workflow controls", async () => {
  const [route, legal, modules] = await Promise.all([
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/uk-legal.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/modules.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /hasTrustedOrigin/);
  assert.match(route, /first user|userCount/);
  assert.match(route, /Closed incidents require root cause analysis/);
  assert.match(route, /derivePayload/);
  assert.match(route, /ALLOWED_EVIDENCE_TYPES/);
  assert.match(route, /MAX_EVIDENCE_BYTES/);
  assert.match(route, /record_attachments/);
  assert.match(route, /record_actions/);
  assert.match(route, /ACTION_GATE_STATUSES/);
  assert.match(route, /Close all corrective actions/);
  assert.match(route, /backupRequested/);
  assert.match(route, /schemaVersion: 3/);
  assert.match(route, /\.chatgpt\.site/);
  assert.match(route, /proact-public-demo/);
  assert.match(route, /demo\.tester@proact\.local/);
  assert.match(legal, /legislation\.gov\.uk/);
  assert.match(legal, /hse\.gov\.uk\/riddor/);
  assert.match(modules, /residualLikelihood/);
  assert.match(modules, /correctiveActions/);
});

test("implements the dedicated consultant marketplace workflows", async () => {
  const [marketplace, route, modules] = await Promise.all([
    readFile(new URL("../app/components/marketplace-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/modules.ts", import.meta.url), "utf8"),
  ]);
  assert.match(marketplace, /marketplaceType/);
  assert.match(marketplace, /Discovery filters/);
  assert.match(marketplace, /Qualifications/);
  assert.match(marketplace, /NEBOSH \/ IOSH \/ OSHCR/);
  assert.match(marketplace, /LinkedIn OAuth is not active yet/);
  assert.match(marketplace, /youtube-nocookie\.com/);
  assert.match(marketplace, /Held in test escrow/);
  assert.match(marketplace, /Consultant rates client/);
  assert.match(marketplace, /Topic thread/);
  assert.match(route, /p\.marketplaceType === "engagement"/);
  assert.match(modules, /"Profile active"/);
});

test("maps the strategy workflows into integrated local modules", async () => {
  const [page, modules, route, community, review] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/modules.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/community-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/STRATEGY_MODULE_REVIEW.md", import.meta.url), "utf8"),
  ]);
  for (const workflow of ["COSHH Assessment", "Return-to-Work Plan", "Guided 5 Whys", "Training Matrix Requirement", "Permit to Work", "Muster Register"]) assert.match(modules, new RegExp(workflow));
  for (const derived of ["riddorReportable", "complianceRag", "expiryBand", "evacuationMinutes", "approvalReady"]) assert.match(route, new RegExp(derived));
  assert.match(page, /RIDDOR YTD/);
  assert.match(page, /CONNECTED CONTROLS/);
  assert.match(community, /Incident lessons awaiting publication/);
  assert.match(community, /reactions/);
  assert.match(review, /Cross-unit acceptance paths/);
});

test("provides an idempotent, visibly labelled operational simulation pack", async () => {
  const [simulation, route, page] = await Promise.all([
    readFile(new URL("../app/lib/simulation-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  for (const module of ["rams", "incidents", "inspections", "training", "legal", "iso", "documents", "emergency", "contractors", "change", "community", "marketplace"]) assert.match(simulation, new RegExp(`"${module}"`));
  assert.match(simulation, /simulatedData: true/);
  assert.match(simulation, /Fractured wrist following loading-bay fall/);
  assert.match(simulation, /Held in test escrow/);
  assert.match(route, /seed_simulation/);
  assert.match(route, /payload LIKE/);
  assert.match(route, /Only an administrator can load simulated workspace data/);
  assert.match(page, /Operational simulation active/);
  assert.match(page, /simulated-badge/);
});

test("provides bounded local assistance without external AI data transfer", async () => {
  const [assistant, route, page, modules] = await Promise.all([
    readFile(new URL("../app/lib/local-ai.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/assist/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/modules.ts", import.meta.url), "utf8"),
  ]);
  assert.match(assistant, /local-simulation/);
  assert.match(assistant, /Work at Height Regulations 2005/);
  assert.match(assistant, /competent UK HSE professional/);
  assert.match(route, /Cross-origin assistant requests/);
  assert.match(route, /no-store/);
  assert.match(page, /Local AI simulator/);
  assert.match(page, /no external data transfer/);
  assert.match(modules, /investigationPrompts/);
  assert.match(modules, /recommendedMatrix/);
  assert.match(modules, /assistantRationale/);
});
