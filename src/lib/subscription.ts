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
    .select("stripe_price_id, subscribed")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const priceId = data.stripe_price_id;

  console.log('DEBUG: Plan check for user', userId);
  console.log('DEBUG: User stripe_price_id from DB:', priceId);
  console.log('DEBUG: User subscribed from DB:', data.subscribed);
  console.log('DEBUG: STRIPE_PRO_PRICE_ID env:', process.env.STRIPE_PRO_PRICE_ID);
  console.log('DEBUG: NEXT_PUBLIC_STRIPE_PRO_PRICE_ID env:', process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID);
  console.log('DEBUG: STRIPE_PLUS_PRICE_ID env:', process.env.STRIPE_PLUS_PRICE_ID);
  console.log('DEBUG: NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID env:', process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID);
  console.log('DEBUG: STRIPE_PRICE_ID env:', process.env.STRIPE_PRICE_ID);
  console.log('DEBUG: NEXT_PUBLIC_STRIPE_PRICE_ID env:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);

  // Pro Checks
  if (
    priceId === process.env.STRIPE_PRO_PRICE_ID || 
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
  ) {
    console.log('DEBUG: Resolved to PRO');
    return "pro";
  }

  // Plus Checks
  if (
    priceId === process.env.STRIPE_PLUS_PRICE_ID || 
    priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID
  ) {
    console.log('DEBUG: Resolved to PLUS');
    return "plus";
  }

  // Starter Checks
  if (
    priceId === process.env.STRIPE_PRICE_ID || 
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  ) {
    console.log('DEBUG: Resolved to STARTER via ID match');
    return "starter";
  }

  // Fallback for subscribed users
  if (data.subscribed) {
    console.log('DEBUG: Resolved to STARTER via subscribed fallback');
    return "starter";
  }

  console.log('DEBUG: Resolved to NULL (No match and not subscribed)');
  return null;
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
