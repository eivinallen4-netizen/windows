import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CommercialProofItem } from "@/lib/commercial-proof";

type CommercialProofSectionProps = {
  enabled: boolean;
  items: CommercialProofItem[];
};

export function CommercialProofSection({ enabled, items }: CommercialProofSectionProps) {
  if (!enabled || items.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 rounded-[2rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.28)]">
      <div className="max-w-3xl space-y-3">
        <p className="app-kicker">Commercial Proof</p>
        <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Real commercial examples and job summaries
        </h2>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-[1.6rem] border border-border bg-background px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{item.propertyType}</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Scope:</strong> {item.scope}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Challenge:</strong> {item.challenge}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Result:</strong> {item.result}
            </p>
            {item.ctaLabel && item.ctaHref ? (
              <Link href={item.ctaHref} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {item.ctaLabel}
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
