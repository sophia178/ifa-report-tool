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

function getPromptValue(value: string | undefined, placeholder: string) {
  const normalized = value?.trim();
  return normalized ? normalized : placeholder;
}

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
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${templateInstruction ? templateInstruction + "\n\n" : ""}Generate a full FCA-compliant suitability report as plain text using numbered section headers in the format "SECTION X - TITLE:".

Known client facts:
- Client name: ${input.clientName}
- Client email: ${input.clientEmail}
- Date of birth: ${input.dateOfBirth || "Not provided"}
- Adviser name: ${input.adviserName}
- Adviser firm: ${input.adviserFirm}
- Platform name: ${getPromptValue(input.platformName, "[INFORMATION REQUIRED: Platform name]")}
- Fund name: ${getPromptValue(input.fundName, "[INFORMATION REQUIRED: Fund name]")}
- Fund SRRI rating: ${getPromptValue(input.fundSrriRiskRating, "[INFORMATION REQUIRED: Fund SRRI rating]")}
- Fund ISIN: ${getPromptValue(input.fundIsinNumber, "[INFORMATION REQUIRED: Fund ISIN]")}
- Meeting date: ${input.meetingDate}
- Stated objectives: ${input.objectives}
- Input type: ${input.sourceType}

Meeting evidence:
${meetingContext}

Requirements:
- Detect the case complexity from the meeting evidence before writing.
- Always include the 9 core sections from the system prompt.
- Include additional relevant sections only when the facts support them.
- Number every section sequentially in the final output.
- Return plain text only using full paragraphs.
- Never return JSON.
- Never return markdown code fences.
- Use the client's name throughout the report.
- Make sure every figure from the notes appears somewhere in the report.
- If information is missing, use [INFORMATION REQUIRED: description] placeholders rather than guessing.
- Make sure the NEXT STEPS AND REVIEW DATE section includes the agreed next review date in YYYY-MM-DD format where possible.
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
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
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
For each update, provide:
- regulationName: The name of the regulation.
- whatChanged: A concise description of the change.
- effectiveDate: When it takes effect.
- actionRequired: What action advisers should take.

Return a JSON array of objects.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate recent regulatory updates." }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function buildTradeStrategy(idea: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert quantitative trading strategist. 
Turn the following trading idea into a formal strategy: "${idea}"
Provide a JSON object with:
- strategyName: A professional name for the strategy.
- entryRules: Specific rules for entering a trade.
- exitRules: Specific rules for exiting a trade.
- risks: Key risks and failure modes.
- positionSizing: Suggested approach for sizing.
- invalidationConditions: Market conditions that invalidate the strategy.
- viabilityRating: A score out of 10.
- reasoning: Professional reasoning for the rating.

Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: idea }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function generateNewsBriefing(keywords: string[]): Promise<any[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a financial news editor. 
Generate a structured daily news briefing for these topics: ${keywords.join(", ")}.
For each topic, provide a JSON object with:
- topic: The keyword/asset name.
- developments: Latest key developments.
- implications: Market implications.
- adviserAdvice: What advisers should tell their clients.
- riskFlags: Any urgent risk flags.

Return a JSON array of objects.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate news briefing." }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function generateMarketBriefing(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a world-class financial market analyst writing for professional financial advisers. 
Generate a comprehensive daily market briefing in professional plain English.
The briefing must include:
- OVERNIGHT MARKET MOVES: Summary of US, Asian and European performance.
- KEY ECONOMIC EVENTS TODAY: What's happening on the economic calendar.
- WHAT TO WATCH THIS WEEK: Major upcoming data releases or central bank moves.
- SECTOR HIGHLIGHTS: Notable moves in specific sectors (e.g., Tech, Energy).
- KEY RISKS FOR ADVISERS: Exactly 3 specific risks advisers should be aware of today.

Format the briefing with clear section headers like "SECTION 1 - OVERNIGHT MARKET MOVES".
Do not use markdown code fences. Return only the briefing text.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate today's market briefing." }],
  });

  return extractTextResponse(response.content);
}

export async function explainEconomicEvent(event: {
  title: string;
  date: string;
  impact: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a professional financial market analyst. 
Provide a concise one-paragraph explanation of why the following economic event matters specifically for UK financial advisers and their clients.
Event: ${event.title}
Date: ${event.date}
Expected Impact: ${event.impact}

Focus on the implications for UK inflation, interest rates, portfolio returns, and client sentiment.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: `Explain why ${event.title} matters.` }],
  });

  return extractTextResponse(response.content);
}

