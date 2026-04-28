import { z } from "zod";

export const generateReportInputSchema = z.object({
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  dateOfBirth: z.string().optional().or(z.literal("")),
  adviserName: z.string().min(2),
  adviserFirm: z.string().min(2),
  meetingDate: z.string().min(1),
  objectives: z.string().min(3),
  sourceType: z.enum(["notes", "audio"]),
  meetingNotes: z.string().optional(),
  transcript: z.string().optional(),
  audioPath: z.string().nullable().optional(),
});

export const reportSchema = z.object({
  clientDetails: z.object({
    fullName: z.string(),
    email: z.string().email(),
    dateOfBirth: z.string().optional(),
    adviserFirm: z.string(),
    adviserName: z.string(),
    meetingDate: z.string(),
    objectives: z.array(z.string()).min(1),
  }),
  attitudeToRisk: z.object({
    summary: z.string(),
    riskLevel: z.string(),
    rationale: z.array(z.string()).min(1),
  }),
  capacityForLoss: z.object({
    summary: z.string(),
    capacityLevel: z.string(),
    rationale: z.array(z.string()).min(1),
  }),
  recommendedProducts: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        justification: z.string(),
        keyRisks: z.array(z.string()).min(1),
      }),
    )
    .min(1),
  chargesDisclosure: z.object({
    initialCharges: z.string(),
    ongoingCharges: z.string(),
    productCharges: z.string(),
    platformCharges: z.string(),
  }),
  suitabilitySummary: z.string(),
  nextReviewDate: z.string(),
  complianceNotes: z.array(z.string()).min(1),
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;
export type ValidatedSuitabilityReport = z.infer<typeof reportSchema>;
