import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/pricing" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">Pricing</Link>
          <Button asChild size="sm">
            <Link href={signedIn ? "/dashboard" : "/login"}>{signedIn ? "Dashboard" : "Sign in"}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
