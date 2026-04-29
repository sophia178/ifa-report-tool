import { z } from "zod";

export const generateReportInputSchema = z.object({
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  dateOfBirth: z.string().optional().or(z.literal("")),
  adviserName: z.string().min(2),
  adviserFirm: z.string().min(2),
  platformName: z.string().optional().or(z.literal("")),
  fundName: z.string().optional().or(z.literal("")),
  fundSrriRiskRating: z.string().optional().or(z.literal("")),
  fundIsinNumber: z.string().optional().or(z.literal("")),
  meetingDate: z.string().min(1),
  objectives: z.string().min(3),
  sourceType: z.enum(["notes", "audio"]),
  meetingNotes: z.string().optional(),
  transcript: z.string().optional(),
  audioPath: z.string().nullable().optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;
