import Anthropic from "@anthropic-ai/sdk";

import {
  reportSchema,
  type GenerateReportInput,
  type ValidatedSuitabilityReport,
} from "@/lib/report-schema";

const SYSTEM_PROMPT = `SECTION 1 — CLIENT DETAILS: Full name, date of meeting, adviser name, client date of birth, employment status, number of dependants
SECTION 2 — FINANCIAL SITUATION: Current income, current outgoings, assets held, existing investments, outstanding liabilities, emergency fund status
SECTION 3 — ATTITUDE TO RISK: Score the client 1–10 and explain in plain English what this means for their investments. Reference specific things the client said that support this score.
SECTION 4 — CAPACITY FOR LOSS: Clearly distinguish this from attitude to risk. State whether the client can financially withstand a short-term loss of 10%, 20%, or 30% of invested capital without affecting their standard of living.
SECTION 5 — RECOMMENDED PRODUCTS AND JUSTIFICATION: List each recommended product with the specific reason it was recommended for THIS client. Reference their personal circumstances directly. Include ISA allowance usage if relevant.
SECTION 6 — CHARGES DISCLOSURE: Adviser charge percentage, ongoing service charge, platform charge, product charges. Total ongoing cost as a percentage of invested amount.
SECTION 7 — RISKS AND WARNINGS: Key risks specific to the recommended products. Capital at risk warning. Past performance warning.
SECTION 8 — NEXT STEPS AND REVIEW DATE: Specific agreed actions with dates. Next annual review date.
The tone must be formal, professional, and written as if by a qualified UK financial adviser. Never use bullet points inside the report — write in full paragraphs only. If any information is missing from the meeting notes, insert a placeholder in square brackets like [CLIENT AGE NOT PROVIDED] rather than guessing.`;

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
): Promise<ValidatedSuitabilityReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const meetingContext =
    input.sourceType === "audio" ? input.transcript : input.meetingNotes;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate an FCA-compliant suitability report JSON with this schema:
{
  "clientDetails": {
    "fullName": "string",
    "email": "string",
    "dateOfBirth": "string",
    "adviserFirm": "string",
    "adviserName": "string",
    "meetingDate": "string",
    "objectives": ["string"]
  },
  "attitudeToRisk": {
    "summary": "string",
    "riskLevel": "string",
    "rationale": ["string"]
  },
  "capacityForLoss": {
    "summary": "string",
    "capacityLevel": "string",
    "rationale": ["string"]
  },
  "recommendedProducts": [
    {
      "name": "string",
      "type": "string",
      "justification": "string",
      "keyRisks": ["string"]
    }
  ],
  "chargesDisclosure": {
    "initialCharges": "string",
    "ongoingCharges": "string",
    "productCharges": "string",
    "platformCharges": "string"
  },
  "suitabilitySummary": "string",
  "nextReviewDate": "YYYY-MM-DD",
  "complianceNotes": ["string"]
}

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
- Return JSON only and keep every narrative field as full paragraphs in a formal UK financial adviser tone.
- Never use bullets or lists inside any narrative string.
- If information is missing, use square-bracket placeholders rather than guessing.
- Use the schema fields to capture the required sections:
  - Put core client facts in clientDetails and note missing personal facts in complianceNotes.
  - Use suitabilitySummary to summarise sections 2 and 8 in paragraph form.
  - Use attitudeToRisk.summary for the plain-English explanation, riskLevel for the 1-10 score, and rationale for paragraph-form evidence references.
  - Use capacityForLoss.summary and capacityLevel to distinguish financial resilience from attitude to risk, and explain 10%, 20%, and 30% loss tolerance in paragraph form.
  - Use recommendedProducts for section 5 and include product-specific risks in keyRisks.
  - Use chargesDisclosure for section 6 and complianceNotes for section 7 warnings and any missing-information placeholders.
- Return JSON only.`,
      },
    ],
  });

  const rawText = extractTextResponse(response.content).trim();
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  return reportSchema.parse(parsed);
}
