"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type UserRole = "admin" | "rep" | "tech";
type InviteStatus = "pending" | "expired" | "completed";

type UserSummary = {
  id: string;
  email?: string;
  name?: string;
  role: UserRole;
  is_admin: boolean;
  phone?: string;
  birthday?: string;
  created_at?: string;
  profile_completed_at?: string;
  last_signed_in_at?: string;
  invite_created_at?: string;
  invite_expires_at?: string;
  invite_used_at?: string;
  invite_status: InviteStatus;
};

type UserActivity =
  | {
      quoteCount: number;
      jobsSold: number;
      authorizedRevenue: number;
      capturedRevenue: number;
    }
  | {
      assignedJobs: number;
      completedJobs: number;
      reviewCount: number;
    }
  | Record<string, never>;

const statusTone: Record<InviteStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  expired: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const darkOutlineButton =
  "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white";

function formatDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0);
}

function displayValue(value?: string) {
  return value && value.trim().length ? value : "Not provided";
}

function DataTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

export function UsersAdminPanel() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [activity, setActivity] = useState<UserActivity>({});
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("rep");

  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState<UserRole>("rep");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftBirthday, setDraftBirthday] = useState("");

  async function copyText(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      setStatus("Link copied.");
      return;
    }

    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      try {
        const copied = document.execCommand("copy");
        setStatus(copied ? "Link copied." : "Copy failed. Copy the link manually.");
      } finally {
        document.body.removeChild(textarea);
      }
      return;
    }

    setStatus("Copy failed. Copy the link manually.");
  }

  async function loadUsers(preserveSelection: boolean = true) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/users?all=true", { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to load users.");
      }
      const payload = (await response.json()) as { users: UserSummary[] };
      setUsers(payload.users);
      if (!preserveSelection && payload.users[0]) {
        setSelectedUserId(payload.users[0].id);
      } else if (preserveSelection && selectedUserId && !payload.users.find((user) => user.id === selectedUserId)) {
        setSelectedUserId(payload.users[0]?.id ?? null);
      } else if (!selectedUserId && payload.users[0]) {
        setSelectedUserId(payload.users[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUser(null);
      setActivity({});
      return;
    }

    let mounted = true;
    const userId = selectedUserId;

    async function loadDetails() {
      setDetailsLoading(true);
      try {
        const response = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load user.");
        }
        const payload = (await response.json()) as { user: UserSummary; activity: UserActivity };
        if (!mounted) return;
        setSelectedUser(payload.user);
        setActivity(payload.activity);
        setDraftName(payload.user.name ?? "");
        setDraftRole(payload.user.role);
        setDraftPhone(payload.user.phone ?? "");
        setDraftBirthday(payload.user.birthday ?? "");
        setEditMode(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load user.");
      } finally {
        if (mounted) {
          setDetailsLoading(false);
        }
      }
    }

    void loadDetails();
    return () => {
      mounted = false;
    };
  }, [selectedUserId]);

  async function handleCreateUser() {
    setStatus(null);
    setInviteLink(null);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName, role: newUserRole }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create user.");
      }
      const payload = (await response.json()) as { user: UserSummary; inviteLink: string };
      setStatus("User created.");
      setInviteLink(payload.inviteLink);
      setNewUserName("");
      setNewUserRole("rep");
      await loadUsers(false);
      setSelectedUserId(payload.user.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to create user.");
    }
  }

  async function handleSaveUser() {
    if (!selectedUser) return;
    setStatus(null);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          name: draftName,
          role: draftRole,
          phone: draftPhone,
          birthday: draftBirthday || undefined,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to update user.");
      }
      setStatus("User updated.");
      setEditMode(false);
      await loadUsers();
      setSelectedUserId(selectedUser.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to update user.");
    }
  }

  async function handleRegenerateInvite() {
    if (!selectedUser) return;
    setStatus(null);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, action: "regenerate_invite" }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to regenerate invite.");
      }
      const payload = (await response.json()) as { inviteLink?: string };
      setInviteLink(payload.inviteLink ?? null);
      setStatus("Invite regenerated.");
      await loadUsers();
      setSelectedUserId(selectedUser.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to regenerate invite.");
    }
  }

  async function handleResetPin() {
    if (!selectedUser) return;
    const pin = window.prompt("Enter a new 4-6 digit PIN:");
    if (!pin) return;
    setStatus(null);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, pin }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to reset PIN.");
      }
      setStatus("PIN updated.");
      await loadUsers();
      setSelectedUserId(selectedUser.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to reset PIN.");
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    setStatus(null);
    try {
      const response = await fetch(`/api/users?id=${encodeURIComponent(selectedUser.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to delete user.");
      }
      setStatus("User deleted.");
      setSelectedUserId(null);
      setSelectedUser(null);
      await loadUsers(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to delete user.");
    }
  }

  const orderedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const dateDelta = new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        if (dateDelta !== 0) return dateDelta;
        return (a.name ?? "").localeCompare(b.name ?? "");
      }),
    [users]
  );

  return (
    <Card className="shadow-lg border border-slate-800 bg-[#0f172a] text-white">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Create invite-based logins and manage account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {status ? <p className="text-sm text-slate-400">{status}</p> : null}

        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm font-semibold">Create pending user</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-user-name">Name</Label>
              <Input
                id="invite-user-name"
                value={newUserName}
                onChange={(event) => setNewUserName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-user-role">Role</Label>
              <select
                id="invite-user-role"
                value={newUserRole}
                onChange={(event) => setNewUserRole(event.target.value as UserRole)}
                className="h-10 rounded-md border border-slate-800 bg-[#0f172a] px-3 text-sm text-white"
              >
                <option value="rep">Rep</option>
                <option value="tech">Tech</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleCreateUser}>
              Create user
            </Button>
            {inviteLink ? (
              <>
                <Input value={inviteLink} readOnly className="max-w-xl" />
                <Button type="button" variant="outline" className={darkOutlineButton} onClick={() => void copyText(inviteLink)}>
                  Copy link
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <Separator />

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading users...</p>
            ) : orderedUsers.length === 0 ? (
              <p className="text-sm text-slate-400">No users yet.</p>
            ) : (
              orderedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedUserId === user.id ? "border-sky-400 bg-slate-900" : "border-slate-800 bg-[#0f172a]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{user.name || "Unnamed"}</p>
                      <p className="text-xs text-slate-400">{user.email || "Not completed"}</p>
                      <p className="text-xs text-slate-400">Role: {user.role}</p>
                      <p className="text-xs text-slate-400">Created: {formatDate(user.created_at)}</p>
                      {user.last_signed_in_at ? (
                        <p className="text-xs text-slate-400">Last sign-in: {formatDate(user.last_signed_in_at)}</p>
                      ) : null}
                    </div>
                    <Badge className={statusTone[user.invite_status]}>{user.invite_status}</Badge>
                  </div>
                </button>
              ))
            )}
          </div>

          <div>
            {!selectedUserId ? (
              <p className="text-sm text-slate-400">Select a user to view details.</p>
            ) : detailsLoading || !selectedUser ? (
              <p className="text-sm text-slate-400">Loading details...</p>
            ) : (
              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name || "Unnamed"}</h3>
                    <p className="text-sm text-slate-400">{selectedUser.email || "Not completed"}</p>
                  </div>
                  <Badge className={statusTone[selectedUser.invite_status]}>{selectedUser.invite_status}</Badge>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Profile</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={darkOutlineButton}
                      onClick={() => setEditMode((prev) => !prev)}
                    >
                      {editMode ? "Close edit" : "Edit profile"}
                    </Button>
                  </div>

                  {editMode ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="detail-name">Name</Label>
                        <Input id="detail-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="detail-role">Role</Label>
                        <select
                          id="detail-role"
                          value={draftRole}
                          onChange={(event) => setDraftRole(event.target.value as UserRole)}
                          className="h-10 rounded-md border border-slate-800 bg-[#0f172a] px-3 text-sm text-white"
                        >
                          <option value="rep">Rep</option>
                          <option value="tech">Tech</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="detail-phone">Phone</Label>
                        <Input id="detail-phone" value={draftPhone} onChange={(event) => setDraftPhone(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="detail-birthday">Birthday</Label>
                        <Input
                          id="detail-birthday"
                          type="date"
                          value={draftBirthday}
                          onChange={(event) => setDraftBirthday(event.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DataTile label="Name" value={displayValue(selectedUser.name)} />
                      <DataTile label="Role" value={selectedUser.role} />
                      <DataTile label="Phone" value={displayValue(selectedUser.phone)} />
                      <DataTile label="Birthday" value={displayValue(selectedUser.birthday)} />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleSaveUser} disabled={!editMode}>
                    Save
                  </Button>
                  {selectedUser.invite_status !== "completed" ? (
                    <Button type="button" variant="outline" className={darkOutlineButton} onClick={handleRegenerateInvite}>
                      Regenerate invite
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" className={darkOutlineButton} onClick={handleResetPin}>
                      Reset PIN
                    </Button>
                  )}
                  <Button type="button" variant="destructive" onClick={handleDeleteUser}>
                    Delete
                  </Button>
                  {inviteLink ? (
                    <Button type="button" variant="secondary" onClick={() => void copyText(inviteLink)}>
                      Copy latest link
                    </Button>
                  ) : null}
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Account status</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      <p>Created: {formatDate(selectedUser.created_at)}</p>
                      <p>Profile completed: {formatDate(selectedUser.profile_completed_at)}</p>
                      <p>Last sign-in: {formatDate(selectedUser.last_signed_in_at)}</p>
                      <p>Invite created: {formatDate(selectedUser.invite_created_at)}</p>
                      <p>Invite expires: {formatDate(selectedUser.invite_expires_at)}</p>
                      <p>Invite used: {formatDate(selectedUser.invite_used_at)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Activity</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      {"quoteCount" in activity ? (
                        <>
                          <p>Quotes: {activity.quoteCount}</p>
                          <p>Jobs sold: {activity.jobsSold}</p>
                          <p>Authorized revenue: {formatCurrency(activity.authorizedRevenue)}</p>
                          <p>Captured revenue: {formatCurrency(activity.capturedRevenue)}</p>
                        </>
                      ) : "assignedJobs" in activity ? (
                        <>
                          <p>Assigned jobs: {activity.assignedJobs}</p>
                          <p>Completed jobs: {activity.completedJobs}</p>
                          <p>Reviews: {activity.reviewCount}</p>
                        </>
                      ) : (
                        <p>No role-specific activity for this user.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
