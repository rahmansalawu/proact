# ProAct HSE Pro - Requirements Traceability

This document is the implementation ledger for the product blueprint. Status values are:

- `Not started`
- `In progress`
- `Implemented`
- `Verified`
- `Externally blocked`

## Platform foundation

| Requirement | Status | Evidence / acceptance test |
|---|---|---|
| Public authentication and MFA | Not started | Sign-up, sign-in, recovery, MFA setup and enforcement tests |
| Organisation onboarding | In progress | Local workspace and first CompanyAdmin are provisioned automatically; later unknown identities are denied |
| Multi-tenant isolation | Implemented | Every query is scoped by server-resolved organisation ID; adversarial tests still required |
| Server-side RBAC | Implemented | Write/delete operations enforce role checks; full eight-role matrix tests remain |
| Feature flags and tier limits | In progress | Entitlement schema exists; enforcement policies remain |
| Immutable audit trail | Verified | Create, update and delete produced three append-only events; update/delete triggers included |
| Encrypted sensitive fields | Not started | Encryption and key-rotation design verified |
| Structured API validation | Implemented | Zod schemas validate create, update and delete payloads, enforce module statuses and limit payload size |
| File evidence storage | In progress | Tenant-scoped local SQLite attachments, MIME/size limits and audited downloads are implemented; hosted object storage and malware scanning remain |
| Background jobs and alerts | In progress | Live action due/overdue calculations are implemented; scheduled outbound alerts, retries and dead-letter handling remain |
| Subscription billing | Not started | Sandbox upgrade, downgrade and failure-grace tests |
| Data export and portability | In progress | Module CSV and administrator full JSON backup exports are implemented; restore/import remains |
| GDPR access and anonymisation | Not started | DSR workflow tests with retained legal records |
| Offline incident/inspection capture | Not started | Queue, reconnect and conflict tests |

## Product modules

| Module | UI | Persistence | Workflow | RBAC | Audit | Export | Automated tests | Overall |
|---|---|---|---|---|---|---|---|---|
| Dashboard & Analytics | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Risk Management & RAMS | Implemented | Implemented | Risk scoring and approval gates | Implemented | Implemented | CSV | Partial | In progress |
| Incident Management | Implemented | Implemented | Investigation, actions and closure gates | Implemented | Implemented | CSV | Partial | In progress |
| Inspection Management | Implemented | Implemented | Findings, actions and completion gate | Implemented | Implemented | CSV | Partial | In progress |
| Training Management | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Legal Compliance Library | Implemented | Implemented | UK starter register | Implemented | Implemented | CSV | Partial | In progress |
| Management System / ISO | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Work Instructions & Documents | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Emergency Response | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Client / Contractor Management | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Change Management | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Community & Knowledge | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |
| Consultant Marketplace | Implemented | Implemented | Partial | Implemented | Implemented | CSV | Partial | In progress |

## Release gates

| Gate | Status |
|---|---|
| All 13 modules meet the definition of complete | Not started |
| Zero known critical/high dependency vulnerabilities | Verified |
| GDPR/DPO review complete | Externally blocked |
| Legal content reviewed in every launch jurisdiction | Externally blocked |
| Payment and escrow sandbox journeys verified | Externally blocked |
| Independent penetration test complete | Externally blocked |
| Backup and restore drill complete | In progress (export verified; restore not implemented) |
| RTO and RPO demonstrated | Not started |
| Closed beta UAT complete | Externally blocked |
| Production launch approval | Externally blocked |