export async function analysePortfolioRisk(holdings: any[]): Promise<{
  overallRiskScore: number;
  concentrationWarnings: string[];
  geographicExposure: { region: string; percentage: number }[];
  assetClassBreakdown: { class: string; percentage: number }[];
  correlationRisks: string;
  recommendations: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert portfolio risk manager. 
Analyse the provided portfolio holdings and return a detailed risk assessment.
Holdings: ${JSON.stringify(holdings)}

Return a JSON object with:
- overallRiskScore: A score from 1 to 10.
- concentrationWarnings: A list of specific concentration risks found.
- geographicExposure: An array of { region, percentage } objects.
- assetClassBreakdown: An array of { class, percentage } objects.
- correlationRisks: A concise explanation of potential correlation risks.
- recommendations: Exactly 3 specific, actionable recommendations to improve diversification.

Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: "Analyse my portfolio risk." }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function draftClientEmail(input: {
  clientName: string;
  purpose: string;
  keyPoints: string;
  tone: "formal" | "friendly" | "concise";
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a professional financial adviser writing to a client. 
Draft a complete, ready-to-send email based on the inputs provided.
The email should be professional, clear, and follow UK financial services best practices for communication.
Tone: ${input.tone}
Purpose: ${input.purpose}
Client Name: ${input.clientName}
Key Points: ${input.keyPoints}

Return ONLY the email body text, including a professional subject line at the top.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Draft an email for ${input.clientName} about ${input.purpose}. Include these points: ${input.keyPoints}`,
      },
    ],
  });

  return extractTextResponse(response.content);
}

export async function generateAustralianSOA(input: {
  clientName: string;
  meetingNotes: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a senior Australian financial planner and compliance expert. 
Generate a complete Australian Statement of Advice (SOA) compliant with ASIC RG 175.
The SOA must include:
- Client Profile
- Needs Analysis
- Strategic Recommendations
- Product Recommendations with Justification
- Fees and Costs Disclosure
- Risks
- Authority to Proceed

Use professional Australian English. Use the client name: ${input.clientName}.
Write the SOA as plain structured text with clear section headers like "SECTION 1 - CLIENT PROFILE".

Return ONLY the SOA text.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: input.meetingNotes }],
  });

  return extractTextResponse(response.content);
}

export async function checkCompliance(text: string): Promise<{
  score: number;
  issues: { issue: string; rule: string; fix: string }[];
  recommendation: "Pass" | "Fail";
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert UK financial services compliance officer. 
Analyse the provided text against:
- FCA Consumer Duty rules (July 2023)
- COBS 9 suitability requirements
- FCA communication standards (clear, fair, and not misleading)

Return a JSON object with:
- score: A compliance score out of 100.
- issues: An array of objects, each with:
  - issue: A specific compliance issue found.
  - rule: The relevant FCA rule or principle referenced (e.g., PRIN 2A, COBS 9.2.1R).
  - fix: A suggested fix to make the text compliant.
- recommendation: Either "Pass" or "Fail".

Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}

export async function generateUSAPlan(input: {
  clientName: string;
  meetingNotes: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are a senior US Certified Financial Planner (CFP). 
Generate a complete US Financial Plan compliant with CFP Board standards.
The plan must include:
- Client Profile
- Net Worth Statement
- Cash Flow Analysis
- Risk Tolerance Assessment
- Investment Policy Statement (IPS)
- Retirement Projections
- Tax Planning Considerations
- Form ADV-aligned Disclosure Summary

Use professional US English. Use the client name: ${input.clientName}.
Write the plan as plain structured text with clear section headers like "SECTION 1 - CLIENT PROFILE".

Return ONLY the financial plan text.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: input.meetingNotes }],
  });

  return extractTextResponse(response.content);
}

export async function analyseTrades(trades: any[]): Promise<{
  winRate: string;
  avgProfitLoss: string;
  bestAssets: string[];
  worstAssets: string[];
  patterns: string;
  recommendations: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert trading performance analyst. 
Analyse the provided trade log and identify performance patterns.
Trades provided: ${JSON.stringify(trades)}

Return a JSON object with:
- winRate: The percentage of profitable trades.
- avgProfitLoss: The average profit or loss per trade (as a string with currency).
- bestAssets: Top 2 performing assets.
- worstAssets: Bottom 2 performing assets.
- patterns: Identification of patterns in losing trades (e.g., size, time of day, rationale).
- recommendations: Exactly 3 specific, actionable recommendations to improve performance.

Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: "Analyse my trades" }],
  });

  const textResponse = extractTextResponse(response.content);
  return JSON.parse(textResponse);
}
