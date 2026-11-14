import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUSINESS_NAME, SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-6 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
        <p>{SITE_NAME} turns YouTube videos into summaries, notes, posts and chat answers. This policy explains what we collect and why.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Account data: your email address and, if you use Google sign-in, your basic Google profile (via Supabase Auth).</li>
          <li>Usage data: which YouTube videos you process and when, used to apply plan limits and show your history.</li>
          <li>Content: transcripts of public YouTube videos you submit, the summaries/notes/posts generated from them, and your chat messages about a video.</li>
          <li>Payment data: payments are handled by Razorpay. We never see or store your card or UPI details; we store only your subscription ID and plan.</li>
        </ul>
        <h2>How we use it</h2>
        <p>To provide the service, enforce plan limits, process payments, prevent abuse and improve reliability. We do not sell your data.</p>
        <h2>Service providers</h2>
        <p>We use Supabase (authentication and database), Vercel (hosting), Groq (AI text generation — transcript text and your chat messages are sent to it to produce answers), a transcript provider (receives the YouTube video link), and Razorpay (payments). Each processes data only to provide its service.</p>
        <h2>Retention and deletion</h2>
        <p>We keep your data while your account is active. Email us to delete your account and associated data. Cached transcripts and generated outputs for public videos may be retained to avoid reprocessing.</p>
        <h2>Your rights</h2>
        <p>You can ask to access, correct or delete your personal data at any time by emailing us below.</p>
        <h2>Contact</h2>
        <p>{BUSINESS_NAME} — <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </main>
      <SiteFooter />
    </>
  );
}
