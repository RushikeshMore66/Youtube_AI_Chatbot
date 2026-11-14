import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { BUSINESS_NAME, SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Terms of Service · YouTube AI-Genie" };

export default function Page() {
  return (
    <>
      <header className="mx-auto flex h-14 max-w-3xl items-center px-4">
        <Link href="/" className="font-semibold">{SITE_NAME}</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-6 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
        <p>By using {SITE_NAME} you agree to these terms.</p>
        <h2>The service</h2>
        <p>{SITE_NAME} generates summaries, notes, social posts and chat answers from YouTube video transcripts using AI. Output may be inaccurate or incomplete; review it before relying on or publishing it.</p>
        <h2>Accounts and plans</h2>
        <ul>
          <li>Free plan: up to 3 new videos per day, videos up to 60 minutes long.</li>
          <li>Pro plan: ₹299 per month, billed monthly through Razorpay, renews until cancelled. Unlimited videos (fair use applies).</li>
          <li>You may cancel any time; access continues to the end of the paid period.</li>
        </ul>
        <h2>Acceptable use</h2>
        <p>Do not abuse, scrape or overload the service, attempt to bypass limits, or use it to infringe others rights. You are responsible for how you use generated content and for respecting the rights of the original video creators. {SITE_NAME} is not affiliated with YouTube or Google.</p>
        <h2>Availability and liability</h2>
        <p>The service is provided &quot;as is&quot; without warranties. We rely on third-party services and cannot guarantee uninterrupted availability. To the extent permitted by law, our liability is limited to the amount you paid in the previous 3 months.</p>
        <h2>Changes</h2>
        <p>We may update these terms; continued use means you accept the updated terms. Governing law: India.</p>
        <h2>Contact</h2>
        <p>{BUSINESS_NAME} — <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </main>
      <SiteFooter />
    </>
  );
}
