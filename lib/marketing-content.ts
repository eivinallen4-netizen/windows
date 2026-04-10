export const BUSINESS = {
  name: "PureBin Window Cleaning",
  shortName: "PureBin LV",
  phone: "+17027726000",
  phoneDisplay: "(702) 772-6000",
  city: "Las Vegas",
  state: "NV",
  country: "US",
  primaryLocation: "Las Vegas, NV",
  description:
    "Window cleaning in Las Vegas with clear pricing, before-and-after proof, and final approval before payment.",
  quotePath: "/#quote-form",
  serviceAreas: [
    "Las Vegas",
    "Summerlin",
    "Henderson",
    "Green Valley",
    "Centennial Hills",
    "Southern Highlands",
    "Spring Valley",
    "Enterprise",
    "Skye Canyon",
  ],
  sameAs: [] as string[],
} as const;

export const PRIMARY_KEYWORDS = [
  "window cleaning Las Vegas",
  "Las Vegas window cleaning",
  "residential window cleaning Las Vegas",
  "commercial window cleaning Las Vegas",
  "high-rise window cleaning Las Vegas",
  "storefront window cleaning Las Vegas",
  "glass cleaning Las Vegas",
  "exterior window washing Las Vegas",
];

export const TRUST_POINTS = [
  "Final approval before payment",
  "Before-and-after proof from real jobs",
  "Local callback and quote-first scheduling",
  "Screens, frames, tracks, sills, and glass cleaned",
];

export const CORE_FAQS = [
  {
    question: "Do I have to be home for window cleaning?",
    answer:
      "Not always. If we have the access we need and the scope is confirmed ahead of time, many exterior jobs can be completed without you on site. Interior work or gated access may require someone available for entry.",
  },
  {
    question: "What is included in a standard window cleaning service?",
    answer:
      "Your quote can include exterior glass cleaning, interior glass cleaning, screen cleaning, frame wipe-downs, track cleaning, and sill detailing. We confirm the exact scope before anything is scheduled so you know what is included.",
  },
  {
    question: "How much does window cleaning cost in Las Vegas?",
    answer:
      "Pricing depends on pane count, access, window type, interior versus exterior scope, and any add-ons like track cleaning or hard water treatment. The site is built around quote-first pricing, so the exact number is confirmed before the job moves forward.",
  },
  {
    question: "Do you clean residential and commercial windows?",
    answer:
      "Yes. The site supports residential quotes and also highlights commercial window cleaning for storefronts, offices, and other properties that need consistent glass care in the Las Vegas valley.",
  },
  {
    question: "Can you help with hard water spots and desert dust buildup?",
    answer:
      "Las Vegas glass collects dust, pollen, and mineral spotting fast. Cleaning plans can include detail work for tracks, sills, and visible buildup, and harder water-spot jobs can be reviewed during the quote process so the scope is clear upfront.",
  },
  {
    question: "How fast can I get a quote?",
    answer:
      "The homepage form is designed for a fast callback. Once the home or property details are reviewed, the team can confirm pricing and the next scheduling step.",
  },
  {
    question: "Do you clean storefronts, multi-story buildings, or high-rise glass?",
    answer:
      "Storefront and commercial glass cleaning are supported directly. For multi-story, high-rise, or difficult-access glass, the next step is a scope review so access, safety requirements, and fit can be confirmed before scheduling.",
  },
  {
    question: "What service areas do you cover?",
    answer:
      "The public site focuses on Las Vegas and nearby areas including Summerlin, Henderson, Green Valley, Centennial Hills, Southern Highlands, Spring Valley, Enterprise, and Skye Canyon.",
  },
] as const;

