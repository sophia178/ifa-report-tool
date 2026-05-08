import Anthropic from "@anthropic-ai/sdk";

import type { GenerateReportInput } from "@/lib/report-schema";

const REPORT_DISCLAIMER =
  "IMPORTANT DISCLAIMER: This report has been drafted by Suitance AI software as a working draft only. It must be reviewed, verified, and approved by a suitably qualified FCA-authorised financial adviser before being provided to any client. The generating software is not FCA regulated. The adviser firm and individual adviser named in this report are solely responsible for the suitability, accuracy and compliance of all advice given to clients. This draft does not constitute regulated financial advice.";

const SYSTEM_PROMPT = `You are a Chartered Financial Planner and senior paraplanner with 20 years experience writing FCA suitability reports for every type of UK financial advice case. You write under FCA Consumer Duty rules (July 2023). You produce reports that would pass any compliance audit and satisfy the Financial Ombudsman Service. You write in plain professional English personalised entirely to the specific client — never generic templated language. You always use the client's name. You write in full paragraphs only. You detect the complexity of each case from the meeting notes and scale your report accordingly — simple cases get focused 4–6 page reports, complex cases get comprehensive 12–20 page reports. You never truncate. You complete every section fully.

Write the report as plain structured text only. Do not return JSON. Do not return markdown code fences. Do not output your reasoning, complexity checklist, or analysis notes.

Before writing, assess the case complexity from the meeting evidence and identify which relevant advice areas apply. Always include these sections:
- SECTION 1 - COVER SUMMARY:
- SECTION 2 - CLIENT DETAILS AND OBJECTIVES:
- SECTION 3 - FINANCIAL SITUATION ANALYSIS:
- SECTION 4 - ATTITUDE TO RISK:
- SECTION 5 - CAPACITY FOR LOSS:
- SECTION 6 - RECOMMENDATION AND SUITABILITY JUSTIFICATION:
- SECTION 7 - CHARGES DISCLOSURE:
- SECTION 8 - RISKS AND WARNINGS:
- SECTION 9 - NEXT STEPS AND REVIEW DATE:

Include these additional sections only if relevant and evidenced by the meeting notes or client facts. Number them sequentially after the always-include sections:
- PENSION TRANSFER ANALYSIS section if any pension transfer, QROPS, SIPP, drawdown, or annuity is mentioned.
- INHERITANCE TAX AND ESTATE PLANNING section if IHT, estate, trust, gifting, or death benefits are mentioned.
- PROTECTION NEEDS ANALYSIS section if life insurance, critical illness, income protection, or family protection is mentioned.
- BUSINESS OWNER CONSIDERATIONS section if self-employed, limited company, director, or business sale is mentioned.
- EXISTING INVESTMENT REVIEW section if reviewing or switching existing investments.
- TAX PLANNING section if capital gains tax, income tax banding, salary sacrifice, or tax efficiency is mentioned.
- DIVORCE OR FAMILY CHANGE section if divorce, separation, or major family change is mentioned.
- VULNERABLE CLIENT CONSIDERATIONS section if any vulnerability, health issue, or reduced capacity is mentioned.

Write each section to this standard:

COVER SUMMARY:
Write a plain English paragraph summarising the client, the recommendation, and why it is suitable. This is written for the client to read first. Maximum 150 words.

CLIENT DETAILS AND OBJECTIVES:
Write a full introduction covering the client's age, family position, employment, income, and specific goals in the client's own words where possible. State explicitly what this report covers and what it does not cover. Minimum 2 paragraphs.

FINANCIAL SITUATION ANALYSIS:
Use exact figures from the notes wherever available. Cover current assets, income, expenditure, pensions, investments, property, protection, liabilities, and tax position. Assess the efficiency of current arrangements and identify gaps. For complex cases, include cashflow observations and retirement income projections if figures allow. Minimum 3 paragraphs.

ATTITUDE TO RISK:
Explain the client's specific responses and what led to the risk assessment. Explain what the risk score means in practice and confirm that the recommendation is consistent with it. For pension transfers, include specific transfer risk warnings. Minimum 2 paragraphs. Note to adviser: Please ensure a completed and signed attitude to risk questionnaire is retained on the client file. The FCA requires documentary evidence of the risk assessment process.

CAPACITY FOR LOSS:
Clearly distinguish capacity for loss from attitude to risk. Analyse the client's financial resilience using specific figures. State the maximum sustainable loss percentage with reasoning. For retirees or near-retirees, address sequencing risk explicitly. Minimum 2 paragraphs.

RECOMMENDATION AND SUITABILITY JUSTIFICATION:
For each recommendation, explain what it is, the specific reasons it was chosen for this client, the alternatives considered and rejected with reasons, why it is suitable against the client's risk profile and objectives, and how it meets all four Consumer Duty outcomes: products and services, price and value, consumer understanding, and consumer support. For every recommended investment fund, explicitly reference the fund's risk profile and confirm it matches the client's assessed attitude to risk. This is a specific FCA compliance requirement that checkers look for. If platform name, fund name, fund SRRI risk rating, and fund ISIN are provided, include them in the recommendation. If they are not provided, use [INFORMATION REQUIRED: Platform name], [INFORMATION REQUIRED: Fund name], [INFORMATION REQUIRED: Fund SRRI rating], and [INFORMATION REQUIRED: Fund ISIN]. For pension transfers, include transfer value analysis commentary, why transfer is in the client's best interests, and the relevant risk warnings. Minimum 4 paragraphs per recommendation. Note to adviser: A Key Information Document (KID) or Key Investor Information Document (KIID) for the recommended fund must be provided to the client alongside this suitability report in accordance with FCA requirements.

CHARGES DISCLOSURE:
State every charge as both a percentage and a cash amount. Include the total ongoing charge figure and annual cash cost on the full portfolio value. Confirm fair value under Consumer Duty with reasoning. For complex cases, compare total charges to alternatives considered. Always calculate and state the total ongoing charge figure as a combined percentage AND as an annual cash amount based on the total invested sum. Show the maths clearly. Minimum 2 paragraphs.

RISKS AND WARNINGS:
Write a personalised risk section referencing the client's specific circumstances for each risk. Include investment risk, inflation risk, sequencing risk if near retirement, liquidity risk, charges drag, tax legislative risk, and any product-specific risks. For pension transfers, include the risk of loss of guaranteed benefits, loss of death benefits, loss of employer contributions, and the irreversibility warning. Always include a sequencing risk paragraph for any client within 10 years of their target retirement date. Minimum 3 paragraphs.

PENSION TRANSFER ANALYSIS:
IMPORTANT FCA REQUIREMENT: The FCA requires firms to start from the assumption that a pension transfer is NOT suitable. Only recommend a transfer if the notes clearly demonstrate it is in the client's best interests. If recommending a transfer, explicitly state why the presumption against transfer has been overcome with reference to the client's specific circumstances.
At the start of any defined benefit or DB pension transfer section, include this prominently formatted warning box exactly as written:
--- IMPORTANT NOTICE ---
THIS SECTION CONTAINS PRELIMINARY DB TRANSFER ANALYSIS ONLY. A FULL APPROPRIATE PENSION TRANSFER ANALYSIS (APTA) MUST BE COMPLETED BEFORE ANY FINAL RECOMMENDATION CAN BE MADE ON THE DB TRANSFER. THE FCA REQUIRES FIRMS TO START FROM THE ASSUMPTION THAT A PENSION TRANSFER IS NOT SUITABLE.
If applicable, include full transfer value analysis, why transferring is in the client's best interests, what guaranteed benefits are being given up, a comparison of projected outcomes, transfer value adequacy assessment commentary, and FCA required warnings verbatim.

INHERITANCE TAX AND ESTATE PLANNING:
If applicable, include the current estate value, IHT exposure calculation, nil rate band and residence nil rate band position, recommended strategies and why they are suitable, seven year rule implications, and trust considerations where relevant.

PROTECTION NEEDS ANALYSIS:
If applicable, include the current protection position, protection gap analysis using income, mortgage, and family obligations, recommended cover with specific amounts and justification, and why any existing cover is insufficient or suitable.

NEXT STEPS AND REVIEW DATE:
Include all agreed actions with the responsible party and target date, the ongoing service proposition details, what the annual review will cover, confirmation that the client understood and agreed with the advice, and the next review date.

Complete every relevant section fully before finishing. Use the client's name throughout. Every figure mentioned in the notes must appear somewhere in the report. Every recommendation must be justified specifically for this client — never generic. If critical information is missing use [INFORMATION REQUIRED: description] placeholders so the adviser knows what to add. If platform name, fund name, fund SRRI risk rating, or fund ISIN are not provided, use [INFORMATION REQUIRED: Platform name], [INFORMATION REQUIRED: Fund name], [INFORMATION REQUIRED: Fund SRRI rating], and [INFORMATION REQUIRED: Fund ISIN] where relevant. Minimum 1,500 words for simple cases. Minimum 3,000 words for complex cases involving pension transfers, IHT, or multiple recommendations. Never truncate any section. After the final section, always append this exact text verbatim as the final paragraph of the report: "${REPORT_DISCLAIMER}"`;

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
  templateContent?: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey });
  const meetingContext =
    input.sourceType === "audio" ? input.transcript : input.meetingNotes;

  const templateInstruction = templateContent 
    ? `IMPORTANT: You must use the following custom report structure and boilerplate text for this report:
${templateContent}`
    : "";

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${templateInstruction ? templateInstruction + "\n\n" : ""}Generate a full FCA-compliant suitability report as plain text using numbered section headers in the format "SECTION X - TITLE:".

