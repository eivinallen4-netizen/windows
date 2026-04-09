"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, PhoneCall, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/reviews", label: "Reviews" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/before-after", label: "Before & After" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function PublicSiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-background/88 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-2xl transition-colors hover:text-primary"
            aria-label="Go to homepage"
          >
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-[0_12px_28px_-18px_rgba(11,111,178,0.45)]">
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
              <p className="truncate text-sm font-black uppercase tracking-[0.2em] text-primary">
                PureBin
              </p>
              <p className="truncate text-sm font-medium text-foreground/80 transition-colors group-hover:text-primary">
                Window Cleaning
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => (
              <Button key={link.href} asChild variant="ghost" size="sm" className="rounded-full px-4 text-sm font-medium">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden rounded-full px-4 sm:inline-flex">
              <Link href="/#quote-form">
                Request a Call
                <PhoneCall className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/70 pb-4 lg:hidden">
            <nav className="mt-4 grid gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="outline"
                  className="h-12 justify-start rounded-2xl"
                  onClick={() => setMenuOpen(false)}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
              <Button asChild className="mt-2 h-12 rounded-full" onClick={() => setMenuOpen(false)}>
                <Link href="/#quote-form">
                  Request a Call
                  <PhoneCall className="size-4" />
                </Link>
              </Button>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
