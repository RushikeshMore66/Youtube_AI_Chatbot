import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in · YouTube AI-Genie" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4">
      <Link href="/" className="text-lg font-semibold">YouTube AI-Genie</Link>
      <h1 className="text-2xl font-bold">Sign in</h1>
      {error && <p className="text-sm text-destructive">Sign-in failed. Please try again.</p>}
      <LoginForm next={safeNext} />
    </main>
  );
}