Known client facts:
- Client name: ${input.clientName}
- Client email: ${input.clientEmail}
- Client age: ${input.clientAge || "Not provided"}
- Meeting date: ${input.meetingDate}
- Adviser name: ${input.adviserName}

Financial Profile:
- Annual Income: ${input.annualIncome || "Not provided"}
- Total Assets: ${input.totalAssets || "Not provided"}
- Existing Investments: ${input.existingInvestments || "Not provided"}
- Outstanding Debts: ${input.outstandingDebts || "Not provided"}
- Property Owned: ${input.propertyOwned ? "Yes" : "No"}

Risk Profile:
- Risk Score: ${input.riskScore}/10
- Risk Category: ${input.riskCategory || "Not provided"}
- Attitude to Loss: ${input.attitudeToLoss || "Not provided"}

Objectives:
- Primary Objective: ${input.primaryObjective || "Not provided"}
- Time Horizon: ${input.timeHorizon}
- Specific Goals: ${input.specificGoals || "Not provided"}

Recommendation:
- Recommended Product/Strategy: ${input.recommendedProduct || "Not provided"}
- Initial Advice Charge: ${input.initialAdviceCharge || "Not provided"}
- Ongoing Advice Charge: ${input.ongoingAdviceCharge || "Not provided"}
- Product Charge: ${input.productCharge || "Not provided"}
- Total Ongoing Charge: ${input.totalOngoingCharge || "Not provided"}

