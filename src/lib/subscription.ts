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
