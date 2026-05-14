import { NextResponse } from "next/server";

/**
 * Health Check API
 * Verifies that all required environment variables are present.
 * Does not expose the actual keys, only their presence.
 */

export async function GET() {
  return NextResponse.json({
    anthropicKey: !!process.env.ANTHROPIC_API_KEY,
    finnhubKey: !!process.env.FINNHUB_API_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    stripeKey: !!process.env.STRIPE_SECRET_KEY,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
