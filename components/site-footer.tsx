import Link from "next/link";
import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {BUSINESS_NAME}. Contact: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund">Refunds</Link>
        </nav>
      </div>
    </footer>
  );
}
