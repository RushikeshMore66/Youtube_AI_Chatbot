import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plan";
import { getBalance } from "@/lib/credits";
import { AppHeader } from "@/components/app-header";
import { ProcessForm } from "@/components/process-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type Row = { created_at: string; videos: { video_id: string; title: string; duration_seconds: number } | null };

export default async function Dashboard() {
  const user = await requireUser();
  const supabase = await createClient();
  const [plan, balance, { data }] = await Promise.all([
    getPlan(user.id),
    getBalance(user.id),
    supabase.from("usage").select("created_at, videos(video_id,title,duration_seconds)").order("created_at", { ascending: false }).limit(50),
  ]);
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.videos);

  return (
    <>
      <AppHeader plan={plan} credits={balance.total} />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Paste a YouTube link</h1>
          <ProcessForm />
          <p className="text-sm text-muted-foreground">
            You have {balance.total} credit{balance.total === 1 ? "" : "s"}. A video costs 1 credit per 15 minutes (up to 3 hours).{" "}
            {balance.total === 0 && <Link href="/pricing" className="font-medium text-primary underline">Get more credits</Link>}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your videos</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here yet. Paste a link above to get started.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.videos!.video_id}>
                  <Link href={`/video/${r.videos!.video_id}`}>
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <span className="line-clamp-2 text-sm font-medium">{r.videos!.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {Math.max(1, Math.round(r.videos!.duration_seconds / 60))} min
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
