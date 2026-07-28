# ProAct HSE Pro - Product Gap Analysis

Status: Initial audit  
Source of truth: `proact.pdf`, "ProAct HSE Pro - Full System Design & Development Blueprint", v1.0  
Audit date: 2026-07-27  
Current preserved baseline: Git commit `90f01b4` on `main`

## 1. Executive finding

The current application is a responsive, visually polished product prototype. It is not yet a production SaaS and does not currently implement the operational workflows described in the original blueprint.

The prototype contains:

- A dashboard with seeded RAG indicators and charts.
- Presentation screens for incidents, RAMS, inspections, training, compliance, and the consultant marketplace.
- Client-side navigation, search, notifications, modal forms, and toast feedback.
- Responsive desktop and mobile layouts.
- A privately deployed demonstration site.

The prototype does not currently contain:

- Persistent user or organisation data.
- Real authentication, MFA, role-based access control, or tenant isolation.
- Working CRUD APIs or workflow state transitions.
- File uploads, evidence storage, certificate storage, or exports.
- AI integrations, payment integrations, email delivery, or background processing.
- Server-side feature enforcement or subscription management.
- Immutable audit records, GDPR workflows, or production observability.
- The native mobile application described by the blueprint.

Buttons that report successful actions currently show a toast without performing the underlying operation. The incident form closes and displays a success message but does not save a record.

## 2. Product goals extracted from the PDF

The product is a GDPR-compliant, AI-enhanced, multi-tenant HSE and ESG platform serving individuals, consultants, and companies in the UK, USA, Canada, UAE, and Nigeria.

Its core outcome model is:

1. Capture safety evidence.
2. Control compliance gaps and risk.
3. Prove performance through defensible records and reports.
4. Connect HSE professionals and clients.
5. Grow a continuous safety culture.

The PDF defines four commercial tiers:

- Free.
- Consultant Pro.
- Company Standard.
- Company Enterprise.

The blueprint requires server-enforced feature flags, user limits, export restrictions, billing state, and plan-specific module access.

## 3. Module-by-module implementation status

| # | Module | PDF requirement summary | Current state | Status |
|---|---|---|---|---|
| 1 | Dashboard & Analytics | Configurable RAG KPIs, RIDDOR/LTI/DAFW, leading and lagging indicators, scheduled reports, safety alerts, lesson repository | Attractive seeded dashboard and chart; no calculated metrics, configuration, scheduler, alerts, reports, or database | Partial UI only |
| 2 | Risk Management & RAMS | MEEPS method statements, 5x5 matrix, COSHH, return-to-work plans, AI drafting, versioning, approvals, PDF/editable exports | Static RAMS cards and AI toast; no builder, calculations, approvals, COSHH, versioning, or exports | Partial UI only |
| 3 | Incident Management | Initial report, evidence, investigation, witness statements, RCA/5 Whys/Fishbone, RIDDOR/OSHA assistance, actions, lesson poster | Static list and unsaved quick form; no lifecycle, evidence, RCA, regulatory workflow, actions, or lesson generation | Partial UI only |
| 4 | Inspection Management | Custom templates, schedules, mobile checks, findings, photos, overdue tracking and escalation | Static schedule and seeded insight; no checklist execution, persistence, evidence, templates, or escalation | Partial UI only |
| 5 | Training Management | Training matrix, certificate upload/OCR, expiry alerts, course builder, assessments, competence sign-off, PDF certificates | Static completion cards; no learners, certificates, OCR, courses, tests, alerts, or competence records | Partial UI only |
| 6 | Legal Compliance Library | Jurisdiction selector, regulations and source links, applicability, change monitoring and alerts | Four static framework cards; no legal register, source records, jurisdictions, applicability, or update process | Partial UI only |
| 7 | Management System / ISO Suite | ISO 45001/14001/9001 gap analysis, scoring, NCRs, PTW, SWOT, policy builder | Static compliance score only; no clause assessment, NCR, PTW, SWOT, policies, or workflow | Mostly missing |
| 8 | Work Instructions & Documents | SOP templates, PMV, procedures, policies, customisation, approval and version control | Sidebar label only; no document workspace | Missing |
| 9 | Emergency Response | Offline muster register, QR headcount, role registry, emergency contacts, drill records and reports | No screen, data model, or workflow | Missing |
| 10 | Client / Contractor Management | Contractor onboarding, orientation, PTW, RAMS approval, verification and controls | No screen, data model, or workflow | Missing |
| 11 | Change Management | Structured requests, impact/risk assessment, evidence, approvals, actions and closure | No screen, data model, or workflow | Missing |
| 12 | Community & Knowledge | Professional feed, long-form content, discussions, media embeds and searchable learning | No screen, data model, or workflow | Missing |
| 13 | Consultant Marketplace | Profiles, verification, discovery, briefs, negotiation, escrow, milestones, ratings, disputes, LinkedIn | Static consultant cards and search field; no profiles, engagement flow, payments, messaging, ratings, or verification | Partial UI only |

## 4. Cross-cutting platform gaps

### Identity, tenancy, and access

- No public account registration or sign-in flow.
- No MFA.
- No organisation onboarding.
- No tenant-aware data access.
- No RBAC enforcement for SuperAdmin, CompanyAdmin, Manager, Supervisor, FrontLineEmployee, Consultant, or ReadOnlyAuditor.
- No invitations, account suspension, seat limits, or auditor access.

### Data and backend

