import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

async function upsertSubscriptionStatus({
  userId,
  email,
  subscribed,
}: {
  userId?: string;
  email?: string | null;
  subscribed: boolean;
}) {
  if (!userId) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      subscribed,
    },
    { onConflict: "id" },
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook signature failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await upsertSubscriptionStatus({
        userId: session.metadata?.userId,
        email: session.customer_details?.email ?? session.customer_email,
        subscribed: true,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionStatus({
        userId: subscription.metadata?.userId,
        subscribed: false,
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
