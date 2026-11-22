import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-accent/60 to-background px-4">
      <Logo />
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="text-sm text-muted-foreground">New here? An account is created automatically.</p>
          </div>
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">Sign-in failed. Please try again.</p>}
          <LoginForm next={safeNext} />
        </CardContent>
      </Card>
    </main>
  );
}
