import { requireSession } from "@/lib/auth/roles";
import { getSubscriptionForUser } from "@/lib/db/queries";
import { PLANS } from "@/lib/stripe/plans";
import { PlanCard } from "./_components/PlanCard";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const session = await requireSession();
  const subscription = await getSubscriptionForUser(session.user.id);
  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Current plan: <strong>{PLANS[currentPlan].name}</strong>
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={currentPlan === plan.id}
            recommended={plan.id === "pro"}
          />
        ))}
      </div>
      {subscription?.stripeCustomerId && (
        <form action="/api/stripe/portal" method="post">
          <Button type="submit" variant="secondary">Manage billing in Stripe</Button>
        </form>
      )}
    </div>
  );
}
