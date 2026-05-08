import { z } from "zod";

export const generateReportInputSchema = z.object({
  // CLIENT DETAILS
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientAge: z.string().optional().or(z.literal("")),
  meetingDate: z.string().min(1),
  adviserName: z.string().min(2),

  // FINANCIAL PROFILE
  annualIncome: z.string().optional().or(z.literal("")),
  totalAssets: z.string().optional().or(z.literal("")),
  existingInvestments: z.string().optional().or(z.literal("")),
  outstandingDebts: z.string().optional().or(z.literal("")),
  propertyOwned: z.boolean().default(false),

  // RISK PROFILE
  riskScore: z.number().min(1).max(10).default(5),
  riskCategory: z.string().optional().or(z.literal("")),
  attitudeToLoss: z.string().optional().or(z.literal("")),

  // OBJECTIVES
  primaryObjective: z.string().optional().or(z.literal("")),
  timeHorizon: z.enum(["short", "medium", "long"]).default("medium"),
  specificGoals: z.string().optional().or(z.literal("")),

  // RECOMMENDATION
  recommendedProduct: z.string().optional().or(z.literal("")),
  initialAdviceCharge: z.string().optional().or(z.literal("")),
  ongoingAdviceCharge: z.string().optional().or(z.literal("")),
  productCharge: z.string().optional().or(z.literal("")),
  totalOngoingCharge: z.string().optional().or(z.literal("")),

  // SPECIAL CONSIDERATIONS
  isVulnerable: z.boolean().default(false),
  vulnerabilityDetails: z.string().optional().or(z.literal("")),
  isPensionTransfer: z.boolean().default(false),
  isIhtPlanning: z.boolean().default(false),
  consumerDutyNotes: z.string().optional().or(z.literal("")),

  // MEETING NOTES
  sourceType: z.enum(["notes", "audio"]),
  meetingNotes: z.string().optional(),
  transcript: z.string().optional(),
  audioPath: z.string().nullable().optional(),

  // LEGACY / SHARED
  adviserFirm: z.string().optional().or(z.literal("")),
  platformName: z.string().optional().or(z.literal("")),
  fundName: z.string().optional().or(z.literal("")),
  fundSrriRiskRating: z.string().optional().or(z.literal("")),
  fundIsinNumber: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  objectives: z.string().optional().or(z.literal("")),
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;
