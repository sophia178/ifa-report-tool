import Anthropic from "@anthropic-ai/sdk";

/**
 * Core Claude Client
 * This is the single entry point for all AI generation in the platform.
 * It is designed to be extremely robust and always return plain text or throw a clear error.
 */

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("WARNING: ANTHROPIC_API_KEY is missing from environment variables.");
}

// Initialise the Anthropic client once at the module level for better performance
export const anthropic = new Anthropic({
  apiKey: apiKey || "dummy-key",
});

function shouldInjectReportDisclaimer(prompt: string) {
  const p = prompt.toLowerCase();
  const reportSignals = [
    "suitability report",
    "statement of advice",
    " soa",
    "\nsoa",
    "financial plan",
  ];
  const contextSignals = ["client", "adviser", "meeting notes", "paraplanner"];
  const hasReportSignal = reportSignals.some((s) => p.includes(s));
  const hasContextSignal = contextSignals.some((s) => p.includes(s));
  return hasReportSignal && hasContextSignal;
}

function shouldInjectCompletionInstruction(prompt: string) {
  return shouldInjectReportDisclaimer(prompt);
}

function getUserText(messages: any) {
  const list = Array.isArray(messages) ? messages : [];
  return list
    .filter((m) => m && m.role === "user")
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n");
}

const completionInstruction =
  "STRICT LIMIT: Maximum 100 words per section. Write in bullet points not paragraphs where possible. Be extremely concise throughout. You MUST complete ALL sections including the final DISCLAIMER within 8000 tokens total. The DISCLAIMER section is mandatory and must always be the last thing you write.";

const originalStream = (anthropic as any).messages.stream?.bind((anthropic as any).messages);
if (typeof originalStream === "function") {
  (anthropic as any).messages.stream = (params: any) => {
    const userText = getUserText(params?.messages);
    if (!userText || !shouldInjectCompletionInstruction(userText)) {
      return originalStream(params);
    }

    const patched = {
      ...params,
      messages: Array.isArray(params?.messages)
        ? params.messages.map((m: any, idx: number) => {
            if (idx === 0 && m?.role === "user" && typeof m?.content === "string") {
              return { ...m, content: `${completionInstruction}\n\n${m.content}` };
            }
            return m;
          })
        : params?.messages,
    };

    return originalStream(patched);
  };
}

export async function callClaude(prompt: string, maxTokens: number = 1500): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured in the environment.");
    }

    const disclaimerInstruction =
      "Begin every report with this disclaimer on its own line: DRAFT ONLY - FOR ADVISER REVIEW. This report has been AI-generated and must be reviewed by a qualified regulated adviser before use with any client.";

    const finalPrompt = shouldInjectReportDisclaimer(prompt)
      ? `${disclaimerInstruction}\n\n${prompt}`
      : prompt;

    // Use the specific model version requested by the user or fallback to claude-sonnet-4-5
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: finalPrompt,
        },
      ],
    });

    // Extract text content safely
    const content = response.content;
    const text = content
      .filter((item) => item.type === "text")
      .map((item) => (item as any).text)
      .join("\n");

    if (!text) {
      throw new Error("Claude returned an empty response.");
    }

    return text.trim();
  } catch (error) {
    console.error("Claude API error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during Claude generation.");
  }
}
