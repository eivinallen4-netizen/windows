import Link from "next/link";
import { PhoneCall } from "lucide-react";

const footerLinks = [
  { href: "/reviews", label: "Reviews" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/before-after", label: "Before & After" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-white/70 bg-white/72">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:px-8">
        <div>
          <p className="text-xl font-black tracking-tight text-foreground">PureBin LV</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Window cleaning for Las Vegas homeowners who want clear glass, clear pricing, and no hassle.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Explore</p>
          <div className="mt-4 grid gap-2 text-sm text-foreground">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Contact info</p>
          <div className="mt-4 grid gap-2 text-sm text-foreground">
            <a href="tel:+17027726000" className="inline-flex items-center gap-2 hover:text-primary">
              <PhoneCall className="size-4" />
              702 772 6000
            </a>
            <p>Las Vegas, NV</p>
            <p className="pt-2 text-muted-foreground">You don&apos;t pay until you&apos;re 100% satisfied.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
