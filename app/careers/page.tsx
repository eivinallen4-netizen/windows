import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardList, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicStockHeroImage } from "@/components/public-stock-hero-image";
import { Button } from "@/components/ui/button";
import { getPublicPageStockHero } from "@/lib/landing-stock-media";
import { BUSINESS } from "@/lib/marketing-content";
import { readPublicBusinessSnapshot } from "@/lib/public-business.server";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Careers | PureBin Window Cleaning Las Vegas",
  description: "Explore tech, rep, and admin opportunities with PureBin Window Cleaning in Las Vegas.",
  path: "/careers",
  keywords: [
    "window cleaning jobs Las Vegas",
    "Las Vegas window cleaning careers",
    "sales rep jobs Las Vegas",
    "field tech jobs Las Vegas",
  ],
});

const roleCards = [
  {
    title: "Field Techs",
    description: "For reliable technicians who can show up on time, communicate clearly, and deliver clean finishes on residential and commercial glass.",
    icon: ShieldCheck,
  },
  {
    title: "Sales Reps",
    description: "For people who can handle callbacks, explain scope, and keep quoting conversations clear without pressure or sloppy handoffs.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Admin Support",
    description: "For organized operators who can keep schedules, customer follow-up, and internal handoffs moving without dropped details.",
    icon: ClipboardList,
  },
] as const;

export default async function CareersPage() {
  const businessInfo = await readPublicBusinessSnapshot();
  const hero = getPublicPageStockHero("about");

  return (
    <PublicMarketingShell backgroundImageUrl={businessInfo.pageBackdropImageUrl} theme="dark">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Careers", path: "/careers" },
        ])}
      />
      <PublicSiteHeader theme="dark" />
      <main className="marketing-container py-10 sm:py-14 lg:py-18">
        <section className="marketing-panel-dark px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl space-y-5">
            <span className="marketing-kicker">Careers</span>
            <h1 className="marketing-display-lg text-white">Join the team behind clear glass and clear communication</h1>
            <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              We are interested in dependable people for tech, rep, and admin work in Las Vegas. The standard is simple: show up,
              communicate well, and do clean work without shortcuts.
            </p>
            <Button asChild size="lg" className="marketing-button-primary border-0 px-8 text-base">
              <a href={`tel:${BUSINESS.phone}`}>
                Call About Openings
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
          <PublicStockHeroImage {...hero} className="mt-8 max-w-3xl" priority />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {roleCards.map((role) => {
            const Icon = role.icon;

            return (
              <article key={role.title} className="marketing-panel-light px-6 py-7">
                <span className="flex size-11 items-center justify-center bg-[#125bff] text-white">
                  <Icon className="size-4" />
                </span>
                <h2 className="marketing-display-md mt-4 text-slate-950">{role.title}</h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">{role.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="marketing-panel-light px-6 py-7">
            <p className="marketing-kicker">What We Expect</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">Reliable people only</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We care about punctuality, follow-through, respectful communication, and clean presentation on every job. If the work is
              rushed or the handoff is sloppy, customers feel it immediately.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Serving Las Vegas since {businessInfo.servingSinceYear}. {businessInfo.callOnly ? "Call to start the conversation." : ""}
            </p>
          </div>
          <div className="marketing-panel-light px-6 py-7">
            <p className="marketing-kicker">Next Step</p>
            <div className="mt-5 grid gap-3">
              <a href={`tel:${BUSINESS.phone}`} className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:text-primary">
                Call {BUSINESS.phoneDisplay} and ask about current openings
              </a>
              <Link href="/about" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:text-primary">
                Learn more about the company
              </Link>
              <Link href="/" className="rounded-[1.4rem] border border-border bg-background px-4 py-4 text-base font-semibold text-foreground transition hover:text-primary">
                Back to the main site
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter businessInfo={businessInfo} theme="dark" />
    </PublicMarketingShell>
  );
}
