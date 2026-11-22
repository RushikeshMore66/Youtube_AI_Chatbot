import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden><path d="M7 4l13 8-13 8z" /></svg>
      </span>
      {SITE_NAME}
    </Link>
  );
}
