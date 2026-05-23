import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { PLANS, type PlanId } from "@/lib/stripe/plans";
import { requireSession } from "@/lib/auth/roles";
import { getSubscriptionForUser } from "@/lib/db/queries";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const session = await requireSession();
  const { plan } = (await req.json()) as { plan: PlanId };

  const planConfig = PLANS[plan];
  if (!planConfig || !planConfig.priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const subscription = await getSubscriptionForUser(session.user.id);
  const customerId = subscription?.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${env.BETTER_AUTH_URL}/billing?status=success`,
    cancel_url: `${env.BETTER_AUTH_URL}/billing?status=cancelled`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
