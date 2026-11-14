import Link from "next/link";
import { getOptionalUser } from "@/lib/current-user";
import { PricingCards } from "@/components/pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pricing · YouTube AI-Genie" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getOptionalUser();
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
          proCta={<Button asChild className="w-full"><Link href={user ? "/dashboard" : "/login?next=/pricing"}>Go Pro</Link></Button>}
        />
      </main>
      <SiteFooter />
    </>
  );
}
