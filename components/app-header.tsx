import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader({ plan }: { plan?: "free" | "pro" }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold">YouTube AI-Genie</Link>
        <div className="flex items-center gap-2">
          {plan && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium uppercase text-accent-foreground">{plan}</span>
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