export const SERVICE_PAGES = [
  {
    slug: "residential-window-cleaning",
    shortLabel: "Residential",
    navLabel: "Residential Window Cleaning",
    title: "Residential Window Cleaning Las Vegas",
    description:
      "Residential window cleaning in Las Vegas with streak-free glass, screen cleaning, track detailing, and quote-first scheduling.",
    intro:
      "Homes in Las Vegas collect dust, pollen, hard water spotting, and desert grime fast. This page gives homeowners a clear path to cleaner glass without surprise pricing or vague service scopes.",
    summary:
      "From one-story homes to larger custom properties, residential window cleaning is positioned around clear communication, visible detail work, and a final walkthrough before payment.",
    keywords: [
      "residential window cleaning Las Vegas",
      "house window washing Las Vegas",
      "exterior window washing Las Vegas",
      "glass cleaning Las Vegas homes",
    ],
    highlights: [
      "Exterior and interior window cleaning",
      "Screen, frame, track, and sill detailing",
      "Single-story, two-story, condo, and custom-home quoting",
      "Fast quote requests for Las Vegas homeowners",
    ],
    sections: [
      {
        heading: "Exterior window washing built for Las Vegas homes",
        paragraphs: [
          "Desert wind, hard water, and long sun exposure make exterior glass look dull faster in the valley. Residential service copy should speak directly to those local issues instead of using generic window-cleaning language.",
          "That local framing helps the page rank for window cleaning Las Vegas while also making the value proposition clearer for homeowners comparing options.",
        ],
      },
      {
        heading: "What homeowners expect from a full-service glass cleaning visit",
        paragraphs: [
          "The strongest converting pages do not stop at glass-only language. They explain that screens, frames, tracks, sills, and visible edges matter because homeowners judge the final result as a full-window finish.",
          "This site already has that strength on the homepage, so the residential page reinforces it and turns it into crawlable service content.",
        ],
      },
      {
        heading: "Property types and quote factors",
        paragraphs: [
          "Residential quotes should naturally reference single-story homes, two-story homes, condos, townhomes, and custom properties. That helps match local search variations while setting expectations for scope.",
          "Pane count, access, specialty windows, interior versus exterior work, and add-ons like track cleaning or hard water treatment all belong on the page because they answer pricing questions before a lead ever calls.",
        ],
      },
    ],
    faq: CORE_FAQS.slice(0, 5),
  },
  {
    slug: "commercial-window-cleaning",
    shortLabel: "Commercial",
    navLabel: "Commercial Window Cleaning",
    title: "Commercial Window Cleaning Las Vegas",
    description:
      "Commercial window cleaning in Las Vegas for offices, storefronts, retail spaces, and managed properties that need clean glass and a dependable service process.",
    intro:
      "Commercial properties need clean glass for curb appeal, tenant perception, and day-to-day presentation. This page gives businesses a more specific target than the generic homepage alone.",
    summary:
      "The content is written to support commercial window cleaning, storefront window cleaning, glass cleaning, and exterior window washing searches in Las Vegas without sounding stuffed.",
    keywords: [
      "commercial window cleaning Las Vegas",
      "storefront window cleaning Las Vegas",
      "office window cleaning Las Vegas",
      "glass cleaning Las Vegas businesses",
    ],
    highlights: [
      "Storefront and office glass cleaning",
      "Recurring service conversations for commercial properties",
      "Quote-first process for property managers and business owners",
      "Supportive copy for retail, restaurant, office, and mixed-use properties",
    ],
    sections: [
      {
        heading: "Storefront window cleaning that protects first impressions",
        paragraphs: [
          "Las Vegas storefront glass picks up traffic film, fingerprints, dust, and hard water much faster than residential windows. That makes storefront-specific copy useful both for rankings and for conversions.",
          "Commercial visitors want to know the service is dependable and presentation-focused, not just affordable. This page leans into that buying motive.",
        ],
      },
      {
        heading: "Commercial glass cleaning for offices, retail, and managed properties",
        paragraphs: [
          "A strong commercial page should name property types naturally: offices, retail centers, restaurants, storefronts, property-management accounts, and mixed-use buildings.",
          "The current site now gives those use cases their own crawlable content instead of forcing every query back to the homepage.",
        ],
      },
      {
        heading: "Larger hospitality and specialty properties",
        paragraphs: [
          "Las Vegas commercial search behavior often overlaps with hospitality, resort, and casino window cleaning searches. Because capability can vary by access and safety requirements, the page references those property types carefully and routes them into a scope review instead of making broad unsupported claims.",
          "That approach captures intent while staying accurate.",
        ],
      },
    ],
    faq: [
      CORE_FAQS[2],
      CORE_FAQS[3],
      CORE_FAQS[6],
      {
        question: "Can I request recurring storefront or office service?",
        answer:
          "Yes. Commercial pages should invite conversations around recurring glass cleaning because many businesses want dependable upkeep rather than a one-time visit.",
      },
      {
        question: "Do you handle larger commercial properties in Las Vegas?",
        answer:
          "Larger properties can be reviewed during quoting so the team can confirm access, timeline, scope, and whether the property fits the current service model.",
      },
    ],
  },
  {
    slug: "high-rise-window-cleaning",
    shortLabel: "High-Rise",
    navLabel: "High-Rise Window Cleaning",
    title: "High-Rise Window Cleaning Las Vegas",
    description:
      "High-rise window cleaning in Las Vegas for multi-story and difficult-access glass, starting with a scope review to confirm safety, access, and fit.",
    intro:
      "High-rise and difficult-access glass searches are valuable in Las Vegas, but they require careful copy. This page targets that demand without overstating capabilities that have not been confirmed.",
    summary:
      "Instead of claiming every tower or casino account outright, the page positions high-rise requests around a scope review, access planning, and property-fit confirmation.",
    keywords: [
      "high-rise window cleaning Las Vegas",
      "casino window cleaning Las Vegas",
      "difficult access glass cleaning Las Vegas",
      "multi-story window cleaning Las Vegas",
    ],
    highlights: [
      "Multi-story and difficult-access quote reviews",
      "Clear language around safety and property-fit confirmation",
      "Hospitality, resort, and casino-adjacent search coverage without false claims",
      "Strong internal support for high-rise keyword variations",
    ],
    sections: [
      {
        heading: "Start with access, safety, and scope",
        paragraphs: [
          "High-rise window cleaning is a different buying decision from a standard residential job. Searchers want to know whether a company can review access conditions, height, site logistics, and safety requirements before committing to a date.",
          "The page now reflects that decision path so it can rank for high-rise intent without sounding like a generic residential service page with a swapped headline.",
        ],
      },
      {
        heading: "Las Vegas hospitality, resort, and casino glass needs",
        paragraphs: [
          "Search demand in Las Vegas includes casino window cleaning and other hospitality-related phrases. Because those properties vary widely, the most accurate approach is to invite a scope review for hotels, resorts, casino-adjacent properties, and other large facilities.",
          "That captures local-commercial relevance while keeping the site factually safe.",
        ],
      },
      {
        heading: "When this page should convert",
        paragraphs: [
          "This page is built to convert property managers, facilities teams, and business owners who need a real answer on fit. The call to action is intentionally quote-focused instead of promising instant scheduling for every high-access property.",
          "That is the right trust posture when building commercial SEO around a service with more operational requirements.",
        ],
      },
    ],
    faq: [
      CORE_FAQS[6],
      {
        question: "Do you clean casino or resort windows in Las Vegas?",
        answer:
          "Use the quote request to describe the property and access conditions. Hospitality and casino-related projects should be reviewed individually so the team can confirm scope, safety needs, and whether the property is a fit before scheduling.",
      },
      {
        question: "What information should I send for a high-rise quote?",
        answer:
          "Include the property address, number of stories, glass access details, and whether you need exterior-only or inside-and-out work. That helps the team review the request faster.",
      },
      CORE_FAQS[2],
    ],
  },
] as const;

