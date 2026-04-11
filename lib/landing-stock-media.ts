/**
 * Default landing-page imagery (Unsplash). Swap anytime, or override with Admin → Business → Site imagery.
 * License: https://unsplash.com/license
 */
export const LANDING_HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80";

export const LANDING_FORM_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf1592?auto=format&fit=crop&w=1200&q=80";

/** Matches the three “What’s included” cards in order. */
export const LANDING_INCLUDED_IMAGES = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
] as const;

export const LANDING_SERVICE_IMAGES: Record<string, string> = {
  "residential-window-cleaning":
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80",
  "commercial-window-cleaning":
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  "high-rise-window-cleaning":
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1000&q=80",
};

export const LANDING_GALLERY_STRIP = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600585152914-d0bec854a102?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80",
] as const;

export const LANDING_ACCENT_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1600607687644-c7171b424998?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=1400&q=80",
] as const;

export function landingServiceImageForSlug(slug: string): string {
  return LANDING_SERVICE_IMAGES[slug] ?? LANDING_HERO_IMAGE;
}

/** Hero photo + alt text for public marketing pages (not admin). */
export const PUBLIC_PAGE_STOCK_HERO = {
  about: {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    alt: "Professionals planning reliable service together",
  },
  faq: {
    src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80",
    alt: "Cleaning tools and supplies for spotless glass",
  },
  pricing: {
    src: "https://images.unsplash.com/photo-1600047509358-9dc950cc20bb?auto=format&fit=crop&w=1600&q=80",
    alt: "Modern Las Vegas area home with clear windows",
  },
  services: {
    src: LANDING_HERO_IMAGE,
    alt: "Bright home exterior with clean windows",
  },
  howItWorks: {
    src: "https://images.unsplash.com/photo-1600880292083-8cea1a974ea7?auto=format&fit=crop&w=1600&q=80",
    alt: "Team coordinating a clear step-by-step service",
  },
  serviceAreas: {
    src: "https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=1600&q=80",
    alt: "Las Vegas valley skyline at dusk",
  },
  serviceAreaLocal: {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    alt: "Comfortable Las Vegas valley home interior with natural light",
  },
  reviews: {
    src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80",
    alt: "Sunlit living space with bright windows",
  },
  beforeAfter: {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
    alt: "Home with polished windows and curb appeal",
  },
} as const;

export type PublicPageStockHeroKey = keyof typeof PUBLIC_PAGE_STOCK_HERO;

export function getPublicPageStockHero(key: PublicPageStockHeroKey) {
  return PUBLIC_PAGE_STOCK_HERO[key];
}

/** Small banner for service-area hub cards. */
export const PUBLIC_SERVICE_AREA_HUB_CARD_IMAGE =
  "https://images.unsplash.com/photo-1596436889106-eb8a0a0ae4a1?auto=format&fit=crop&w=1000&q=80";
