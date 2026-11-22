import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUSINESS_NAME, SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Terms of Service" };

export default function Page() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-6 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
        <p>By using {SITE_NAME} you agree to these terms.</p>
        <h2>The service</h2>
        <p>{SITE_NAME} generates summaries, notes, social posts and chat answers from YouTube video transcripts using AI. Output may be inaccurate or incomplete; review it before relying on or publishing it.</p>
        <h2>Accounts and plans</h2>
        <ul>
          <li>Free trial: 1 credit, usable once on a video up to 15 minutes long.</li>
          <li>Pro plan: ₹299 per month, billed monthly through Razorpay, renews until cancelled. Includes 40 credits per billing cycle; unused subscription credits do not roll over.</li>
          <li>Credits: a video costs 1 credit per 15 minutes of length (rounded up), up to 3 hours. Top-up credits (₹99 for 10, ₹249 for 30) are one-time purchases that do not expire. Re-opening a video you already processed is free.</li>
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
