"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BUSINESS } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/service-areas/las-vegas", label: "Las Vegas" },
  { href: "/reviews", label: "Reviews" },
  { href: "/before-after", label: "Before/After" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

const navLinkClass =
  "inline-flex h-9 items-center rounded-md px-3 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground";

export function PublicSiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-background/88 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex min-h-16 items-center justify-between gap-3 py-1.5 lg:grid lg:min-h-16 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-x-8 lg:gap-y-0 lg:py-2">
          <Link
            href="/"
            className="flex shrink-0 items-center justify-self-start rounded-md transition-opacity hover:opacity-90"
            aria-label="PureBin Window Cleaning — home"
          >
            <Image
              src="/logo.png"
              alt="PureBin Window Cleaning"
              width={320}
              height={96}
              unoptimized
              className="h-16 w-auto max-h-16 object-contain object-left sm:h-[4.5rem] sm:max-h-[4.5rem]"
              priority
            />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden min-w-0 justify-self-stretch lg:flex lg:w-full lg:items-center lg:justify-center"
          >
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
              className="hidden h-9 items-center whitespace-nowrap rounded-md px-2 text-[13px] font-normal leading-none text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground md:inline-flex"
            >
              {BUSINESS.phoneDisplay}
            </a>
            <Button
              asChild
              size="default"
              className="hidden h-11 min-h-11 shrink-0 rounded-full border-0 bg-primary px-7 text-sm font-bold text-primary-foreground shadow-md transition-[box-shadow] hover:bg-primary hover:shadow-lg sm:inline-flex"
            >
              <Link href="/#quote-form">Get a quote</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0 rounded-md border-border/80 lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="size-[1.125rem]" /> : <Menu className="size-[1.125rem]" />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/70 pb-3 pt-2 lg:hidden">
            <nav aria-label="Mobile" className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-normal text-foreground transition-colors hover:bg-muted/50"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={`tel:${BUSINESS.phone}`}
                className="rounded-lg px-3 py-2.5 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {BUSINESS.phoneDisplay}
              </a>
              <Button
                asChild
                className="mt-2 h-11 w-full rounded-full border-0 bg-primary text-sm font-bold text-primary-foreground shadow-md"
                onClick={() => setMenuOpen(false)}
              >
                <Link href="/#quote-form">Get a quote</Link>
              </Button>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
