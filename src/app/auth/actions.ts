"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // 1. Check for jurisdiction and subscription server-side after login
  const { data: profile } = await supabase
    .from("profiles")
    .select("jurisdiction, subscribed")
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .single();

  revalidatePath("/", "layout");

  if (!profile?.jurisdiction) {
    redirect("/onboarding");
  }

  if (!profile?.subscribed) {
    redirect("/pricing?message=subscribe");
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const termsAccepted = formData.get("termsAccepted");

  if (termsAccepted !== "on") {
    redirect(
      "/signup?error=" +
        encodeURIComponent(
          "You must agree to the Terms of Use to create an account.",
        ),
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered") || error.status === 422) {
      redirect(
        `/signup?error=${encodeURIComponent("This email is already registered. Please log in instead.")}`,
      );
    }
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Attempt to manually create a profile if the trigger fails or hasn't run yet.
  // Wrapped in try/catch so it never blocks the user's signup flow.
  let hasJurisdiction = false;
  if (data.user) {
    try {
      // Check if user already exists and has a jurisdiction
      const { data: profile } = await supabase
        .from("profiles")
        .select("jurisdiction")
        .eq("id", data.user.id)
        .single();
      
      if (profile?.jurisdiction) {
        hasJurisdiction = true;
      } else {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          subscribed: false,
        });
      }
    } catch (e) {
      console.error("Silent profile handling error:", e);
      // We continue silently as requested
    }
  }

  revalidatePath("/", "layout");
  if (hasJurisdiction) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding");
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
