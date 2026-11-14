import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { BUSINESS_NAME, SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Cancellation & Refund Policy · YouTube AI-Genie" };

export default function Page() {
  return (
    <>
      <header className="mx-auto flex h-14 max-w-3xl items-center px-4">
        <Link href="/" className="font-semibold">{SITE_NAME}</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-6 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="text-3xl font-bold">Cancellation & Refund Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
        <h2>Cancellation</h2>
        <p>You can cancel your Pro subscription at any time by emailing us. No further charges are made after cancellation, and Pro access continues until the end of the period you already paid for.</p>
        <h2>Refunds</h2>
        <ul>
          <li>If you are unhappy with Pro, email us within 7 days of your first payment for a full refund.</li>
          <li>After 7 days, monthly payments are non-refundable, except where we charged you in error or a payment was duplicated.</li>
        </ul>
        <p>Approved refunds are returned to the original payment method via Razorpay within 5–7 business days.</p>
        <h2>Digital service</h2>
        <p>{SITE_NAME} is a digital service delivered online; nothing is shipped.</p>
        <h2>Contact</h2>
        <p>{BUSINESS_NAME} — <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </main>
      <SiteFooter />
    </>
  );
}
