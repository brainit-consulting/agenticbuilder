"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import type { Plan } from "@/lib/stripe/plans";

export function PlanCard({ plan, current, recommended }: { plan: Plan; current: boolean; recommended?: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleUpgrade() {
    setPending(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: plan.id }),
    });
    const { url, error } = await res.json();
    if (error) {
      alert(error);
      setPending(false);
      return;
    }
    window.location.href = url;
  }

  return (
    <Card className={recommended ? "border-neutral-900 dark:border-white" : ""}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.features.join(" · ")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {plan.features.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {current ? (
          <Button variant="secondary" disabled>Current plan</Button>
        ) : plan.id === "free" ? (
          <Button variant="ghost" disabled>Downgrade via portal</Button>
        ) : (
          <Button disabled={pending} onClick={handleUpgrade}>
            {pending ? "Loading…" : `Upgrade to ${plan.name}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
