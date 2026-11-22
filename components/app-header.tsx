import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader({ plan, credits }: { plan?: "free" | "pro"; credits?: number }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-2">
          {plan && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium uppercase text-accent-foreground">{plan}</span>
          )}
          {credits !== undefined && (
            <Link href="/pricing" className="rounded-full border px-2.5 py-0.5 text-xs font-medium" title="Credits left. Click to get more.">
              {credits} credit{credits === 1 ? "" : "s"}
            </Link>
          )}
          {plan === "free" && (
            <Link href="/pricing" className="text-sm font-medium text-primary">Upgrade</Link>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
