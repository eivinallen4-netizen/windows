import type { Metadata } from "next";
import { BUSINESS, PRIMARY_KEYWORDS } from "@/lib/marketing-content";
import { buildOpeningHoursSpecification, type PublicBusinessConfig } from "@/lib/public-business";
import type { Review } from "@/lib/reviews";

export function getMetadataBase() {
  const configuredUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const siteUrl =
    configuredUrl && !configuredUrl.includes("localhost")
      ? configuredUrl
      : vercelUrl
        ? `https://${vercelUrl.replace(/^https?:\/\//, "")}`
        : "http://localhost:3000";

  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function buildAbsoluteUrl(pathname = "/") {
  return new URL(pathname, getMetadataBase()).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export function buildPageMetadata({ title, description, path = "/", keywords = [] }: PageMetadataInput): Metadata {
  const canonical = buildAbsoluteUrl(path);

  return {
    title,
    description,
    keywords: [...PRIMARY_KEYWORDS, ...keywords],
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: BUSINESS.name,
      locale: "en_US",
      images: [
        {
          url: buildAbsoluteUrl("/logo.png"),
          alt: `${BUSINESS.name} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [buildAbsoluteUrl("/logo.png")],
    },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

export function buildFAQSchema(items: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function buildAggregateRating(reviews: Review[]) {
  if (!reviews.length) return undefined;

  const ratingValue = Number(
    (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1),
  );

  return {
    "@type": "AggregateRating",
    ratingValue,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}

function buildReviewSchemaItems(reviews: Review[]) {
  return reviews
    .filter((review) => review.testimonial)
    .slice(0, 3)
    .map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
      },
      author: {
        "@type": "Person",
        name: review.name,
      },
      reviewBody: review.testimonial,
      datePublished: review.createdAt,
    }));
}

type SchemaBusiness = Pick<PublicBusinessConfig, "publishedHours" | "sameAsLinks" | "gbpUrl"> & {
  name?: string;
  shortName?: string;
  description?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  primaryLocation?: string;
  serviceAreas?: readonly string[];
};

export function buildLocalBusinessSchema(reviews: Review[] = [], business?: SchemaBusiness) {
  const aggregateRating = buildAggregateRating(reviews);
  const reviewItems = buildReviewSchemaItems(reviews);
  const resolvedBusiness = {
    name: business?.name ?? BUSINESS.name,
    shortName: business?.shortName ?? BUSINESS.shortName,
    description: business?.description ?? BUSINESS.description,
    phone: business?.phone ?? BUSINESS.phone,
    city: business?.city ?? BUSINESS.city,
    state: business?.state ?? BUSINESS.state,
    country: business?.country ?? BUSINESS.country,
    primaryLocation: business?.primaryLocation ?? BUSINESS.primaryLocation,
    serviceAreas: business?.serviceAreas ?? BUSINESS.serviceAreas,
    publishedHours: business?.publishedHours,
    sameAsLinks: business?.sameAsLinks ?? [],
    gbpUrl: business?.gbpUrl ?? "",
  };
  const sameAs = [resolvedBusiness.gbpUrl, ...resolvedBusiness.sameAsLinks].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${buildAbsoluteUrl("/")}#business`,
    name: resolvedBusiness.name,
    alternateName: resolvedBusiness.shortName,
    url: buildAbsoluteUrl("/"),
    image: buildAbsoluteUrl("/logo.png"),
    description: resolvedBusiness.description,
    telephone: resolvedBusiness.phone,
    areaServed: resolvedBusiness.serviceAreas.map((area) => ({
      "@type": "City",
      name: area,
    })),
    address: {
      "@type": "PostalAddress",
      addressLocality: resolvedBusiness.city,
      addressRegion: resolvedBusiness.state,
      addressCountry: resolvedBusiness.country,
    },
    priceRange: "$$",
    sameAs: sameAs.length ? sameAs : undefined,
    openingHoursSpecification: resolvedBusiness.publishedHours
      ? buildOpeningHoursSpecification(resolvedBusiness.publishedHours)
      : undefined,
    serviceType: [
      "Window cleaning",
      "Residential window cleaning",
      "Commercial window cleaning",
      "Storefront window cleaning",
      "Exterior window washing",
      "Glass cleaning",
    ],
    aggregateRating,
    review: reviewItems.length ? reviewItems : undefined,
  };
}

export function buildServiceSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name,
    description,
    areaServed: BUSINESS.serviceAreas.map((area) => ({
      "@type": "City",
      name: area,
    })),
    provider: {
      "@type": "LocalBusiness",
      name: BUSINESS.name,
      telephone: BUSINESS.phone,
      areaServed: BUSINESS.primaryLocation,
      url: buildAbsoluteUrl("/"),
    },
    url: buildAbsoluteUrl(path),
  };
}
