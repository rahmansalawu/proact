import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const organisations = sqliteTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default("company_standard"),
  jurisdiction: text("jurisdiction").notNull().default("UK"),
  settings: text("settings", { mode: "json" }).notNull().default({}),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("organisations_slug_unique").on(table.slug),
]);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("CompanyAdmin"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  index("users_organisation_idx").on(table.organisationId),
]);

export const moduleRecords = sqliteTable("module_records", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  module: text("module").notNull(),
  reference: text("reference").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("Draft"),
  priority: text("priority").notNull().default("Medium"),
  owner: text("owner").notNull(),
  dueDate: text("due_date"),
  payload: text("payload", { mode: "json" }).notNull().default({}),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("module_records_reference_unique").on(table.organisationId, table.reference),
  index("module_records_module_idx").on(table.organisationId, table.module),
  index("module_records_status_idx").on(table.organisationId, table.status),
]);

export const recordAttachments = sqliteTable("record_attachments", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  recordId: text("record_id").notNull().references(() => moduleRecords.id),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  contentBase64: text("content_base64").notNull(),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("record_attachments_record_idx").on(table.organisationId, table.recordId),
]);

export const recordActions = sqliteTable("record_actions", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  recordId: text("record_id").notNull().references(() => moduleRecords.id),
  description: text("description").notNull(),
  owner: text("owner").notNull(),
  dueDate: text("due_date"),
  status: text("status").notNull().default("Open"),
  priority: text("priority").notNull().default("Medium"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("record_actions_record_idx").on(table.organisationId, table.recordId),
  index("record_actions_due_idx").on(table.organisationId, table.status, table.dueDate),
]);

export const featureEntitlements = sqliteTable("feature_entitlements", {
  id: text("id").primaryKey(),
  tier: text("tier").notNull(),
  feature: text("feature").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  limitValue: integer("limit_value"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("feature_entitlements_unique").on(table.tier, table.feature),
]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  organisationId: text("organisation_id").notNull().references(() => organisations.id),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  oldValues: text("old_values", { mode: "json" }),
  newValues: text("new_values", { mode: "json" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("audit_logs_organisation_idx").on(table.organisationId, table.createdAt),
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
]);
