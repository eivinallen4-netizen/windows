import type { MetadataRoute } from "next";
import { SERVICE_AREA_PAGES, SERVICE_PAGES } from "@/lib/marketing-content";
import { buildAbsoluteUrl } from "@/lib/seo";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/before-after", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/customer-quote", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/reviews", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/service-areas", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: buildAbsoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...SERVICE_PAGES.map((service) => ({
      url: buildAbsoluteUrl(`/services/${service.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...SERVICE_AREA_PAGES.map((area) => ({
      url: buildAbsoluteUrl(`/service-areas/${area.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
