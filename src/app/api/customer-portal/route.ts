import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/utils";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to manage your subscription." },
        { status: 401 },
      );
    }

    const stripe = getStripe();
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.redirect(
        `${getBaseUrl()}/pricing?message=${encodeURIComponent(
          "You need an active subscription to manage billing.",
        )}`,
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${getBaseUrl()}/dashboard`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Stripe customer portal session creation failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create Stripe customer portal session.";

    return NextResponse.json(
      { error: `Stripe customer portal session creation failed. ${message}` },
      { status: 500 },
    );
  }
}
