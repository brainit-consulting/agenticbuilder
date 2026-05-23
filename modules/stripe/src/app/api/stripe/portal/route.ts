import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { requireSession } from "@/lib/auth/roles";
import { getSubscriptionForUser } from "@/lib/db/queries";
import { env } from "@/lib/env";

export async function POST() {
  const session = await requireSession();
  const subscription = await getSubscriptionForUser(session.user.id);
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.BETTER_AUTH_URL}/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
