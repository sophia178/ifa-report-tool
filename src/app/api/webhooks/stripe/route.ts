import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        const stripeCustomerId = session.customer as string;
        const stripePriceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;

        if (customerEmail) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              stripe_customer_id: stripeCustomerId,
              stripe_price_id: stripePriceId,
              subscribed: true,
            })
            .eq("email", customerEmail);

          if (error) throw error;
          console.log(`Updated profile for ${customerEmail} after checkout completion.`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            stripe_price_id: null,
            subscribed: false,
          })
          .eq("stripe_customer_id", stripeCustomerId);

        if (error) throw error;
        console.log(`Cancelled subscription for customer ${stripeCustomerId}.`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        const stripePriceId = subscription.items.data[0].price.id;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            stripe_price_id: stripePriceId,
            subscribed: true,
          })
          .eq("stripe_customer_id", stripeCustomerId);

        if (error) throw error;
        console.log(`Updated subscription for customer ${stripeCustomerId} to ${stripePriceId}.`);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
