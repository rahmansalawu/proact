# ProAct HSE Pro — Strategy Module Review

Review basis: the July 2026 strategy/master build document supplied by the product owner, constrained to the agreed UK-only launch and local SQLite/D1 operation. OAuth, AI APIs, regulated payments, email/SMS, OCR, malware scanning and other external services are excluded from this phase.

## Integrated product controls

The modules share one tenant-scoped record service, corrective-action service, evidence store, immutable audit trail, CSV export and organisation backup. The dashboard reads the same live records and actions rather than maintaining separate KPI data. Module workspaces now expose connected controls so users can move between operationally related units.

| Unit | Locally functional in this phase | Deliberately outstanding |
|---|---|---|
| Dashboard & Analytics | Live assurance score; RIDDOR YTD; DAFW; near-miss, inspection and 30-day training indicators; priority safety alert; cross-module action/overdue totals | Configurable RAG thresholds, scheduled email reports, workforce-hours rate denominator, trend charts |
| Risk Management & RAMS | Conditional MEEPS method statement, COSHH and return-to-work workflows; 5×5 initial/residual scoring; approval gate; controlled version, briefing and review metadata | AI drafting, SDS database lookup, signatures/acknowledgement roster, generated PDF |
| Incident Management | Event classification, date/time, severity, injury/DAFW, witnesses, supervisor statement, linked RAMS, evidence, 5 Whys, fishbone factors, RIDDOR decision/reference, actions, closure gate and lesson learnt | AI interview, direct HSE submission, generated PowerPoint poster |
| Inspection Management | Schedule frequency, assigned inspector, checklist, findings/defects, compliance score/RAG, evidence, corrective actions and completion gate | Reusable checklist designer, offline queue, camera capture and generated PDF |
| Training Management | Role matrix requirement, certificate record, internal-course metadata, assessment types/grades, expiry bands and competence verification | Full question bank/test runner, OCR, branded PDF certificate, scheduled notifications |
| Legal Compliance Library | UK starter register, official links, applicability, sector, owner, evidence, status and review tracking | Automated legislative monitoring and non-UK jurisdiction packs |
| Management System / ISO | Conditional ISO 45001/14001/9001 gap analysis, scores/RAG, NCR, PTW, SWOT and controlled-policy workflows; evidence and action close-out | Licensed clause libraries/Enhesa, AI scoring/drafting, PDF/PPT export |
| Work Instructions & Documents | SOP/policy/procedure/work-instruction/form records; controlled version, revision summary, reviewer, effective/review dates and superseded version | Rich document editor, approval signatures and generated controlled PDF |
| Emergency Response | Conditional evacuation/drill, muster register, role registry and emergency-contact workflows; expected/accounted/exempt/unaccounted calculation and evacuation duration | QR generation/scanning, encrypted offline mode and drill PDF |
| Client / Contractor Management | Scope, competence/insurance, orientation, linked RAMS, PTW reference and approval readiness/gate | Invitation email, video orientation player and external document verification |
| Change Management | Request, affected systems, impact, consultation, controls, approval, implementation, linked records and effectiveness verification | Multi-person approval routing and outbound notifications |
| Community & Knowledge | Dedicated feed, content types, reactions, comments, toolbox view and one-click publication of controlled incident lessons | Moderation queue, hosted media processing and external social publishing |
| Consultant Marketplace | Profiles, discovery filters, community content, safe YouTube embeds, briefs, test escrow states, disputes, two-way ratings and trust score | LinkedIn OAuth, regulated escrow/payment custody, automated emails and admin verification operations |

## Cross-unit acceptance paths

1. Incident → investigation evidence/action → closure gate → lesson learnt → Community publication → dashboard indicators.
2. RAMS → residual risk/approval/briefing → Contractor linked RAMS status → PTW control in ISO/Contractor records.
3. Inspection → compliance RAG → corrective actions → dashboard open/overdue workload.
4. Training expiry/verification → Contractor and Emergency competence evidence → dashboard 30-day alert.
5. Legal obligation → ISO gap/NCR → controlled Document → Change request → effectiveness verification.
6. Marketplace consultant → brief → agreed test-escrow state → active engagement → client sign-off → two-way rating/trust score.

## Local simulated assistance

RAMS, Incident, ISO and Training record editors include an optional local assistant. It applies deterministic UK-focused rules to fields already entered, proposes editable content, explains its rationale and raises missing-information questions. The request is processed inside the application with no API key or external AI data transfer.

This is a product simulation, not a large language model, legal opinion or competent-person approval. Outputs must be checked and amended by a competent UK HSE professional before they become controlled records. A real AI provider, tenant-level opt-in, data-processing terms, redaction controls, model evaluations and human-approval governance remain production work.

## Production blockers outside the local phase

The application must not be described as production-complete until authentication/MFA is restored, encrypted offline storage is designed, external file malware scanning is enabled, regulated payment custody is integrated, backups have a tested restore path, GDPR workflows are completed, and independent security/accessibility/legal reviews pass. The public demo must never contain personal, confidential, health, payment or commercially sensitive information.
