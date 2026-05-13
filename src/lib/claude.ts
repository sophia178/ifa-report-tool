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

export async function callClaude(prompt: string, maxTokens: number = 1500): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured in the environment.");
    }

    // Use the specific model version requested by the user or fallback to claude-sonnet-4-5
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
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
