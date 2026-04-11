"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getHomePathForRole } from "@/lib/portal-routes";

type AccountUser = {
  id: string;
  email?: string;
  name?: string;
  role?: "admin" | "rep" | "tech";
  phone?: string;
  birthday?: string;
  profile_completed_at?: string;
  is_admin: boolean;
};

export default function AccountForm() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        const response = await fetch("/api/account", { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load account.");
        }
        const payload = (await response.json()) as { user: AccountUser };
        if (!mounted) return;
        setUser(payload.user);
        setEmail(payload.user.email ?? "");
        setPhone(payload.user.phone ?? "");
        setBirthday(payload.user.birthday ?? "");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load account.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadAccount();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          birthday,
          pin: pin.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to update account.");
      }
      const payload = (await response.json()) as { user: AccountUser };
      setUser(payload.user);
      setPin("");
      setStatus("Account updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update account.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading account...</p>;
  }

  if (!user) {
    return <p className="text-sm text-destructive">{error ?? "Unable to load account."}</p>;
  }

  return (
    <Card className="w-full max-w-2xl border-border bg-card shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader>
        <CardTitle>{`Hey ${user.name || "there"}, welcome to the team.`}</CardTitle>
        <CardDescription>Update your contact details and PIN here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-start">
          <Button asChild variant="outline">
            <Link href={getHomePathForRole(user.role ?? "rep")}>Back to home</Link>
          </Button>
        </div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-phone">Phone</Label>
            <Input id="account-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-birthday">Birthday</Label>
            <Input
              id="account-birthday"
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="account-pin">New PIN</Label>
            <Input
              id="account-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Leave blank to keep current PIN"
            />
          </div>
          {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
          {status ? <p className="text-sm text-muted-foreground sm:col-span-2">{status}</p> : null}
          <Button type="submit" className="sm:col-span-2" disabled={saving}>
            {saving ? "Saving..." : "Save account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
