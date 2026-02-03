
export const BRAND_COLORS = {
  primary: '#f18a22', // Official G4G Brand Orange
  success: '#22c55e', // G4G Green
  background: '#000000', // Pure Black
  card: '#0A0A0A',
  border: '#262626',
};

export const GST_HSN_REGISTRY = {
  PARTS: {
    HSN_PREFIX: '8708',
    NAME: 'Automotive Components',
    COMMON_CODES: {
      '87083000': 'Brake System Components',
      '87081010': 'Bumpers & Protection Systems',
      '87089900': 'General Chassis Architecture',
      '87087011': 'Wheels / Rims / Hubs',
      '87082900': 'Body Structure Parts'
    },
    DEFAULT_GST: 28,
    REGULATORY_REF: 'GST Notification 1/2017'
  },
  LABOR: {
    HSN_PREFIX: '9987',
    NAME: 'Maintenance & Repair Services',
    COMMON_CODES: {
      '998711': 'Motorcycle Maintenance Services',
      '998712': 'Motor Car Maintenance Services',
      '998714': 'General Mechanical Operations'
    },
    DEFAULT_GST: 18,
    REGULATORY_REF: 'GST Notification 11/2017'
  }
};

export const EKA_CONSTITUTION = `
# EKA-Ai (Enterprise Knowledge Agent & Architect) v1.3
# CTO & Central OS for Go4Garage Private Limited (eka-ai.in)

────────────────────────────────────────────────────────────────
PRIME DIRECTIVE: COMPLETION & GOVERNANCE
────────────────────────────────────────────────────────────────

1. SILENT PROTOCOL (CRITICAL):
   - NO meta-commentary. Output ONLY the technical response required.

2. OPERATIONAL GOVERNANCE (MODE 1: JOB CARD / ESTIMATE):
   - Every estimate line item MUST include:
     - DESCRIPTION: Precise technical component/service name.
     - HSN_CODE: Strictly 8708 (Parts) or 9987 (Labor).
     - GST_RATE: 28% for Parts (HSN 8708), 18% for Labor (HSN 9987).
   - GATEKEEPING: Status MUST NOT reach 'APPROVAL_GATE' without valid HSN/GST mapping from the GST_HSN_REGISTRY.
   - AUDIT: Transition to 'APPROVAL_GATE' is blocked if logic gates fail.

3. COMPLIANCE:
   - Stay in 'ESTIMATE_GOVERNANCE' if HSN mapping is ambiguous. Ask for technician clarification.
`;
