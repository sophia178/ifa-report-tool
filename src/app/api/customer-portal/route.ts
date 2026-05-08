import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    if (!user) {
      return NextResponse.redirect(new URL("/login", appUrl));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      // If no customer ID, they probably haven't subscribed yet
      return NextResponse.redirect(new URL("/pricing", appUrl));
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Portal error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/dashboard/settings?error=portal", appUrl));
  }
}
