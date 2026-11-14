import Link from "next/link";
import { getOptionalUser } from "@/lib/current-user";
import { PricingCards } from "@/components/pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/components/subscribe-button";
import { getPlan } from "@/lib/plan";

export const metadata = { title: "Pricing · YouTube AI-Genie" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getOptionalUser();
  const plan = user ? await getPlan(user.id) : "free";
  return (
    <>
      <header className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">YouTube AI-Genie</Link>
        <Button asChild size="sm" variant="ghost"><Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Sign in"}</Link></Button>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-8">
        <h1 className="text-center text-3xl font-bold">Pricing</h1>
        <PricingCards
          freeCta={<Button asChild variant="outline" className="w-full"><Link href={user ? "/dashboard" : "/login"}>{user ? "Open dashboard" : "Start free"}</Link></Button>}
          proCta={user ? <SubscribeButton isPro={plan === "pro"} /> : <Button asChild className="w-full"><Link href="/login?next=/pricing">Sign in to go Pro</Link></Button>}
        />
      </main>
      <SiteFooter />
    </>
  );
}
