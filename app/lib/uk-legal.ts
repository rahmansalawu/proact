export type UkLegalStarter = {
  title: string;
  summary: string;
  applicability: string;
  sourceUrl: string;
};

// Curated starter register only. Applicability and compliance evidence must be
// reviewed by a competent person for the organisation's actual activities.
export const UK_LEGAL_STARTERS: UkLegalStarter[] = [
  {
    title: "Health and Safety at Work etc. Act 1974",
    summary: "Sets the core duties for employers, employees and those controlling work activities and premises.",
    applicability: "Baseline UK workplace health and safety legislation; confirm the duties relevant to the organisation and affected third parties.",
    sourceUrl: "https://www.legislation.gov.uk/ukpga/1974/37/contents",
  },
  {
    title: "Management of Health and Safety at Work Regulations 1999",
    summary: "Requires suitable and sufficient risk assessment, effective arrangements, competent assistance and cooperation.",
    applicability: "Applies to UK employers and supports the organisation's risk assessment, competence and management arrangements.",
    sourceUrl: "https://www.legislation.gov.uk/uksi/1999/3242/contents",
  },
  {
    title: "Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013",
    summary: "Requires responsible persons to report and retain records of specified work-related injuries, diseases and dangerous occurrences.",
    applicability: "Assess every relevant incident against current RIDDOR criteria; not every workplace accident is reportable.",
    sourceUrl: "https://www.hse.gov.uk/riddor/",
  },
  {
    title: "Control of Substances Hazardous to Health Regulations 2002",
    summary: "Requires assessment and control of exposure to substances hazardous to health, plus monitoring and health surveillance where required.",
    applicability: "Review where work creates, uses or may expose people to hazardous substances.",
    sourceUrl: "https://www.hse.gov.uk/coshh/",
  },
  {
    title: "Construction (Design and Management) Regulations 2015",
    summary: "Defines duties for clients, designers and contractors to plan, manage and monitor construction health and safety.",
    applicability: "Review for all construction projects and identify which CDM dutyholder roles the organisation performs.",
    sourceUrl: "https://www.hse.gov.uk/construction/cdm/2015/",
  },
  {
    title: "Provision and Use of Work Equipment Regulations 1998",
    summary: "Requires work equipment to be suitable, maintained, inspected where necessary and used by trained people.",
    applicability: "Review wherever employees or contractors use work equipment under the organisation's control.",
    sourceUrl: "https://www.hse.gov.uk/work-equipment-machinery/puwer.htm",
  },
  {
    title: "Personal Protective Equipment at Work Regulations 1992 and 2022 duties",
    summary: "Requires suitable PPE where risk remains after other controls, including assessment, provision, maintenance and instruction.",
    applicability: "Review where residual risks require PPE, including limb (b) workers covered by the 2022 extension.",
    sourceUrl: "https://www.hse.gov.uk/ppe/ppe-regulations-2022.htm",
  },
  {
    title: "Regulatory Reform (Fire Safety) Order 2005",
    summary: "Requires the responsible person to assess and manage fire risks in relevant non-domestic premises in England and Wales.",
    applicability: "Confirm premises, responsible-person duties and whether devolved fire-safety legislation applies elsewhere in the UK.",
    sourceUrl: "https://www.legislation.gov.uk/uksi/2005/1541/contents",
  },
];
