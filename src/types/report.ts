export type SourceType = "notes" | "audio";

export type RiskAssessment = {
  summary: string;
  riskLevel: string;
  rationale: string[];
};

export type CapacityForLossAssessment = {
  summary: string;
  capacityLevel: string;
  rationale: string[];
};

export type RecommendedProduct = {
  name: string;
  type: string;
  justification: string;
  keyRisks: string[];
};

export type SuitabilityReport = {
  clientDetails: {
    fullName: string;
    email: string;
    dateOfBirth?: string;
    adviserFirm: string;
    adviserName: string;
    meetingDate: string;
    objectives: string[];
  };
  attitudeToRisk: RiskAssessment;
  capacityForLoss: CapacityForLossAssessment;
  recommendedProducts: RecommendedProduct[];
  chargesDisclosure: {
    initialCharges: string;
    ongoingCharges: string;
    productCharges: string;
    platformCharges: string;
  };
  suitabilitySummary: string;
  nextReviewDate: string;
  complianceNotes: string[];
};

export type StoredReportRecord = {
  id: string;
  client_name: string;
  client_email: string;
  source_type: SourceType;
  meeting_date: string;
  next_review_date: string;
  created_at: string;
  audio_path: string | null;
  meeting_notes: string | null;
  transcript: string | null;
  report_json: SuitabilityReport;
};