Special Considerations:
- Vulnerable Client: ${input.isVulnerable ? "Yes" : "No"}
${input.isVulnerable ? `- Vulnerability Details: ${input.vulnerabilityDetails}` : ""}
- Pension Transfer Involved: ${input.isPensionTransfer ? "Yes" : "No"}
- IHT Planning Required: ${input.isIhtPlanning ? "Yes" : "No"}
- Consumer Duty Notes: ${input.consumerDutyNotes || "Not provided"}

Meeting evidence:
${meetingContext}

Requirements:
- Detect the case complexity from the meeting evidence and structured facts before writing.
- Always include the 9 core sections from the system prompt.
- Include additional relevant sections only when the facts support them.
- Number every section sequentially in the final output.
- Return plain text only using full paragraphs.
- Never return JSON.
- Never return markdown code fences.
- Use the client's name throughout the report.
- Make sure every figure from the facts and notes appears somewhere in the report.
- If information is missing, use [INFORMATION REQUIRED: description] placeholders rather than guessing.
- Scale the level of detail to the case complexity and never truncate any section.
- After the final section, append this exact disclaimer verbatim as the final paragraph: ${REPORT_DISCLAIMER}`,
      },
    ],
  });

  const report = extractTextResponse(response.content).trim();

  if (report.endsWith(REPORT_DISCLAIMER)) {
    return report;
  }

  return `${report}\n\n${REPORT_DISCLAIMER}`;
}

export async function summariseResearch(text: string): Promise<{
  summary: string;
  keyPoints: string[];
  risks: string;
  relevanceRating: number;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a specialist research analyst for UK financial advisers. 
Analyse the provided text and return a JSON object with:
- summary: A exactly 3-sentence plain English summary.
- keyPoints: Exactly 5 key bullet points as an array of strings.
- risks: Any risks or concerns flagged for advisers or clients.
- relevanceRating: A rating from 1 to 10 for how relevant this is to a UK financial adviser.

Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function generateRegulatoryUpdates(jurisdictions: string[]): Promise<any[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a global financial regulatory expert. 
Generate a summary of recent regulatory changes for the following jurisdictions: ${jurisdictions.join(", ")}.
Return ONLY a JSON array of objects, where each object has:
- title: Short update title
- description: Detailed summary
- impact: Impact level (High/Medium/Low)
- date: Date of change`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate updates" }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function generateMarketBriefing(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a market analyst. Generate a professional market briefing.",
    messages: [{ role: "user", content: "Generate briefing" }],
  });

  return extractTextResponse(response.content);
}

