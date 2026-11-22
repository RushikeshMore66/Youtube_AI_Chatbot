import Link from "next/link";
import { FileText, PenLine, MessageSquare, ListChecks } from "lucide-react";
import { getOptionalUser } from "@/lib/current-user";
import { LoginForm } from "@/components/login-form";
import { PricingCards } from "@/components/pricing-cards";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STEPS = [
  ["1", "Paste a link", "Any public YouTube video with captions, up to 3 hours. Longer videos use more credits."],
  ["2", "We read the transcript", "Fast, and cached, so repeat videos are instant."],
  ["3", "Get your content", "Summary, notes and a post — then chat with the video."],
];

const FEATURES = [
  { icon: FileText, title: "Summary", text: "The key takeaways in under a minute of reading." },
  { icon: ListChecks, title: "Study notes", text: "Structured sections with definitions, steps and numbers." },
  { icon: PenLine, title: "LinkedIn / blog post", text: "A ready-to-edit draft with a hook and hashtags." },
  { icon: MessageSquare, title: "Chat with the video", text: "Answers come only from the transcript, never invented." },
];

const FAQ = [
  ["Which videos work?", "Public YouTube videos that have captions (including auto-generated ones), up to 3 hours long. Each video costs 1 credit per 15 minutes."],
  ["What counts toward the free limit?", "Each new video you process. Re-opening a video you already processed is free."],
  ["Can I cancel Pro?", "Yes, any time. See the refund policy for details."],
  ["Is the AI always right?", "No. Outputs are generated from the transcript and can contain mistakes — review before publishing."],
];

const DEMO_SUMMARY =
  "A practical guide to building habits that last. Tiny, consistent actions beat motivation, and the right environment makes good behaviour the easy one.\n\n- Start with a two-minute version of the habit\n- Attach it to something you already do daily\n- Track streaks, but never miss twice";
const DEMO_POST =
  "Most people fail at habits because they aim too big.\n\nI just watched a 40-minute talk that changed how I think about it:\n\n- Make it tiny (two minutes)\n- Anchor it to an existing routine\n- Never miss twice\n\nWhat's one habit you could shrink today?\n\n#habits #productivity";

export default async function Home() {
  const user = await getOptionalUser();
  const cta = user ? "/dashboard" : "/login";
  return (
    <>
      <SiteHeader signedIn={!!user} />
      <main>
        <section className="bg-gradient-to-b from-accent/60 to-background">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div className="space-y-5">
              <p className="inline-block rounded-full border bg-background px-3 py-1 text-xs font-medium text-primary">Free: 3 videos a day</p>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
                Turn any YouTube video into notes, a post, and a chat.
              </h1>
              <p className="text-lg text-muted-foreground">
                Paste a link. Get a summary, study notes and a ready-to-post LinkedIn draft — then ask the video questions.
              </p>
            </div>
            <Card className="shadow-lg">
              <CardContent className="space-y-4 p-6">
                {user ? (
                  <>
                    <h2 className="text-lg font-semibold">Welcome back</h2>
                    <Button asChild size="lg" className="w-full"><Link href="/dashboard">Go to dashboard</Link></Button>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold">Start free in 10 seconds</h2>
                    <LoginForm />
                    <p className="text-xs text-muted-foreground">No card needed. By continuing you accept the <Link className="underline" href="/terms">Terms</Link> and <Link className="underline" href="/privacy">Privacy Policy</Link>.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-8 px-4 py-14">
          <h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(([n, t, d]) => (
              <li key={n} className="flex gap-3 rounded-xl border p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</span>
                <div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-5xl space-y-8 px-4 pb-14">
          <h2 className="text-center text-2xl font-bold tracking-tight">Everything from one link</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-2 rounded-xl border p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="size-5" /></span>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-6 px-4 pb-14">
          <h2 className="text-center text-2xl font-bold tracking-tight">See what you get</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {([["Summary", DEMO_SUMMARY], ["LinkedIn post", DEMO_POST]] as const).map(([label, text]) => (
              <div key={label} className="rounded-xl border bg-card p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">Example output.</p>
        </section>

        <section id="pricing" className="mx-auto max-w-3xl space-y-6 px-4 pb-14">
          <h2 className="text-center text-2xl font-bold tracking-tight">Simple pricing</h2>
          <PricingCards
            freeCta={<Button asChild variant="outline" className="w-full"><Link href={cta}>Start free</Link></Button>}
            proCta={<Button asChild className="w-full"><Link href={user ? "/pricing" : "/login?next=/pricing"}>Go Pro</Link></Button>}
          />
        </section>

        <section className="mx-auto max-w-3xl space-y-4 px-4 pb-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">Questions</h2>
          <div className="divide-y rounded-xl border">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">{q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
