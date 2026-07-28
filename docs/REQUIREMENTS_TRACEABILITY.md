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
| Organisation onboarding | Not started | Create organisation, jurisdiction, tier and admin |
| Multi-tenant isolation | Not started | Cross-tenant API tests must always deny access |
| Server-side RBAC | Not started | Permission matrix tests for all eight roles |
| Feature flags and tier limits | Not started | API tests prove server-side restrictions |
| Immutable audit trail | Not started | State-changing requests append non-editable records |
| Encrypted sensitive fields | Not started | Encryption and key-rotation design verified |
| Structured API validation | Not started | Invalid payload and boundary tests |
| File evidence storage | Not started | Signed access, MIME limits and malware workflow |
| Background jobs and alerts | Not started | Retry, idempotency and dead-letter tests |
| Subscription billing | Not started | Sandbox upgrade, downgrade and failure-grace tests |
| Data export and portability | Not started | User and organisation export packages |
| GDPR access and anonymisation | Not started | DSR workflow tests with retained legal records |
| Offline incident/inspection capture | Not started | Queue, reconnect and conflict tests |

## Product modules

| Module | UI | Persistence | Workflow | RBAC | Audit | Export | Automated tests | Overall |
|---|---|---|---|---|---|---|---|---|
| Dashboard & Analytics | Partial | No | No | No | No | No | No | In progress |
| Risk Management & RAMS | Partial | No | No | No | No | No | No | In progress |
| Incident Management | Partial | No | No | No | No | No | No | In progress |
| Inspection Management | Partial | No | No | No | No | No | No | In progress |
| Training Management | Partial | No | No | No | No | No | No | In progress |
| Legal Compliance Library | Partial | No | No | No | No | No | No | In progress |
| Management System / ISO | Partial | No | No | No | No | No | No | In progress |
| Work Instructions & Documents | No | No | No | No | No | No | No | Not started |
| Emergency Response | No | No | No | No | No | No | No | Not started |
| Client / Contractor Management | No | No | No | No | No | No | No | Not started |
| Change Management | No | No | No | No | No | No | No | Not started |
| Community & Knowledge | No | No | No | No | No | No | No | Not started |
| Consultant Marketplace | Partial | No | No | No | No | No | No | In progress |

## Release gates

| Gate | Status |
|---|---|
| All 13 modules meet the definition of complete | Not started |
| Zero known critical/high production vulnerabilities | Not started |
| GDPR/DPO review complete | Externally blocked |
| Legal content reviewed in every launch jurisdiction | Externally blocked |
| Payment and escrow sandbox journeys verified | Externally blocked |
| Independent penetration test complete | Externally blocked |
| Backup and restore drill complete | Not started |
| RTO and RPO demonstrated | Not started |
| Closed beta UAT complete | Externally blocked |
| Production launch approval | Externally blocked |
