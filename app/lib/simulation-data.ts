import type { ModuleKey } from "./modules";

export type SimulationRecordSeed = {
  simulationId: string;
  module: Exclude<ModuleKey, "dashboard">;
  title: string;
  status: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  owner: string;
  dueDate: string | null;
  payload: Record<string, unknown>;
};

export type SimulationActionSeed = {
  recordSimulationId: string;
  description: string;
  owner: string;
  dueDate: string | null;
  status: "Open" | "In progress" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
};

export function buildSimulationData(anchor = new Date()) {
  const day = (offset: number) => new Date(anchor.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
  const moment = (offset: number, hour = 9, minute = 0) => {
    const date = new Date(anchor.getTime() + offset * 86_400_000);
    date.setUTCHours(hour, minute, 0, 0);
    return date.toISOString().slice(0, 16);
  };
  const record = (simulationId: string, module: SimulationRecordSeed["module"], title: string, status: string, priority: SimulationRecordSeed["priority"], owner: string, dueOffset: number | null, payload: Record<string, unknown>): SimulationRecordSeed => ({
    simulationId, module, title, status, priority, owner, dueDate: dueOffset == null ? null : day(dueOffset),
    payload: { ...payload, simulatedData: true, simulationId },
  });

  const records: SimulationRecordSeed[] = [
    record("rams-scaffold", "rams", "Scaffold erection — Riverside Block C", "Approved", "High", "Daniel Okoro", 45, {
      assessmentType: "RAMS / Method Statement", version: 3, taskDescription: "Erect and inspect a 12 m independent tied scaffold", location: "Riverside Block C",
      materials: "EN 39 tube, fittings, boards and debris netting", equipment: "Telehandler, harnesses and tagged access equipment", environment: "Live construction site with pedestrian interface",
      peopleCompetence: "CISRS scaffolders and competent inspector", systemSteps: "Barrier area; unload; base out; erect by lifts; tie; inspect; tag; hand over",
      hazards: "Falls from height; falling materials; unstable base; vehicle interface", controls: "Collective edge protection; exclusion zone; engineered ties; daily inspections",
      likelihood: 4, consequence: 5, residualLikelihood: 1, residualConsequence: 5, approvedBy: "Sarah Mitchell CMIOSH", reviewDate: day(45), workforceAcknowledgement: "Eight operatives briefed and signed acknowledgement",
    }),
    record("rams-coshh-resin", "rams", "COSHH — two-part epoxy floor resin", "Submitted", "Medium", "Priya Shah", 7, {
      assessmentType: "COSHH Assessment", version: 1, taskDescription: "Mix and apply epoxy coating in plant room", location: "Plant Room 2",
      hazards: "Skin sensitisation; eye contact; vapour exposure", controls: "Local ventilation; nitrile gloves; goggles; RPE if ventilation fails",
      likelihood: 3, consequence: 3, residualLikelihood: 1, residualConsequence: 3, sdsUrl: "https://www.hse.gov.uk/coshh/", exposureLimits: "Follow SDS; restrict occupancy; provide eyewash and spill kit",
    }),
    record("rams-rtw-warehouse", "rams", "Return-to-work plan — warehouse operative", "Draft", "Medium", "Louise Carter", 2, {
      assessmentType: "Return-to-Work Plan", version: 1, taskDescription: "Phased return following musculoskeletal absence", location: "Central Distribution Centre",
      hazards: "Manual handling aggravation and fatigue", controls: "Restricted lifting; buddy support; weekly review", likelihood: 3, consequence: 3, residualLikelihood: 1, residualConsequence: 2,
      reasonableAdjustments: "Four-hour shifts week 1; no lifts above 5 kg; rotate picking duties; review after seven days",
    }),

    record("incident-riddor", "incidents", "Fractured wrist following loading-bay fall", "Investigating", "Critical", "James Whitfield", 1, {
      eventType: "Reportable", location: "North loading bay", occurredAt: moment(-12, 14, 35), severity: "Serious", injuryType: "Fracture", daysAwayFromWork: 9,
      description: "Operative fell approximately 1.2 m from an unprotected dock edge during unloading", immediateAction: "Work stopped; first aid provided; bay isolated",
      witnesses: "M. Evans and K. Bello statements recorded", supervisorStatement: "Temporary barrier had been moved for delivery access", linkedRiskAssessment: "RAMS-0001",
      riddor: "Reportable", rootCause: "Dock-edge control was removed without equivalent temporary protection", fishbone: "Process: permit gap; Plant: barrier design; People: delivery pressure",
      investigationSummary: "Formal investigation in progress", correctiveActions: "Install interlocked dock gates and revise unloading standard", riddorReference: "SIM-RID-2026-014",
    }),
    record("incident-nearmiss", "incidents", "High-potential near miss — suspended load", "Actions open", "High", "Amina Okafor", -2, {
      eventType: "High potential near miss", location: "Tower crane lifting zone", occurredAt: moment(-5, 10, 10), severity: "Major", daysAwayFromWork: 0,
      description: "Worker entered the lifting exclusion zone while a pallet was suspended", immediateAction: "Lift stopped and worker removed from zone", riddor: "Not reportable",
      witnesses: "Banksman and crane supervisor", supervisorStatement: "Radio instruction was misunderstood", linkedRiskAssessment: "RAMS-0001",
      rootCause: "Exclusion-zone ownership and radio protocol were unclear", fishbone: "People and process factors", investigationSummary: "Investigation complete",
      correctiveActions: "Dedicated barrier marshal and repeat radio protocol briefing", lessonLearnt: "No person enters a lifting exclusion zone until the appointed person confirms the load is landed and the zone released.",
    }),
    record("incident-environment", "incidents", "Hydraulic oil spill at excavator", "Closed", "Medium", "Tom Bennett", null, {
      eventType: "Environmental event", location: "East compound", occurredAt: moment(-28, 8, 20), severity: "Moderate", daysAwayFromWork: 0,
      description: "Approximately 12 litres of hydraulic oil released from a failed hose", immediateAction: "Machine stopped; spill kit deployed; contaminated material removed",
      riddor: "Not reportable", rootCause: "Hose abrasion was not identified during pre-use check", investigationSummary: "No material reached drainage system",
      correctiveActions: "Revised plant pre-use checklist and hose protection", lessonLearnt: "Inspect hydraulic hoses at contact points before every shift and report abrasion immediately.",
    }),
    record("incident-unsafe", "incidents", "Unsafe condition — damaged temporary lighting", "Submitted", "Medium", "Nadia Hussain", 3, {
      eventType: "Unsafe condition", location: "Basement corridor", occurredAt: moment(-1, 16, 5), severity: "Moderate", daysAwayFromWork: 0,
      description: "Damaged fitting exposed internal wiring in a wet access corridor", immediateAction: "Circuit isolated and corridor closed", riddor: "Not reportable",
    }),

    record("inspection-weekly", "inspections", "Weekly site assurance inspection — Week 31", "Completed", "Low", "Sarah Mitchell", null, {
      inspectionType: "Site inspection", location: "Riverside Project", scheduleFrequency: "Weekly", inspector: "Sarah Mitchell",
      checklist: "Access; work at height; lifting; housekeeping; welfare; environmental controls", findings: "Two minor housekeeping findings", failedItems: "Blocked access at Block B; mixed waste in timber skip",
      score: 92, correctiveActions: "Access cleared and waste re-sorted before close-out", completedAt: day(-1),
    }),
    record("inspection-fire", "inspections", "Monthly fire safety inspection", "Overdue", "High", "Michael Reed", -4, {
      inspectionType: "Fire safety", location: "Head Office", scheduleFrequency: "Monthly", inspector: "Michael Reed", checklist: "Escape routes; alarm panel; extinguishers; fire doors; emergency lighting",
    }),
    record("inspection-forklift", "inspections", "Forklift pre-use check — FLT-07", "Completed", "Low", "Grace Mensah", null, {
      inspectionType: "Equipment pre-use", location: "Central Distribution Centre", scheduleFrequency: "Daily", inspector: "Grace Mensah",
      checklist: "Tyres; forks; hydraulics; horn; beacon; restraint", findings: "All items serviceable", failedItems: "None", score: 100, correctiveActions: "No action required", completedAt: day(0),
    }),
    record("inspection-environment", "inspections", "Environmental compliance walk", "Scheduled", "Medium", "Priya Shah", 6, {
      inspectionType: "Environmental", location: "East compound", scheduleFrequency: "Monthly", inspector: "Priya Shah", checklist: "Drainage; spill controls; waste segregation; dust; noise; fuel storage",
    }),

    record("training-firstaid", "training", "Emergency First Aid at Work — Maya Evans", "Verified", "Low", "Louise Carter", null, {
      trainingType: "Certificate Record", jobRole: "Site Administrator", course: "Emergency First Aid at Work", learner: "Maya Evans", provider: "St John Ambulance",
      issueDate: day(-210), expiryDate: day(885), verification: "Certificate checked against provider record", verifiedBy: "Louise Carter", certificateReference: "EFAW-48391",
    }),
    record("training-telehandler", "training", "CPCS Telehandler — Liam Brooks", "Completed", "Medium", "Daniel Okoro", 12, {
      trainingType: "Certificate Record", jobRole: "Plant Operator", course: "CPCS A17 Telehandler", learner: "Liam Brooks", provider: "National Construction College",
      issueDate: day(-1790), expiryDate: day(12), verification: "Card sighted; renewal booked", certificateReference: "CPCS-SIM-7712",
    }),
    record("training-firemarshal", "training", "Fire Marshal refresher cohort", "Assigned", "Medium", "Michael Reed", 21, {
      trainingType: "Internal Course", jobRole: "Fire Marshal", course: "Fire Marshal Refresher", learner: "Six appointed marshals", provider: "ProAct Internal",
      courseContent: "Alarm response; sweep zones; mobility assistance; muster reporting", assessmentType: "Multiple choice", passingGrade: 80,
    }),
    record("training-rams", "training", "RAMS briefing competence — scaffold team", "Verified", "Low", "Daniel Okoro", null, {
      trainingType: "Competence Verification", jobRole: "Scaffolder", course: "RAMS-0001 workforce briefing", learner: "Riverside scaffold team",
      issueDate: day(-2), assessmentScore: 100, verification: "Verbal check and practical observation completed", verifiedBy: "Daniel Okoro",
    }),
    record("training-asbestos", "training", "Asbestos awareness — design team", "Expired", "High", "Louise Carter", -18, {
      trainingType: "Certificate Record", jobRole: "Designer / Surveyor", course: "Asbestos Awareness", learner: "Four design team members", provider: "UKATA",
      issueDate: day(-383), expiryDate: day(-18), verification: "Renewal required", certificateReference: "UKATA-SIM-442",
    }),

    record("legal-cdm", "legal", "CDM 2015 — contractor coordination", "Compliant", "Medium", "Sarah Mitchell", 70, {
      regulation: "Construction (Design and Management) Regulations 2015", summary: "Plan, manage and monitor construction work with competent dutyholders",
      applicability: "Principal contractor activities at Riverside Project", evidence: "Construction phase plan; competence checks; coordination meeting minutes",
      sourceUrl: "https://www.legislation.gov.uk/uksi/2015/51/contents", industrySector: "Construction", lastUpdated: "2015-04-06", responsibleOwner: "Sarah Mitchell", reviewDate: day(70),
    }),
    record("legal-coshh-gap", "legal", "COSHH 2002 — health surveillance review", "Gap identified", "High", "Priya Shah", 14, {
      regulation: "Control of Substances Hazardous to Health Regulations 2002", summary: "Assess and control exposure to hazardous substances and provide health surveillance where required",
      applicability: "Resins, cement dust and cleaning chemicals", evidence: "COSHH register present; health-surveillance scope incomplete",
      sourceUrl: "https://www.legislation.gov.uk/uksi/2002/2677/contents", industrySector: "Construction", responsibleOwner: "Priya Shah", reviewDate: day(14),
    }),

    record("iso-45001", "iso", "ISO 45001 clause 8.1 operational control", "Action in progress", "Medium", "Sarah Mitchell", 20, {
      framework: "ISO 45001 Gap Analysis", clause: "8.1 Operational planning and control", assessment: "Core operational controls exist; temporary-work inspection evidence is inconsistent",
      score: 74, gap: "Scaffold handover records not consistently attached", action: "Standardise digital handover evidence", evidence: "Procedure HSE-PRO-014 and inspection sample",
    }),
    record("iso-ncr", "iso", "NCR — contractor insurance expired", "Open", "High", "James Whitfield", 5, {
      framework: "Non-conformance (NCR)", clause: "Contractor control procedure 5.2", assessment: "Subcontractor accessed site with expired public-liability certificate",
      gap: "Expiry control failed", action: "Suspend access, obtain certificate and review onboarding control", evidence: "Access log and expired certificate copy",
    }),
    record("iso-ptw", "iso", "Hot-work permit — Level 4 riser", "Open", "High", "Michael Reed", 0, {
      framework: "Permit to Work", permitType: "Hot Work", permitLocation: "Block C Level 4 riser", validUntil: moment(0, 18, 0),
      assessment: "Welding support brackets in controlled riser", evidence: "Fire watch and extinguisher confirmed",
    }),
    record("iso-swot", "iso", "2026 HSE strategy SWOT", "Conforming", "Low", "Sarah Mitchell", null, {
      framework: "SWOT Analysis", strengths: "Strong supervisor engagement and digital audit trail", weaknesses: "Training expiry ownership varies by project",
      opportunities: "Mobile inspections and contractor benchmarking", threats: "Labour turnover and supply-chain competence", evidence: "Leadership workshop record",
    }),

    record("doc-lifting", "documents", "Lifting Operations Standard", "Published", "Low", "Sarah Mitchell", 180, {
      documentType: "SOP", version: "2.1", content: "Planning, exclusion zones, signalling, supervision and lift close-out requirements",
      revisionSummary: "Added radio protocol and exclusion-zone release control", effectiveDate: day(-3), supersedes: "HSE-SOP-009 v2.0", reviewer: "James Whitfield", reviewDate: day(180),
    }),
    record("doc-incident", "documents", "Incident Investigation Procedure", "Approved", "Low", "James Whitfield", 270, {
      documentType: "Procedure", version: "4.0", content: "Notification, evidence, RCA, RIDDOR decision and learning publication workflow",
      revisionSummary: "Aligned digital evidence and action gates", effectiveDate: day(5), supersedes: "HSE-PRO-003 v3.2", reviewer: "Sarah Mitchell", reviewDate: day(270),
    }),
    record("doc-spill", "documents", "Hydraulic spill response card", "In review", "Medium", "Priya Shah", 4, {
      documentType: "Work instruction", version: "1.1", content: "Stop source; protect drains; contain; recover; report; replenish spill kit",
      revisionSummary: "Added plant isolation and contaminated-waste route", reviewer: "Tom Bennett", reviewDate: day(4),
    }),

    record("emergency-drill", "emergency", "Riverside evacuation drill — July", "Closed", "Low", "Michael Reed", null, {
      responseType: "Evacuation / Drill", eventType: "Fire drill", musterPoint: "Assembly Point A", expected: 86, accountedFor: 83, exempt: 3,
      startedAt: moment(-9, 10, 0), allClearAt: moment(-9, 10, 8), observations: "All zones cleared; one subcontractor reported to the wrong muster point",
    }),
    record("emergency-muster", "emergency", "Riverside live muster register", "Planned", "Medium", "Michael Reed", 1, {
      responseType: "Muster Register", musterPoint: "Assembly Point A", expected: 91, accountedFor: 0, exempt: 5,
      workerRegister: "Core team 42; subcontractors 37; visitors 7; confirmed off-site 5",
    }),
    record("emergency-roles", "emergency", "Emergency role registry — Riverside", "Planned", "Low", "Louise Carter", 30, {
      responseType: "Emergency Role", musterPoint: "Assembly Point A", roleRegistry: "Chief Marshal: Michael Reed; Zone Marshals: Maya Evans, K. Bello; First Aiders: Maya Evans, Tom Bennett; IMT Lead: Sarah Mitchell",
    }),
    record("emergency-contacts", "emergency", "Emergency contact directory", "Planned", "Low", "Louise Carter", 60, {
      responseType: "Emergency Contact", emergencyContacts: "Emergency services: 999; Site Manager: Daniel Okoro 07000 000101; HSE Director: Sarah Mitchell 07000 000102; Environmental lead: Priya Shah 07000 000103",
    }),

    record("contractor-apex", "contractors", "Northstar Scaffolding Ltd", "Approved", "Medium", "Daniel Okoro", 44, {
      company: "Northstar Scaffolding Ltd", contact: "Ellie Watson", scope: "Scaffold erection, alteration and weekly inspection",
      competenceEvidence: "CISRS cards; £10m PL insurance; scaffold design competence", insuranceExpiry: day(210), orientation: "Completed",
      ramsStatus: "Approved", permitStatus: "Not required", linkedRams: "RAMS-0001", orientationResult: "Passed 92%; site rules acknowledged",
    }),
    record("contractor-electrical", "contractors", "VoltSafe Electrical Services", "Onboarding", "High", "Nadia Hussain", 3, {
      company: "VoltSafe Electrical Services", contact: "Aaron Cole", scope: "Temporary power and electrical isolation",
      competenceEvidence: "NICEIC certificate received; insurance review pending", insuranceExpiry: day(8), orientation: "Assigned",
      ramsStatus: "Submitted", permitStatus: "Required", linkedRams: "Awaiting review", permitReference: "PTW pending",
    }),
    record("contractor-ground", "contractors", "GreenLine Groundworks", "Restricted", "Critical", "James Whitfield", -1, {
      company: "GreenLine Groundworks", contact: "Leah Morgan", scope: "Drainage and excavation",
      competenceEvidence: "Insurance expired; competence cards current", insuranceExpiry: day(-2), orientation: "Completed",
      ramsStatus: "Rejected", permitStatus: "Required", linkedRams: "RAMS revision requested", orientationResult: "Site orientation completed",
    }),

    record("change-gates", "change", "Install interlocked loading-bay gates", "Implementing", "High", "James Whitfield", 10, {
      changeType: "Equipment", reason: "Corrective action following loading-bay injury", affectedSystems: "Loading bays 1–4; unloading SOP; driver induction",
      impact: "Reduces fall exposure; introduces powered gate maintenance requirement", controls: "Temporary barriers until commissioning; PUWER assessment; operator briefing",
      consultation: "Warehouse team, facilities, drivers and HSE committee", approver: "Sarah Mitchell", implementationDate: day(8),
      linkedRecords: "INC simulated fractured wrist; DOC Lifting Operations Standard",
    }),
    record("change-radio", "change", "Standard lifting radio protocol", "Verified", "Low", "Amina Okafor", null, {
      changeType: "Process", reason: "Learning from suspended-load near miss", affectedSystems: "Lift plans, RAMS, banksman training and contractor orientation",
      impact: "Improves clarity during lifting operations", controls: "Standard call signs, read-back and stop-work phrase",
      consultation: "Appointed persons and lifting teams", approver: "Sarah Mitchell", implementationDate: day(-2),
      verification: "Observed on three lifts with full protocol compliance", linkedRecords: "Near-miss incident; RAMS scaffold; training briefing",
    }),
    record("change-chemical", "change", "Substitute low-VOC cleaning chemical", "Assessing", "Medium", "Priya Shah", 9, {
      changeType: "Process", reason: "Reduce worker exposure and VOC emissions", affectedSystems: "COSHH register, purchasing, cleaning procedure and waste stream",
      impact: "Lower inhalation risk; compatibility testing required", controls: "Trial in one area; review SDS; update COSHH and brief cleaners",
    }),

    record("community-lift", "community", "Lift-zone lesson: the exclusion zone is not optional", "Published", "High", "Amina Okafor", null, {
      contentType: "Lesson learned", topic: "Lifting operations", body: "A suspended load was stopped when a worker entered the lifting zone. The revised rule is simple: the zone remains controlled until the appointed person confirms the load is landed and releases it.",
      sourceRecord: "Simulated high-potential near miss", mediaUrl: "", reactions: 18, comments: [{ author: "Daniel Okoro", body: "Briefed to all lifting teams this morning.", createdAt: anchor.toISOString() }],
    }),
    record("community-toolbox", "community", "Toolbox talk: preventing hydraulic spills", "Published", "Low", "Priya Shah", null, {
      contentType: "Toolbox talk", topic: "Environmental protection", body: "Inspect hoses at abrasion points, carry the correct spill kit, protect drains first and report every loss of containment.",
      sourceRecord: "Simulated hydraulic spill", mediaUrl: "", reactions: 11, comments: [],
    }),
    record("community-alert", "community", "Safety alert — loading-bay edge protection", "Published", "Critical", "Sarah Mitchell", null, {
      contentType: "Safety update", topic: "Immediate control", body: "Loading-bay edges must remain protected whenever a vehicle is not docked. If the fixed gate is unavailable, stop unloading and install an approved temporary barrier.",
      sourceRecord: "Simulated loading-bay injury", mediaUrl: "", reactions: 27, comments: [],
    }),
    record("community-article", "community", "What good contractor assurance looks like", "Published", "Low", "Sarah Mitchell", null, {
      contentType: "Article", topic: "Contractor management", body: "Competence, insurance, orientation, RAMS and permits are one connected control. Approval is only meaningful when every prerequisite is current and evidenced.",
      sourceRecord: "Contractor assurance programme", mediaUrl: "", reactions: 9, comments: [],
    }),

    record("market-consultant-amina", "marketplace", "Amina Okafor CMIOSH", "Profile active", "Low", "Amina Okafor", null, {
      marketplaceType: "consultant", ownerEmail: "amina.simulated@proact.test", displayName: "Amina Okafor", headline: "Construction safety and ISO 45001 lead auditor",
      location: "Manchester", jurisdictions: ["UK"], specialisms: ["Construction", "ISO 45001", "Lifting operations"], qualifications: ["NEBOSH Diploma", "ISO 45001 Lead Auditor"],
      memberships: ["CMIOSH", "OSHCR"], yearsExperience: 14, availability: "Available this month", dailyRate: 675, bio: "Supports principal contractors with management systems, high-risk operations and assurance.", verified: true, rating: 4.9, reviewCount: 18,
    }),
    record("market-consultant-james", "marketplace", "James Whitfield CFIOSH", "Profile active", "Low", "James Whitfield", null, {
      marketplaceType: "consultant", ownerEmail: "james.simulated@proact.test", displayName: "James Whitfield", headline: "Incident investigation and RIDDOR specialist",
      location: "Birmingham", jurisdictions: ["UK"], specialisms: ["Incident investigation", "RIDDOR", "Root cause analysis"], qualifications: ["MSc Occupational Safety", "NEBOSH Diploma"],
      memberships: ["CFIOSH", "OSHCR"], yearsExperience: 19, availability: "Available now", dailyRate: 725, bio: "Independent investigator for serious incidents and high-potential events.", verified: true, rating: 4.8, reviewCount: 24,
    }),
    record("market-consultant-priya", "marketplace", "Priya Shah MIEMA", "Profile active", "Low", "Priya Shah", null, {
      marketplaceType: "consultant", ownerEmail: "priya.simulated@proact.test", displayName: "Priya Shah", headline: "Environmental compliance and ISO 14001 consultant",
      location: "London", jurisdictions: ["UK"], specialisms: ["ISO 14001", "COSHH", "Environmental compliance"], qualifications: ["MSc Environmental Management", "ISO 14001 Lead Auditor"],
      memberships: ["MIEMA", "CEnv"], yearsExperience: 12, availability: "Available now", dailyRate: 650, bio: "Practical environmental systems, spill prevention and legal compliance support.", verified: true, rating: 4.7, reviewCount: 15,
    }),
    record("market-engagement-iso", "marketplace", "ISO 45001 gap assessment — Falcon Fabrication", "Active", "Medium", "Falcon Fabrication", 18, {
      marketplaceType: "engagement", consultantId: "", consultantName: "Amina Okafor", client: "Falcon Fabrication Ltd", brief: "Complete a two-day ISO 45001 readiness review and prioritised action plan",
      budget: 1800, agreedRate: 675, milestone: "Evidence review completed", completionEvidence: "", clientRating: 0, consultantRating: 0, rating: 0, escrowStatus: "Held in test escrow",
    }),
    record("market-engagement-riddor", "marketplace", "Independent incident review — Northbridge Logistics", "Completed", "Low", "Northbridge Logistics", null, {
      marketplaceType: "engagement", consultantId: "", consultantName: "James Whitfield", client: "Northbridge Logistics", brief: "Independent review of vehicle-pedestrian collision and RIDDOR decision",
      budget: 2900, agreedRate: 725, milestone: "Final report and leadership briefing", completionEvidence: "Final report accepted 18 July; actions assigned", clientRating: 5, consultantRating: 4, rating: 5, escrowStatus: "Released",
    }),
    record("market-engagement-coshh", "marketplace", "COSHH register refresh — MetroFit Services", "Negotiating", "Medium", "MetroFit Services", 5, {
      marketplaceType: "engagement", consultantId: "", consultantName: "Priya Shah", client: "MetroFit Services", brief: "Review 42 substances, rationalise controls and identify health-surveillance requirements",
      budget: 2400, agreedRate: 650, milestone: "Scope and site dates under discussion", completionEvidence: "", clientRating: 0, consultantRating: 0, rating: 0, escrowStatus: "Not funded",
    }),
    record("market-post-seminar", "marketplace", "Seminar: practical ISO 45001 evidence", "Published", "Low", "Amina Okafor", null, {
      marketplaceType: "post", author: "Amina Okafor", postType: "Article", headline: "What auditors expect from operational-control evidence", topic: "ISO 45001",
      body: "A procedure alone is not evidence of control. Combine the controlled method, briefing record, inspection evidence and action close-out.", mediaUrl: "", reactions: 32, comments: [],
    }),
  ];

  const action = (recordSimulationId: string, description: string, owner: string, dueOffset: number | null, status: SimulationActionSeed["status"], priority: SimulationActionSeed["priority"]): SimulationActionSeed => ({
    recordSimulationId, description, owner, dueDate: dueOffset == null ? null : day(dueOffset), status, priority,
  });
  const actions: SimulationActionSeed[] = [
    action("incident-riddor", "Commission and install interlocked dock-edge gates", "Tom Bennett", 10, "In progress", "Critical"),
    action("incident-riddor", "Brief revised unloading standard to all warehouse shifts", "Grace Mensah", 4, "Open", "High"),
    action("incident-nearmiss", "Observe and verify radio protocol on five lifting operations", "Amina Okafor", -2, "Open", "High"),
    action("inspection-fire", "Complete overdue emergency-lighting function test", "Michael Reed", -4, "Open", "High"),
    action("training-telehandler", "Complete CPCS renewal assessment", "Liam Brooks", 12, "In progress", "Medium"),
    action("training-asbestos", "Book UKATA refresher for design team", "Louise Carter", -5, "Open", "High"),
    action("legal-coshh-gap", "Define health-surveillance groups and competent provider", "Priya Shah", 14, "Open", "High"),
    action("iso-ncr", "Block contractor access until insurance evidence is current", "Nadia Hussain", 0, "In progress", "Critical"),
    action("contractor-electrical", "Verify renewed public-liability insurance", "Nadia Hussain", 3, "Open", "High"),
    action("change-radio", "Complete post-implementation effectiveness sample", "Amina Okafor", -1, "Closed", "Low"),
  ];
  return { records, actions };
}
