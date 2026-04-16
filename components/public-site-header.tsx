"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/service-areas/las-vegas", label: "Las Vegas" },
  { href: "/reviews", label: "Reviews" },
  { href: "/before-after", label: "Before/After" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

type PublicSiteHeaderProps = {
  theme?: "dark" | "light";
};

export function PublicSiteHeader({ theme = "dark" }: PublicSiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/logo - transparent white.png" : "/logo.png";
  const navLinkClass = cn(
    "inline-flex h-9 items-center px-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors",
    isDark ? "text-white/78 hover:text-white" : "text-foreground/72 hover:text-foreground",
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur",
        isDark ? "border-white/10 bg-[#070a0f]/88" : "border-black/10 bg-[#f3f1ec]/90",
      )}
    >
      <div className="marketing-container">
        <div className="flex min-h-18 items-center justify-between gap-3 py-2 lg:grid lg:min-h-20 lg:grid-cols-[auto_1fr_auto] lg:gap-x-8">
          <Link
            href="/"
            className="flex shrink-0 items-center justify-self-start rounded-md transition-opacity hover:opacity-90"
            aria-label="PureBin Window Cleaning home"
          >
            <Image
              src={logoSrc}
              alt="PureBin Window Cleaning"
              width={320}
              height={96}
              unoptimized
              className="h-14 w-auto max-h-14 object-contain object-left sm:h-16 sm:max-h-16"
              priority
            />
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 justify-self-stretch lg:flex lg:w-full lg:items-center lg:justify-center">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={navLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2 justify-self-end">
            <a
              href={`tel:${BUSINESS.phone}`}
              className={cn(
                "hidden h-9 items-center whitespace-nowrap px-2 text-sm font-semibold uppercase tracking-[0.16em] transition-colors md:inline-flex",
                isDark ? "text-white/78 hover:text-white" : "text-foreground/72 hover:text-foreground",
              )}
            >
              {BUSINESS.phoneDisplay}
            </a>
            <Button asChild size="default" className="marketing-button-primary hidden h-12 min-h-12 shrink-0 border-0 px-6 shadow-none sm:inline-flex">
              <Link href="/#quote-form">Get a quote</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "size-10 shrink-0 rounded-none lg:hidden",
                isDark ? "border-white/15 bg-white/5 text-white hover:bg-white/10" : "border-black/10 bg-white text-foreground",
              )}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="size-[1.125rem]" /> : <Menu className="size-[1.125rem]" />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div className={cn("border-t pb-3 pt-2 lg:hidden", isDark ? "border-white/10" : "border-black/10")}>
            <nav aria-label="Mobile" className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors",
                    isDark ? "text-white/84 hover:bg-white/6 hover:text-white" : "text-foreground hover:bg-black/4",
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={`tel:${BUSINESS.phone}`}
                className={cn(
                  "px-3 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors",
                  isDark ? "text-white/70 hover:bg-white/6 hover:text-white" : "text-foreground/70 hover:bg-black/4 hover:text-foreground",
                )}
              >
                {BUSINESS.phoneDisplay}
              </a>
              <Button asChild className="marketing-button-primary mt-2 h-12 w-full border-0 shadow-none" onClick={() => setMenuOpen(false)}>
                <Link href="/#quote-form">Get a quote</Link>
              </Button>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
