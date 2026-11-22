import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRO, TOPUP_PACKS, TRIAL_CREDITS, SECONDS_PER_CREDIT, MAX_VIDEO_SECONDS } from "@/lib/pricing";

const MIN_PER_CREDIT = SECONDS_PER_CREDIT / 60;
const FREE = [
  `${TRIAL_CREDITS} free credit — try one video up to ${MIN_PER_CREDIT} minutes`,
  "Summary, notes, LinkedIn/blog post",
  "Chat with the video",
];
const PRO_FEATURES = [
  `${PRO.credits} credits every month (about ${(PRO.credits * MIN_PER_CREDIT) / 60} hours of video)`,
  `Videos up to ${MAX_VIDEO_SECONDS / 3600} hours`,
  "Best price per credit",
  "Cancel anytime",
];

function Plan({ name, price, per, features, cta, highlight, badge }: { name: string; price: string; per?: string; features: string[]; cta: ReactNode; highlight?: boolean; badge?: string }) {
  return (
    <Card className={highlight ? "border-primary shadow-md" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {name}
          {badge && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{badge}</span>}
        </CardTitle>
        <p className="text-3xl font-bold">{price}<span className="text-base font-normal text-muted-foreground">{per}</span></p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{f}</li>
          ))}
        </ul>
        {cta}
      </CardContent>
    </Card>
  );
}

export function PricingCards({ freeCta, proCta, topups }: { freeCta: ReactNode; proCta: ReactNode; topups?: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Plan name="Free trial" price="₹0" features={FREE} cta={freeCta} />
        <Plan name="Pro" price={`₹${PRO.priceInr}`} per="/month" features={PRO_FEATURES} cta={proCta} highlight badge="Best value" />
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        <p className="text-sm font-medium">Need more credits? Top up any time. They never expire.</p>
        {topups ?? (
          <ul className="text-sm text-muted-foreground">
            {TOPUP_PACKS.map((p) => <li key={p.id}>{p.credits} credits — ₹{p.priceInr}</li>)}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">1 credit covers up to {MIN_PER_CREDIT} minutes of video. A 1-hour video uses 4 credits.</p>
      </div>
    </div>
  );
}
