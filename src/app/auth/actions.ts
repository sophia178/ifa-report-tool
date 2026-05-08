"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* 
  NOTE: login, signup, and logout are now handled client-side in their 
  respective page components or dedicated logout components to avoid 
  Next.js server-side redirect issues (Error 3828832599).
*/

export async function revalidateLayout() {
  revalidatePath("/", "layout");
}
