"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PortalSwitcher } from "@/components/portal-switcher";

type AuthUser = {
  email: string;
  name?: string;
  role: "admin" | "rep" | "tech";
  is_admin: boolean;
};

function canSeeRepLinks(user: AuthUser) {
  return user.role === "rep" || user.role === "admin";
}

export function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { user: AuthUser };
        if (mounted) {
          setUser(payload.user);
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAccountMenuOpen(false);
      setUser(null);
      router.refresh();
      router.push("/signin");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-2xl transition-colors hover:text-[#0b6fb2]"
            aria-label="Go to homepage"
          >
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#0b6fb2]/15 bg-white shadow-[0_12px_28px_-18px_rgba(11,111,178,0.45)]">
              <Image
                src="/logo.png"
                alt="PureBin Window Cleaning logo"
                width={56}
                height={56}
                className="size-12 object-contain"
                priority
              />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-black uppercase tracking-[0.2em] text-[#0b6fb2]">
                PureBin
              </p>
              <p className="truncate text-sm font-medium text-foreground/80 transition-colors group-hover:text-[#0b6fb2]">
                Window Cleaning
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>

          <nav className="hidden items-center justify-end gap-2 sm:flex">
            {user ? (
              <div className="flex items-center gap-2">
                <PortalSwitcher role={user.role} />
                <Button asChild variant="outline" size="sm">
                  <Link href="/reviews">Reviews</Link>
                </Button>
                <div className="relative" ref={accountMenuRef}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="menu"
                  >
                    {user.name || user.email}
                    <ChevronDown className="size-4" />
                  </Button>
                  {accountMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-2 min-w-40 rounded-xl border bg-background p-1 shadow-lg">
                      {canSeeRepLinks(user) ? (
                        <>
                          <Link
                            href="/rep-stats"
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            Rep Stats
                          </Link>
                          <Link
                            href="/script"
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            Script
                          </Link>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleSignOut}
                      >
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-4 text-sm"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>

        {menuOpen ? (
          <div className="border-t pb-4 sm:hidden">
            {user ? (
              <div className="mt-4 grid gap-3">
                <div className="flex justify-start">
                  <PortalSwitcher role={user.role} />
                </div>
                <Button asChild variant="outline" className="h-12 justify-start" onClick={() => setMenuOpen(false)}>
                  <Link href="/reviews">Reviews</Link>
                </Button>
                <div className="rounded-lg border bg-muted/40 p-2">
                  <div className="rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-foreground">
                      {user.name || user.email}
                    </span>
                  </div>
                  <div className="mt-1 grid gap-1 rounded-lg border bg-background p-1">
                    {canSeeRepLinks(user) ? (
                      <>
                        <Link
                          href="/rep-stats"
                          className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          Rep Stats
                        </Link>
                        <Link
                          href="/script"
                          className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          Script
                        </Link>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <Button asChild variant="outline" className="h-12 w-full justify-center rounded-full">
                  <Link href="/signin">Sign in</Link>
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
