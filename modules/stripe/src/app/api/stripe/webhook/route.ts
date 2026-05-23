import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { stripe } from "@/lib/stripe/server";
import { env } from "@/lib/env";
import { setSubscriptionStatus, upsertSubscription } from "@/lib/db/queries";
import { planFromPriceId } from "@/lib/stripe/plans";

export const runtime = "nodejs"; // raw body required for signature verification

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      if (!session.subscription) break;
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      await upsertSubscription({
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        plan: planFromPriceId(sub.items.data[0]!.price.id),
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setSubscriptionStatus(sub.id, {
        plan: event.type === "customer.subscription.deleted" ? "free" : planFromPriceId(sub.items.data[0]!.price.id),
        status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
