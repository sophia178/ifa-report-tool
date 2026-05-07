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

  revalidatePath("/", "layout");
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
  if (data.user) {
    try {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        subscribed: false,
      });
    } catch (e) {
      console.error("Silent profile creation error:", e);
      // We continue silently as requested
    }
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