export const SERVICE_AREA_PAGES = [
  {
    slug: "las-vegas",
    title: "Window Cleaning Las Vegas, NV",
    description:
      "Window cleaning in Las Vegas, NV for homes, storefronts, and commercial properties with clear quotes, review-backed proof, and local service-area relevance.",
    keywords: [
      "window cleaning Las Vegas",
      "Las Vegas window washing",
      "glass cleaning Las Vegas",
      "exterior window washing Las Vegas",
    ],
    intro:
      "Las Vegas is the core market for the site, so this page supports the homepage with a dedicated local landing page built around service intent, neighborhood relevance, and conversion-focused content.",
    neighborhoods: [
      "Summerlin",
      "Centennial Hills",
      "Spring Valley",
      "Southern Highlands",
      "Enterprise",
      "Skye Canyon",
      "Green Valley",
      "Henderson",
    ],
    sections: [
      {
        heading: "Why Las Vegas windows need regular cleaning",
        paragraphs: [
          "Between hard water, desert dust, traffic film, and year-round sun, glass in Las Vegas loses clarity quickly. Local copy should say that directly because it is the reason many homeowners and businesses start searching in the first place.",
          "This page now gives Google a dedicated local URL that explains those conditions in natural language.",
        ],
      },
      {
        heading: "Residential, storefront, and commercial service coverage",
        paragraphs: [
          "A top local landing page should not feel like a city-name swap. It needs to connect the market to the available services: residential window cleaning, commercial window cleaning, storefront glass cleaning, and difficult-access quote reviews.",
          "That broader service framing helps this page support the full keyword cluster instead of only one exact match term.",
        ],
      },
      {
        heading: "Neighborhood relevance without doorway-page spam",
        paragraphs: [
          "The page references real Las Vegas valley neighborhoods already used elsewhere on the site so the local signal stays consistent: Summerlin, Centennial Hills, Spring Valley, Southern Highlands, Enterprise, Skye Canyon, Green Valley, and Henderson.",
          "That is enough to strengthen local relevance without publishing thin copy-spun city pages.",
        ],
      },
    ],
    faq: [CORE_FAQS[0], CORE_FAQS[2], CORE_FAQS[4], CORE_FAQS[7]],
  },
] as const;

export const SERVICE_LINKS = SERVICE_PAGES.map((service) => ({
  href: `/services/${service.slug}`,
  label: service.navLabel,
  shortLabel: service.shortLabel,
}));

export const SERVICE_AREA_LINKS = SERVICE_AREA_PAGES.map((area) => ({
  href: `/service-areas/${area.slug}`,
  label: area.title,
}));
