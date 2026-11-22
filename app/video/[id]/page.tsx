import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plan";
import { getBalance } from "@/lib/credits";
import { AppHeader } from "@/components/app-header";
import { OutputPanel } from "@/components/output-panel";
import { ChatPanel } from "@/components/chat-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) notFound();
  const user = await requireUser();
  const supabase = await createClient(); // RLS: only visible if this user processed the video

  const [plan, balance, { data: video }, { data: outputs }, { data: chats }] = await Promise.all([
    getPlan(user.id),
    getBalance(user.id),
    supabase.from("videos").select("video_id,title,duration_seconds").eq("video_id", id).maybeSingle(),
    supabase.from("outputs").select("type,content").eq("video_id", id),
    supabase.from("chats").select("role,content").eq("video_id", id).order("created_at", { ascending: true }).limit(100),
  ]);
  if (!video) notFound();
  const byType = Object.fromEntries((outputs ?? []).map((o) => [o.type, o.content])) as Record<string, string>;

  return (
    <>
      <AppHeader plan={plan} credits={balance.total} />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground">← Dashboard</Link>
          <h1 className="mt-1 text-xl font-bold leading-snug">{video.title}</h1>
          <a
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary"
          >
            Watch on YouTube
          </a>
        </div>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          {(["summary", "notes", "post"] as const).map((t) => (
            <TabsContent key={t} value={t}>
              <OutputPanel videoId={video.video_id} type={t} initial={byType[t]} />
            </TabsContent>
          ))}
          <TabsContent value="chat">
            <ChatPanel videoId={video.video_id} initial={(chats ?? []) as { role: "user" | "assistant"; content: string }[]} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
