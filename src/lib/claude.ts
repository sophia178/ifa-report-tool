import Anthropic from "@anthropic-ai/sdk";

import type { GenerateReportInput } from "@/lib/report-schema";

const SYSTEM_PROMPT = `Write an FCA-style suitability report as plain structured text.
Use exactly these section headers:
SECTION 1 - CLIENT DETAILS:
SECTION 2 - FINANCIAL SITUATION:
SECTION 3 - ATTITUDE TO RISK:
SECTION 4 - CAPACITY FOR LOSS:
SECTION 5 - RECOMMENDED PRODUCTS AND JUSTIFICATION:
SECTION 6 - CHARGES DISCLOSURE:
SECTION 7 - RISKS AND WARNINGS:
SECTION 8 - NEXT STEPS AND REVIEW DATE:
Write in a formal, professional UK financial adviser tone.
Be concise in each section. Keep each paragraph to 3-4 sentences maximum. Prioritise completing all 8 sections over detail in any single section.
Do not return JSON.
Do not return markdown code fences.
Do not omit any section.
If information is missing, insert a placeholder in square brackets like [CLIENT AGE NOT PROVIDED] rather than guessing.`;

function extractTextResponse(
  content: Anthropic.Messages.Message["content"],
): string {
  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

export async function generateSuitabilityReport(
  input: GenerateReportInput,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const meetingContext =
    input.sourceType === "audio" ? input.transcript : input.meetingNotes;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate an FCA-compliant suitability report as plain text using the required section headers.

Known client facts:
- Client name: ${input.clientName}
- Client email: ${input.clientEmail}
- Date of birth: ${input.dateOfBirth || "Not provided"}
- Adviser name: ${input.adviserName}
- Adviser firm: ${input.adviserFirm}
- Meeting date: ${input.meetingDate}
- Stated objectives: ${input.objectives}
- Input type: ${input.sourceType}

Meeting evidence:
${meetingContext}

Requirements:
- Follow the FCA report structure in the system prompt exactly.
- Return plain text only with the exact section headers from the system prompt.
- Keep the content concise, complete, and readable.
- Use short paragraphs only.
- Never return JSON.
- Never return markdown code fences.
- If information is missing, use square-bracket placeholders rather than guessing.
- Make sure SECTION 8 includes the agreed next review date in YYYY-MM-DD format.
- Return plain text only.`,
      },
    ],
  });

  return extractTextResponse(response.content).trim();
}
