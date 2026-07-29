import type { ModuleKey } from "./modules";

export type LocalAssistantResult = {
  mode: "local-simulation";
  title: string;
  explanation: string;
  questions: string[];
  patch: Record<string, unknown>;
  disclaimer: string;
};

const disclaimer = "Local simulated assistance only. Review, edit and approve the output with a competent UK HSE professional before use.";
const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

export function runLocalAssistant(module: ModuleKey, title: string, payload: Record<string, unknown>): LocalAssistantResult {
  const context = `${title} ${Object.values(payload).filter((value) => typeof value === "string").join(" ")}`.toLowerCase();

  if (module === "rams") {
    const isHeight = includesAny(context, ["height", "scaffold", "roof", "ladder", "meewp"]);
    const isPlant = includesAny(context, ["excavat", "forklift", "telehandler", "plant", "vehicle"]);
    const isElectrical = includesAny(context, ["electrical", "cable", "isolation", "energ"]);
    const isChemical = includesAny(context, ["chemical", "resin", "paint", "solvent", "coshh"]);
    const hazards = [
      ...(isHeight ? ["Falls from height", "Falling materials", "Incomplete or unstable access"] : []),
      ...(isPlant ? ["Plant–pedestrian interface", "Crushing or overturning", "Unexpected movement"] : []),
      ...(isElectrical ? ["Contact with live conductors", "Unexpected energisation", "Arc flash or fire"] : []),
      ...(isChemical ? ["Skin or eye contact", "Inhalation exposure", "Spill or incompatible storage"] : []),
      "Unauthorised access to the work area",
      "Poor coordination or change from the agreed method",
    ];
    const controls = [
      ...(isHeight ? ["Prioritise collective edge protection", "Use inspected access equipment", "Maintain an exclusion zone below"] : []),
      ...(isPlant ? ["Segregate vehicles and pedestrians", "Use a trained banksman", "Complete recorded pre-use checks"] : []),
      ...(isElectrical ? ["Prove dead before work", "Lock and tag every isolation point", "Use an authorised competent person"] : []),
      ...(isChemical ? ["Confirm current SDS and COSHH assessment", "Provide ventilation and specified PPE/RPE", "Keep spill response materials at point of use"] : []),
      "Brief the approved RAMS and record workforce acknowledgement",
      "Stop work and reassess if conditions or scope change",
    ];
    return {
      mode: "local-simulation",
      title: "Local RAMS drafting suggestions",
      explanation: "Task keywords were mapped to a deterministic UK control library. The suggestions have been placed into editable fields.",
      questions: ["Who is the competent supervisor?", "What emergency or rescue arrangement is required?", "Which people could be affected besides the work team?", "What evidence will confirm the controls were implemented?"],
      patch: {
        assessmentType: payload.assessmentType || (isChemical ? "COSHH Assessment" : "RAMS / Method Statement"),
        version: payload.version || 1,
        materials: payload.materials || (isChemical ? "List substances, quantities, storage and waste route." : "List materials, components and consumables."),
        equipment: payload.equipment || "List plant, tools, access equipment and inspection requirements.",
        environment: payload.environment || "Describe access, adjacent activities, weather, lighting, noise and public interface.",
        peopleCompetence: payload.peopleCompetence || "Name the supervisor and required training, certification and authorisation.",
        systemSteps: payload.systemSteps || "Set up exclusion → verify controls → complete work in sequence → inspect → hand over → close out.",
        hazards: payload.hazards || hazards.join("\n"),
        controls: payload.controls || controls.map((control, index) => `${index + 1}. ${control}`).join("\n"),
        likelihood: payload.likelihood || 4,
        consequence: payload.consequence || (isHeight || isElectrical ? 5 : 4),
        residualLikelihood: payload.residualLikelihood || 1,
        residualConsequence: payload.residualConsequence || (isHeight || isElectrical ? 5 : 3),
        legalRequirements: payload.legalRequirements || [
          "Health and Safety at Work etc. Act 1974",
          "Management of Health and Safety at Work Regulations 1999",
          ...(isHeight ? ["Work at Height Regulations 2005"] : []),
          ...(isPlant ? ["PUWER 1998 and, where lifting applies, LOLER 1998"] : []),
          ...(isChemical ? ["COSHH Regulations 2002"] : []),
          ...(isElectrical ? ["Electricity at Work Regulations 1989"] : []),
        ].join("\n"),
        assistantGenerated: true,
      },
      disclaimer,
    };
  }

  if (module === "incidents") {
    const questions = [
      ...(!payload.occurredAt ? ["What was the exact date and time?"] : []),
      ...(!payload.location ? ["What was the precise location and work area?"] : []),
      ...(!payload.witnesses ? ["Who witnessed the event and have statements been secured?"] : []),
      ...(!payload.linkedRiskAssessment ? ["Was a relevant RAMS/risk assessment available, briefed and followed?"] : []),
      ...(!payload.supervisorStatement ? ["What does the process supervisor say about the normal system of work?"] : []),
      ...(!payload.immediateAction ? ["What immediate action made the situation safe?"] : []),
      "What changed immediately before the event?",
      "Which control should have prevented the event, and why did it fail?",
    ];
    const description = String(payload.description || title);
    return {
      mode: "local-simulation",
      title: "Local incident investigation prompts",
      explanation: "The assistant checked the record for commonly missing UK investigation facts and prepared editable RCA prompts.",
      questions,
      patch: {
        investigationPrompts: questions.map((question, index) => `${index + 1}. ${question}`).join("\n"),
        fishbone: payload.fishbone || "People: competence, communication, supervision\nPlant: condition, guarding, suitability\nProcess: planning, RAMS, permit, change control\nPlace: access, environment, layout, external conditions",
        lessonLearnt: payload.lessonLearnt || `What happened: ${description}\nWhy it happened: Confirm through evidence and 5 Whys.\nWhat we learned: Identify the failed or missing critical control.\nWhat we changed: Record the completed corrective and preventive actions.`,
        assistantGenerated: true,
      },
      disclaimer,
    };
  }

  if (module === "iso") {
    const evidenceTerms = ["evidence", "record", "audit", "inspection", "review", "approved", "verified"];
    const gapTerms = ["missing", "inconsistent", "not", "gap", "overdue", "partial"];
    const evidenceStrength = evidenceTerms.filter((term) => context.includes(term)).length;
    const gapStrength = gapTerms.filter((term) => context.includes(term)).length;
    const suggestedScore = Math.max(20, Math.min(95, 55 + evidenceStrength * 8 - gapStrength * 10));
    const clause = String(payload.clause || "selected clause");
    return {
      mode: "local-simulation",
      title: "Local ISO gap-analysis suggestions",
      explanation: "The assessment text was scored using transparent evidence/gap indicators; it is not an accredited audit score.",
      questions: ["Is the control documented?", "Is it consistently implemented?", "What objective evidence proves effectiveness?", "Who owns the gap and by when?", "How will effectiveness be verified?"],
      patch: {
        score: payload.score || suggestedScore,
        gap: payload.gap || `Confirm whether implementation and objective evidence for ${clause} are consistent across the organisation.`,
        action: payload.action || "Assign an owner, due date and evidence-based effectiveness review for each identified gap.",
        assistantRationale: `Indicative local score ${suggestedScore}/100 based on ${evidenceStrength} evidence signals and ${gapStrength} gap signals in the assessment text.`,
        assistantGenerated: true,
      },
      disclaimer,
    };
  }

  if (module === "training") {
    const role = String(payload.jobRole || title || "General worker");
    const roleText = role.toLowerCase();
    const courses = includesAny(roleText, ["scaffold", "height", "roofer"])
      ? ["Working at Height", "Harness inspection and rescue", "Trade competence card", "RAMS briefing", "Manual handling"]
      : includesAny(roleText, ["plant", "forklift", "driver", "operator"])
        ? ["Plant/operator competence", "Daily pre-use checks", "Workplace transport", "Banksman interface", "Emergency arrangements"]
        : includesAny(roleText, ["manager", "supervisor", "director"])
          ? ["HSE leadership responsibilities", "Incident investigation", "RAMS review", "Contractor control", "ISO 45001 awareness"]
          : includesAny(roleText, ["fire marshal", "first aid", "emergency"])
            ? ["Role-specific emergency training", "Evacuation and muster", "Communication and vulnerable-person assistance", "Drill participation"]
            : ["Company HSE induction", "Role-specific RAMS", "Manual handling", "Incident and near-miss reporting", "Emergency arrangements"];
    return {
      mode: "local-simulation",
      title: "Local training-matrix suggestions",
      explanation: "The job-role wording was mapped to a deterministic UK competence template.",
      questions: ["Which legal or client requirements apply?", "What practical competence must be observed?", "What refresher frequency is proportionate?", "Who is authorised to verify competence?"],
      patch: {
        trainingType: payload.trainingType || "Training Matrix Requirement",
        jobRole: payload.jobRole || role,
        course: payload.course || courses[0],
        learner: payload.learner || `All personnel assigned as ${role}`,
        recommendedMatrix: courses.map((course, index) => `${index + 1}. ${course}`).join("\n"),
        assistantGenerated: true,
      },
      disclaimer,
    };
  }

  return {
    mode: "local-simulation",
    title: "Local assistance unavailable",
    explanation: "This local assistant currently supports RAMS, Incidents, ISO and Training.",
    questions: [],
    patch: {},
    disclaimer,
  };
}