- The database binding is disabled.
- The current schema contains only a starter example table.
- There are no product API routes.
- There is no transactional workflow logic.
- There are no background queues, scheduled jobs, WebSocket updates, or notification jobs.

### Files and evidence

- No R2/S3 binding.
- No signed upload/download flow.
- No malware or MIME validation.
- No evidence, certificate, policy, poster, or report storage.

### AI

- AI buttons are presentational.
- No RAMS assistant.
- No incident narrative interview.
- No ISO gap scorer.
- No training matrix generator.
- No lesson-learned poster generation.
- No PII redaction, usage logging, rate limits, or human-in-the-loop control.

### Commerce

- No Stripe subscriptions.
- No webhook handling or billing state.
- No failed-payment grace period.
- No Escrow.com engagement flow.
- No commission, milestones, release, dispute, invoice, or tax handling.

### Compliance and security

- No immutable audit log.
- No GDPR access, portability, retention, anonymisation, consent, or breach workflows.
- No organisation-configured retention.
- No production CSP/security-header verification.
- No WAF, rate limiting, anomaly detection, SIEM, backup, restore, or disaster-recovery implementation.
- The dependency audit currently reports known advisories that must be remediated before production release.

### Quality and operations

- The existing automated test is a stale starter test and does not test the product.
- No unit, integration, workflow E2E, accessibility, security, or load tests.
- No CI/CD security gates, infrastructure code, operational runbooks, or release promotion process.
- No user, admin, API, compliance, or support documentation.

## 5. Functional defects in the current prototype

1. Incident submission does not persist data.
2. RAMS AI, inspection start, training assignment, gap analysis, exports, plan management, marketplace profiles, and report generation only display toast messages.
3. Several navigation items have no associated content.
4. Search is local and only filters the seeded incident array.
5. Dashboard values and dates are hard-coded.
6. There are no record-detail pages or editable workflows.
7. There is no server validation or authorisation.
8. There is no durable offline queue.
9. The existing test suite targets the removed starter preview and is not a valid product test.

## 6. Architecture decision required

The PDF mandates an external commercial SaaS architecture:

- Next.js web application.
- React Native / Expo mobile application.
- NestJS API.
- PostgreSQL with Prisma and row-level security.
- Redis and background queues.
- Supabase Auth or Auth0.
- S3-compatible object storage.
- Stripe, Escrow.com, email, AI, monitoring, and AWS infrastructure.

The current deployment uses the Sites/Vinext runtime, whose native durable services are D1 and R2 and whose supported authentication path differs from the PDF. A production implementation must deliberately choose either:

1. The exact PDF architecture for a public commercial SaaS; or
2. A Sites-native adaptation using D1, R2, and platform authentication.

This choice affects the database, authentication, payments, mobile app, infrastructure, and every module API. It must be resolved before the production foundation is implemented.

## 7. Recommended implementation programme

### Stage 0 - Decisions and threat model

- Confirm hosting architecture, identity provider, launch jurisdictions, and external-service environments.
- Produce data-classification, threat-model, tenant-isolation, and regulatory-content ownership decisions.

### Stage 1 - Platform foundation

- Monorepo structure for web, API, mobile, shared schemas, infrastructure, and documentation.
- Authentication, MFA, organisation onboarding, invitations, RBAC, and server-side authorisation.
- Multi-tenant database schema, tenant policies, encrypted sensitive fields, audit log, migrations, and seed data.
- Feature flags, subscription entitlements, seat limits, notifications, background jobs, and file storage.
- Security headers, request validation, rate limiting, structured logging, and health checks.

### Stage 2 - Core safety workflows

- Dashboard and calculated HSE metrics.
- Incidents from report through investigation, RCA, actions, closure, RIDDOR assistance, and lessons learned.
- RAMS/MEEPS builder, 5x5 risk calculation, approvals, versioning, acknowledgement, and export.
- Inspection templates, schedules, mobile execution, findings, evidence, actions, and escalation.
- Training matrix, certificate records, expiry alerts, course builder, tests, competence sign-off, and certificates.

### Stage 3 - Governance modules

- Legal compliance library and applicability registers.
- ISO gap analysis, NCR, PTW, SWOT, and policy builder.
- Work instructions and controlled documents.
- Client/contractor onboarding and controls.
- Change management.
- Emergency response and offline muster.

### Stage 4 - Marketplace and community

- Consultant registration, verification, discovery, briefs, negotiation, messaging, milestones, escrow, disputes, and ratings.
- Community feed, articles, comments, moderation, media embeds, and knowledge repository.

### Stage 5 - Release readiness

- Stripe subscriptions and entitlement webhooks.
- GDPR self-service workflows and retention jobs.
- Data exports and import validation.
- Unit, integration, E2E, accessibility, security, and performance test suites.
- CI/CD, IaC, observability, backup/restore, disaster recovery, runbooks, and documentation.
- Independent legal-content review, DPO review, penetration test, and UAT.

## 8. Definition of complete

A module is not complete because its screen exists. Each module must have:

- Real persisted records and tenant ownership.
- Create, read, update, archive/close, search, filter, and export behaviour as applicable.
- Server-side validation and role-based authorisation.
- Audit logging for every state change.
- Evidence/file handling where applicable.
- Notifications, reminders, and escalations where applicable.
- Empty, loading, validation, error, offline, and permission-denied states.
- Keyboard and mobile accessibility.
- Automated unit, integration, and E2E coverage.
- User-facing help and admin configuration.

The product is go-to-market ready only after all required modules meet this definition and the external security, legal, privacy, and operational reviews are completed.
