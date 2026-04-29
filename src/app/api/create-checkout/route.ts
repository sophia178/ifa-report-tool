import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/utils";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to subscribe." },
        { status: 401 },
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID is not configured." },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        userEmail: user.email,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          userEmail: user.email,
        },
      },
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);

    const message =
      error instanceof Error ? error.message : "Unable to create Stripe checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
