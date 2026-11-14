import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRO_PRICE_INR } from "@/lib/site";

const FREE = ["3 new videos per day", "Summary, notes, LinkedIn/blog post", "Chat with the video", "Videos up to 60 minutes"];
const PRO = ["Unlimited videos", "Everything in Free", "Cancel anytime"];

function Plan({ name, price, per, features, cta, highlight }: { name: string; price: string; per?: string; features: string[]; cta: ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary shadow-md" : ""}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
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

export function PricingCards({ freeCta, proCta }: { freeCta: ReactNode; proCta: ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Plan name="Free" price="₹0" features={FREE} cta={freeCta} />
      <Plan name="Pro" price={`₹${PRO_PRICE_INR}`} per="/month" features={PRO} cta={proCta} highlight />
    </div>
  );
}
