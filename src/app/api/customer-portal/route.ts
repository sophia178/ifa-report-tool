import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/utils";

async function getCustomerId(userId: string, email: string) {
  const stripe = getStripe();
  const customers = await stripe.customers.list({
    email,
    limit: 10,
  });

  const customer = customers.data.find((item) => {
    if (item.deleted) {
      return false;
    }

    return (
      item.metadata.userId === userId ||
      item.email?.toLowerCase() === email.toLowerCase()
    );
  });

  return customer?.id ?? null;
}

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

    const customerId = await getCustomerId(user.id, user.email);

    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer account was found for this user." },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBaseUrl()}/dashboard`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Stripe customer portal session creation failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create Stripe customer portal session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
