import { env } from "@/lib/env";

export type PlanId = "free" | "pro" | "team";

export interface Plan {
  id: PlanId;
  name: string;
  priceId: string | null;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceId: null,
    features: ["10 notes", "Basic features"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceId: env.STRIPE_PRICE_PRO,
    features: ["Unlimited notes", "Priority support", "All features"],
  },
  team: {
    id: "team",
    name: "Team",
    priceId: env.STRIPE_PRICE_TEAM,
    features: ["Everything in Pro", "Multiple users", "Audit logs"],
  },
};

export function planFromPriceId(priceId: string): PlanId {
  if (priceId === env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === env.STRIPE_PRICE_TEAM) return "team";
  return "free";
}
