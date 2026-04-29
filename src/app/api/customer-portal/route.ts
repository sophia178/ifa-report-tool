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

    console.log("Stripe customer portal lookup email:", user.email);

    const stripe = getStripe();
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    console.log("Stripe customers found:", customers.data.length);
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json(
        { message: `No Stripe customer found for email: ${user.email}` },
        { status: 404 },
      );
    }

    console.log("Stripe customer found:", customer);

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${getBaseUrl()}/dashboard`,
      });

      return NextResponse.redirect(session.url);
    } catch (error) {
      console.error("Stripe portal session creation failed:", error);
      throw error;
    }
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
