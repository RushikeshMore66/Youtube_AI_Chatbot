import Link from "next/link";
import { getOptionalUser } from "@/lib/current-user";
import { LoginForm } from "@/components/login-form";
import { PricingCards } from "@/components/pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

const DEMO = {
  summary: "A practical guide to building habits that last. The speaker argues that tiny, consistent actions beat motivation, and shows how to design your environment so the right behaviour is the easy one.\n\n- Start with a two-minute version of the habit\n- Attach it to something you already do daily\n- Track streaks, but never miss twice",
  post: "Most people fail at habits because they aim too big.\n\nI just watched a 40-minute talk that changed how I think about it:\n\n- Make it tiny (two minutes)\n- Anchor it to an existing routine\n- Never miss twice\n\nWhat's one habit you could shrink today?\n\n#habits #productivity #growth",
};

export default async function Home() {
  const user = await getOptionalUser();
  return (
    <>
      <header className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <span className="font-semibold">{SITE_NAME}</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/pricing">Pricing</Link>
          <Button asChild size="sm"><Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Sign in"}</Link></Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl space-y-20 px-4 pt-10">
        <section className="mx-auto max-w-2xl space-y-5 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Turn any YouTube video into notes, a post, and a chat.</h1>
          <p className="text-lg text-muted-foreground">
            Paste a link. Get a summary, study notes and a ready-to-post LinkedIn/blog draft — then ask the video questions.
          </p>
          <div className="flex justify-center pt-2">
            {user ? (
              <Button asChild size="lg"><Link href="/dashboard">Go to dashboard</Link></Button>
            ) : (
              <LoginForm />
            )}
          </div>
          <p className="text-sm text-muted-foreground">Free: 3 videos a day. No card needed.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-center text-2xl font-bold">See what you get</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {([["Summary", DEMO.summary], ["LinkedIn post", DEMO.post]] as const).map(([label, text]) => (
              <div key={label} className="rounded-xl border bg-card p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">Example output.</p>
        </section>

        <section id="pricing" className="space-y-4">
          <h2 className="text-center text-2xl font-bold">Simple pricing</h2>
          <PricingCards
            freeCta={<Button asChild variant="outline" className="w-full"><Link href={user ? "/dashboard" : "/login"}>Start free</Link></Button>}
            proCta={<Button asChild className="w-full"><Link href={user ? "/pricing" : "/login?next=/pricing"}>Go Pro</Link></Button>}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
