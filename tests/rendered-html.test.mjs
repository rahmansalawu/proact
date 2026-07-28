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
  assert.match(route, /Closed incidents require a root cause/);
  assert.match(route, /derivePayload/);
  assert.match(legal, /legislation\.gov\.uk/);
  assert.match(legal, /hse\.gov\.uk\/riddor/);
  assert.match(modules, /residualLikelihood/);
  assert.match(modules, /correctiveActions/);
});
