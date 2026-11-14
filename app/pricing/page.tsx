import Link from "next/link";
import { getOptionalUser } from "@/lib/current-user";
import { PricingCards } from "@/components/pricing-cards";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/components/subscribe-button";
import { getPlan } from "@/lib/plan";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getOptionalUser();
  const plan = user ? await getPlan(user.id) : "free";
  return (
    <>
      <SiteHeader signedIn={!!user} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-8">
        <div className="space-y-2 text-center"><h1 className="text-3xl font-bold tracking-tight">Simple, honest pricing</h1><p className="text-muted-foreground">Start free. Upgrade when you need more.</p></div>
        <PricingCards
          freeCta={<Button asChild variant="outline" className="w-full"><Link href={user ? "/dashboard" : "/login"}>{user ? "Open dashboard" : "Start free"}</Link></Button>}
          proCta={user ? <SubscribeButton isPro={plan === "pro"} /> : <Button asChild className="w-full"><Link href="/login?next=/pricing">Sign in to go Pro</Link></Button>}
        />
      </main>
      <SiteFooter />
    </>
  );
}
