import Link from "next/link";
import { ExternalLink, PhoneCall } from "lucide-react";
import { BUSINESS, SERVICE_AREA_LINKS, SERVICE_LINKS } from "@/lib/marketing-content";

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

type PublicSiteFooterProps = {
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

export function PublicSiteFooter({ businessInfo }: PublicSiteFooterProps) {
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

  return (
    <footer className="border-t border-white/70 bg-white/72">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1fr] lg:px-8">
        <div>
          <p className="text-xl font-black tracking-tight text-foreground">{resolved.shortName}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Window cleaning for Las Vegas homeowners, storefronts, and commercial properties that want clear glass, clear pricing, and no hassle.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Serving {resolved.serviceAreas.join(", ")} since {resolved.servingSinceYear}.
          </p>
          {resolved.serviceAreaBusiness ? (
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Service-area business. No storefront at this time.</p>
          ) : null}
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
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Services</p>
          <div className="mt-4 grid gap-2 text-sm text-foreground">
            {SERVICE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-primary">
                {link.label}
              </Link>
            ))}
            {SERVICE_AREA_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Contact info</p>
          <div className="mt-4 grid gap-2 text-sm text-foreground">
            <a href={`tel:${resolved.phone}`} className="inline-flex items-center gap-2 hover:text-primary">
              <PhoneCall className="size-4" />
              {resolved.phoneDisplay}
            </a>
            <p>{resolved.primaryLocation}</p>
            {resolved.callOnly ? <p className="text-muted-foreground">Call to book. We do not have a storefront right now.</p> : null}
            {resolved.licenseStatusPublic ? (
              <p className="text-muted-foreground">
                {resolved.insuredPublic ? "Licensed and insured business." : "Licensed business."}
              </p>
            ) : null}
            {resolved.publishedHoursSummary.map((line) => (
              <p key={line} className="text-muted-foreground">{line}</p>
            ))}
            {resolved.sameAs.length ? (
              <div className="flex flex-col gap-2 pt-2">
                {resolved.sameAs.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                    <ExternalLink className="size-4" />
                    {link.includes("instagram.com") ? "Instagram" : "Profile"}
                  </a>
                ))}
              </div>
            ) : null}
            <p className="pt-2 text-muted-foreground">You don&apos;t pay until you&apos;re 100% satisfied.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
