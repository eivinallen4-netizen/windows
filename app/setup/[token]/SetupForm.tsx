"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getHomePathForRole } from "@/lib/portal-routes";

type InviteUser = {
  id: string;
  name?: string;
  role?: "admin" | "rep" | "tech";
  invite_expires_at?: string;
};

export default function SetupForm({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteUser | null>(null);
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadInvite() {
      try {
        const response = await fetch(`/api/users/onboard?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load invite.");
        }
        const payload = (await response.json()) as { user: InviteUser };
        if (mounted) {
          setInvite(payload.user);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load invite.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadInvite();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, birthday, phone, pin }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to finish setup.");
      }
      const payload = (await response.json()) as { user: { role?: "admin" | "rep" | "tech" } };
      router.refresh();
      router.push(getHomePathForRole(payload.user.role ?? "rep"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finish setup.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading invite...</p>;
  }

  if (!invite) {
    return <p className="text-sm text-destructive">{error ?? "Invite not found."}</p>;
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border border-white/70 bg-white/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="h-2 w-full bg-gradient-to-r from-[#0b6fb2] via-sky-400 to-cyan-300" />
      <CardHeader className="space-y-3 pb-5">
        <CardTitle className="text-2xl">{`Hey ${invite.name || "there"}, welcome to the team.`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="setup-email">Email</Label>
            <Input id="setup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-birthday">Birthday</Label>
            <Input
              id="setup-birthday"
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-phone">Phone</Label>
            <Input id="setup-phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-pin">PIN</Label>
            <Input
              id="setup-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              required
            />
          </div>
          {invite.invite_expires_at ? (
            <p className="text-xs text-slate-500">
              Link expires {new Date(invite.invite_expires_at).toLocaleString()}.
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={saving}>
            {saving ? "Saving..." : "Finish setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
