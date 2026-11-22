import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="text-muted-foreground">The link may be wrong, or the video isn&apos;t in your account.</p>
      <Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>
    </main>
  );
}
