import Link from "next/link";
import { ExternalLink, PhoneCall } from "lucide-react";
import { BUSINESS } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/reviews", label: "Reviews" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/before-after", label: "Before & After" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

const teamLinks = [
  { href: "/tech", label: "Tech" },
  { href: "/admin", label: "Admin" },
  { href: "/rep", label: "Rep" },
  { href: "/careers", label: "Careers" },
];

const footerServiceLinks = [
  { href: "/services/residential-window-cleaning", label: "Home Window Cleaning" },
  { href: "/services/commercial-window-cleaning", label: "Storefront Cleaning" },
  { href: "/services", label: "Interior & Exterior Glass" },
  { href: "/services", label: "Tracks & Screens" },
];

type PublicSiteFooterProps = {
  theme?: "dark" | "light";
  businessInfo?: {
    shortName: string;
    phone: string;
    phoneDisplay: string;
    primaryLocation: string;
    serviceAreas: readonly string[];
    servingSinceYear: number;
    callOnly: boolean;
    serviceAreaBusiness: boolean;
    licenseStatusPublic: boolean;
    insuredPublic: boolean;
    publishedHoursSummary: readonly string[];
    sameAs: readonly string[];
  };
};

export function PublicSiteFooter({ theme = "dark", businessInfo }: PublicSiteFooterProps) {
  const resolved = businessInfo ?? {
    shortName: BUSINESS.shortName,
    phone: BUSINESS.phone,
    phoneDisplay: BUSINESS.phoneDisplay,
    primaryLocation: BUSINESS.primaryLocation,
    serviceAreas: [...BUSINESS.serviceAreas],
    servingSinceYear: 2022,
    callOnly: true,
    serviceAreaBusiness: true,
    licenseStatusPublic: true,
    insuredPublic: false,
    publishedHoursSummary: ["Mon-Sun: 1:00 PM - 9:00 PM"],
    sameAs: [],
  };
  const isDark = theme === "dark";
  const muted = isDark ? "text-white/58" : "text-muted-foreground";
  const linkTone = isDark ? "text-white/82 hover:text-white" : "text-foreground hover:text-primary";
  const labelTone = isDark ? "text-[#125bff]" : "text-primary";

  return (
    <footer className={cn("border-t", isDark ? "border-white/10 bg-[#0a0b0e]" : "border-black/10 bg-white")}>
      <div className="marketing-container grid gap-10 py-14 lg:grid-cols-[1.15fr_0.8fr_0.95fr_0.75fr_1fr]">
        <div>
          <p className={cn("marketing-display text-[2rem]", isDark ? "text-white" : "text-foreground")}>{resolved.shortName}</p>
          <p className={cn("mt-4 max-w-sm text-sm leading-7", muted)}>
            Professional window cleaning in Las Vegas. Fast quotes. Clear pricing. Streak-free results.
          </p>
          <p className={cn("mt-3 max-w-sm text-sm leading-7", muted)}>
            Serving {resolved.serviceAreas.join(", ")} since {resolved.servingSinceYear}.
          </p>
          {resolved.serviceAreaBusiness ? (
            <p className={cn("mt-3 max-w-sm text-sm leading-7", muted)}>Service-area business. No storefront at this time.</p>
          ) : null}
        </div>

        <div>
          <p className={cn("marketing-kicker", labelTone)}>Explore</p>
          <div className="mt-5 grid gap-2 text-sm">
            {footerLinks.map((link, key) => (
              <Link key={key} href={link.href} className={cn("transition", linkTone)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className={cn("marketing-kicker", labelTone)}>Services</p>
          <div className="mt-5 grid gap-2 text-sm">
            {footerServiceLinks.map((link, key) => (
              <Link key={key} href={link.href} className={cn("transition", linkTone)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className={cn("marketing-kicker", labelTone)}>Team</p>
          <div className="mt-5 grid gap-2 text-sm">
            {teamLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn("transition", linkTone)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className={cn("marketing-kicker", labelTone)}>Contact</p>
          <div className="mt-5 grid gap-2 text-sm">
            <a href={`tel:${resolved.phone}`} className={cn("inline-flex items-center gap-2 transition", linkTone)}>
              <PhoneCall className="size-4" />
              {resolved.phoneDisplay}
            </a>
            <p className={isDark ? "text-white/82" : "text-foreground"}>Call or text for a fast quote</p>
            <p className={muted}>Serving Las Vegas &amp; nearby areas</p>
            <p className={cn("text-sm", muted)}>{resolved.primaryLocation}</p>
            {resolved.callOnly ? <p className={muted}>No storefront right now. Quotes start by phone or text.</p> : null}
            {resolved.licenseStatusPublic ? (
              <p className={muted}>{resolved.insuredPublic ? "Licensed and insured business." : "Licensed business."}</p>
            ) : null}
            {resolved.publishedHoursSummary.map((line) => (
              <p key={line} className={muted}>
                {line}
              </p>
            ))}
            {resolved.sameAs.length ? (
              <div className="flex flex-col gap-2 pt-2">
                {resolved.sameAs.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-2 transition", linkTone)}>
                    <ExternalLink className="size-4" />
                    {link.includes("instagram.com") ? "Instagram" : "Profile"}
                  </a>
                ))}
              </div>
            ) : null}
            <p className={cn("pt-2", muted)}>You don&apos;t pay until you&apos;re 100% satisfied.</p>
          </div>
        </div>
      </div>
      <div className={cn("marketing-container border-t py-5 text-center text-xs", isDark ? "border-white/10 text-white/38" : "border-black/10 text-foreground/45")}>
        &copy; 2026 {BUSINESS.name}. All rights reserved.
      </div>
    </footer>
  );
}
