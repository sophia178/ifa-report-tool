import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

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

    const priceId = process.env.STRIPE_PLUS_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID is not configured for this plan." },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured." },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
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
        trial_period_days: 7,
        metadata: {
          userId: user.id,
          userEmail: user.email,
        },
      },
      success_url: `${appUrl}/dashboard`,
      cancel_url: `${appUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe promo checkout session creation failed:", error);

    const message =
      error instanceof Error ? error.message : "Unable to create Stripe checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