export async function checkCompliance(text: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a compliance officer. Analyse the text for compliance.",
    messages: [{ role: "user", content: text }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function draftClientEmail(context: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a professional financial adviser drafting an email.",
    messages: [{ role: "user", content: JSON.stringify(context) }],
  });

  return extractTextResponse(response.content);
}

export async function generateAustralianSOA(context: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 4096,
    system: "You are an Australian financial adviser. Generate a Statement of Advice (SOA).",
    messages: [{ role: "user", content: JSON.stringify(context) }],
  });

  return extractTextResponse(response.content);
}

export async function generateUSAPlan(context: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 4096,
    system: "You are a US financial planner. Generate a comprehensive financial plan.",
    messages: [{ role: "user", content: JSON.stringify(context) }],
  });

  return extractTextResponse(response.content);
}

export async function buildTradeStrategy(idea: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a quantitative trade strategist. Return ONLY a JSON object.",
    messages: [{ role: "user", content: idea }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function analysePortfolioRisk(context: any): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a risk management expert. Return ONLY a JSON object.",
    messages: [{ role: "user", content: JSON.stringify(context) }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function generateNewsBriefing(keywords: string[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a financial news editor. Generate a concise daily briefing based on the provided keywords.",
    messages: [{ role: "user", content: `Generate news for: ${keywords.join(", ")}` }],
  });

  return extractTextResponse(response.content);
}

export async function explainEconomicEvent(event: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    system: "You are an economist. Explain the event in plain English.",
    messages: [{ role: "user", content: event }],
  });

  return extractTextResponse(response.content);
}

export async function analyseTrades(trades: any[]): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    system: "You are a trade journal analyst. Return ONLY a JSON object.",
    messages: [{ role: "user", content: JSON.stringify(trades) }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}
