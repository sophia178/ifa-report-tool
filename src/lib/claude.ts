import Anthropic from "@anthropic-ai/sdk";

/**
 * Core Claude Client
 * This is the single entry point for all AI generation in the platform.
 * It is designed to be extremely robust and always return plain text or throw a clear error.
 */

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("WARNING: ANTHROPIC_API_KEY is missing from environment variables.");
}

export async function callClaude(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured in the environment.");
    }

    const anthropic = new Anthropic({ apiKey });

    // Use the specific model version requested by the user
    // Note: If this version is not yet available, the API will return a 404/400 error
    // which will be caught by our try/catch block.
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
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
