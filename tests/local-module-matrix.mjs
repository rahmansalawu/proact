import assert from "node:assert/strict";

const base = process.env.PROACT_BASE_URL ?? "http://localhost:3000";
const api = `${base}/api/state`;
const headers = { "content-type": "application/json", origin: base };
const createdIds = [];

async function request(method, body) {
  const response = await fetch(api, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

const cases = [
  ["rams", "Approved", {
    assessmentType: "RAMS / Method Statement", version: 1, taskDescription: "Local integrated test", location: "Test site",
    materials: "Test materials", equipment: "Test equipment", environment: "Controlled area", peopleCompetence: "Competent tester",
    systemSteps: "Isolate, inspect, complete", hazards: "Stored energy", controls: "Isolation and verification",
    likelihood: 4, consequence: 5, residualLikelihood: 1, residualConsequence: 2, approvedBy: "Local Approver",
    reviewDate: "2026-12-01", workforceAcknowledgement: "Test team briefed",
  }],
  ["incidents", "Closed", {
    eventType: "Near miss", location: "Test site", occurredAt: "2026-07-28T10:00", severity: "Low", daysAwayFromWork: 0,
    description: "Temporary local integration test", immediateAction: "Area made safe", riddor: "Not reportable",
    rootCause: "Control not followed", investigationSummary: "Test investigation complete", correctiveActions: "Control reinforced",
    lessonLearnt: "Verify controls before work starts", witnesses: "Test witness", linkedRiskAssessment: "LOCAL-RAMS",
  }],
  ["inspections", "Completed", {
    inspectionType: "Site inspection", location: "Test site", scheduleFrequency: "Monthly", inspector: "Local Inspector",
    checklist: "Access; guarding; housekeeping", findings: "Minor housekeeping gap", score: 95,
    correctiveActions: "Housekeeping restored", completedAt: "2026-07-28",
  }],
  ["training", "Verified", {
    trainingType: "Competence Verification", jobRole: "Tester", course: "Local competence", learner: "Local Learner",
    issueDate: "2026-07-28", expiryDate: "2026-08-15", assessmentScore: 90,
    verification: "Practical competence observed", verifiedBy: "Local Manager",
  }],
  ["legal", "Compliant", {
    regulation: "Local test regulation", summary: "Temporary test duty", applicability: "Local integration test",
    evidence: "Test evidence", sourceUrl: "https://www.legislation.gov.uk/", reviewDate: "2026-12-01",
  }],
  ["iso", "Conforming", {
    framework: "ISO 45001 Gap Analysis", clause: "Test clause", assessment: "Control tested", score: 82,
    gap: "Minor opportunity", action: "Review at next meeting", evidence: "Local test evidence",
  }],
  ["documents", "Published", {
    documentType: "SOP", version: "1.0", content: "Temporary local SOP", revisionSummary: "Initial controlled issue",
    effectiveDate: "2026-07-28", reviewer: "Local Reviewer", reviewDate: "2027-07-28",
  }],
  ["emergency", "Closed", {
    responseType: "Evacuation / Drill", eventType: "Fire drill", musterPoint: "Assembly A", expected: 10,
    accountedFor: 9, exempt: 1, startedAt: "2026-07-28T10:00", allClearAt: "2026-07-28T10:07",
    observations: "Headcount reconciled",
  }],
  ["contractors", "Approved", {
    company: "Local Test Contractor", contact: "Local Contact", scope: "Temporary test work",
    competenceEvidence: "Insurance and competence reviewed", insuranceExpiry: "2027-01-01",
    orientation: "Completed", ramsStatus: "Approved", permitStatus: "Not required", orientationResult: "Passed",
  }],
  ["change", "Verified", {
    changeType: "Process", reason: "Local integration test", affectedSystems: "RAMS and training",
    impact: "Low controlled impact", controls: "Brief affected people", consultation: "Local team consulted",
    approver: "Local Approver", implementationDate: "2026-07-28", verification: "Controls effective",
  }],
  ["community", "Published", {
    contentType: "Lesson learned", body: "Temporary connected lesson", topic: "Local testing",
    sourceRecord: "LOCAL-INCIDENT", mediaUrl: "", reactions: 0, comments: [],
  }],
  ["marketplace", "Profile active", {
    marketplaceType: "consultant", ownerEmail: "local.matrix@proact.test", displayName: "Local Matrix Consultant",
    headline: "UK HSE test profile", location: "Leeds", jurisdictions: ["UK"], specialisms: ["ISO 45001"],
    qualifications: ["NEBOSH Diploma"], memberships: ["CMIOSH"], yearsExperience: 10, availability: "Available now",
    dailyRate: 500, verified: false, rating: 0, reviewCount: 0,
  }],
];

try {
  for (const [module, status, payload] of cases) {
    const result = await request("POST", {
      module, title: `LOCAL MATRIX ${module}`, status, priority: "Low", owner: "Local Matrix Tester", dueDate: null, payload,
    });
    createdIds.push(result.record.id);
    assert.equal(result.record.module, module);
  }

  const state = await request("GET");
  const local = state.records.filter((record) => createdIds.includes(record.id));
  assert.equal(local.length, cases.length);
  assert.equal(local.find((record) => record.module === "rams").payload.residualRiskRating, "Low");
  assert.equal(local.find((record) => record.module === "incidents").payload.riddorReportable, false);
  assert.equal(local.find((record) => record.module === "inspections").payload.complianceRag, "Green");
  assert.match(local.find((record) => record.module === "training").payload.expiryBand, /days|Current/);
  assert.equal(local.find((record) => record.module === "iso").payload.complianceRag, "Amber");
  assert.equal(local.find((record) => record.module === "emergency").payload.unaccounted, 0);
  assert.equal(local.find((record) => record.module === "emergency").payload.evacuationMinutes, 7);
  assert.equal(local.find((record) => record.module === "contractors").payload.approvalReady, true);
  console.log(`LOCAL_MODULE_MATRIX_OK modules=${local.length}`);
} finally {
  for (const id of createdIds.reverse()) await request("DELETE", { id });
  console.log(`LOCAL_MODULE_MATRIX_CLEANUP removed=${createdIds.length}`);
}
