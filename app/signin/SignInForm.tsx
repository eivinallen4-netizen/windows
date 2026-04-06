"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SignInFormProps = {
  nextPath: string;
};

export default function SignInForm({ nextPath }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to sign in.");
      }
      router.refresh();
      router.push(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border border-white/70 bg-white/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="h-2 w-full bg-gradient-to-r from-[#0b6fb2] via-sky-400 to-cyan-300" />
      <CardHeader className="space-y-3 pb-5">
        <div className="inline-flex w-fit rounded-full border border-[#0b6fb2]/20 bg-[#0b6fb2]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0b6fb2]">
          Secure Access
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription className="text-sm leading-6">Use your email and PIN to access PureBin tools.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-pin">PIN</Label>
            <Input
              id="signin-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="h-11"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
