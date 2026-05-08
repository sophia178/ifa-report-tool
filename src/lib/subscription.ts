import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function checkSubscription(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("subscribed")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return data?.subscribed === true;
}

export type PlanTier = "starter" | "plus" | "pro";

export async function getUserPlan(userId: string): Promise<PlanTier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_price_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.stripe_price_id) {
    return null;
  }

  const priceId = data.stripe_price_id;

  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) return "plus";
  if (priceId === process.env.STRIPE_PRICE_ID || priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID) return "starter";

  return "starter"; // Fallback
}

export async function updateUserPlan(userId: string, stripePriceId: string) {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ 
      subscribed: true,
      stripe_price_id: stripePriceId 
    })
    .eq("id", userId);
}
