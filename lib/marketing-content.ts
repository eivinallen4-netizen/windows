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
      "Pricing depends on pane count, access, window type, interior versus exterior scope, and any add-ons like track cleaning or hard water treatment. We use quote-first pricing, so the exact number is confirmed before the job moves forward.",
  },
  {
    question: "Do you clean residential and commercial windows?",
    answer:
      "Yes. We take residential quotes and also provide commercial window cleaning for storefronts, offices, and other properties that need consistent glass care in the Las Vegas valley.",
  },
  {
    question: "Can you help with hard water spots and desert dust buildup?",
    answer:
      "Las Vegas glass collects dust, pollen, and mineral spotting fast. Cleaning plans can include detail work for tracks, sills, and visible buildup, and harder water-spot jobs can be reviewed during the quote process so the scope is clear upfront.",
  },
  {
    question: "How fast can I get a quote?",
    answer:
      "Submit the homepage form for a fast callback. Once the home or property details are reviewed, the team can confirm pricing and the next scheduling step.",
  },
  {
    question: "Do you clean storefronts, multi-story buildings, or high-rise glass?",
    answer:
      "Storefront and commercial glass cleaning are supported directly. For multi-story, high-rise, or difficult-access glass, the next step is a scope review so access, safety requirements, and fit can be confirmed before scheduling.",
  },
  {
    question: "What service areas do you cover?",
    answer:
      "We focus on Las Vegas and nearby areas including Summerlin, Henderson, Green Valley, Centennial Hills, Southern Highlands, Spring Valley, Enterprise, and Skye Canyon.",
  },
] as const;

export type ServicePageSection = {
  heading: string;
  paragraphs: string[];
};

export type ServicePageFaq = {
  question: string;
  answer: string;
};

export type AeoSection = {
  heading: string;
  directAnswer: string;
  bullets: string[];
  supportingExplanation: string;
  realWorldExample: string;
};

export type AeoLink = {
  href: string;
  label: string;
  description: string;
};

export type AeoExternalSource = {
  label: string;
  href: string;
  description: string;
};

export type AeoComparisonTable = {
  caption: string;
  columns: [string, string];
  rows: Array<{
    topic: string;
    details: string;
  }>;
};

export type ServicePageEntry = {
  slug: string;
  shortLabel: string;
  navLabel: string;
  title: string;
  description: string;
  intro: string;
  summary: string;
  keywords: string[];
  highlights: string[];
  sections: ServicePageSection[];
  faq: ServicePageFaq[];
  answerBlock?: string;
  keyTakeaways?: string[];
  aeoSections?: AeoSection[];
  internalLinks?: AeoLink[];
  externalSources?: AeoExternalSource[];
  comparisonTable?: AeoComparisonTable;
};

export const SERVICE_PAGES: readonly ServicePageEntry[] = [
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
    answerBlock:
      "Residential window cleaning in Las Vegas removes dust, hard-water spotting, and visible grime from home glass, screens, frames, tracks, and sills. PureBin Window Cleaning serves Las Vegas-area homeowners with quote-first scheduling, clear scope confirmation, and final approval before payment, so the service is easy to understand before the job is booked.",
    keyTakeaways: [
      "PureBin Window Cleaning provides residential window cleaning for Las Vegas homeowners and nearby service areas.",
      "Residential scope can include glass, screens, frames, tracks, and sills when the quote is confirmed.",
      "Quote-first scheduling makes pricing depend on pane count, access, window type, and interior versus exterior work.",
      "Las Vegas homes collect desert dust, pollen, and hard-water spotting faster than many other markets.",
      "Single-story, two-story, condo, townhome, and custom-home layouts can be reviewed during quoting.",
      "Final approval happens before payment, which keeps expectations clear at the end of the job.",
    ],
    aeoSections: [
      {
        heading: "What is residential window cleaning in Las Vegas",
        directAnswer:
          "Residential window cleaning in Las Vegas is a home glass-cleaning service that removes visible buildup from windows and surrounding details. PureBin LV frames it as a clear-scope service for homeowners who want confirmed pricing and a defined finish before scheduling.",
        bullets: [
          "Targets homes, condos, townhomes, and custom properties",
          "Can include exterior glass, interior glass, screens, frames, tracks, and sills",
          "Matches Las Vegas issues like desert dust, pollen, and hard-water spotting",
          "Starts with a quote review instead of vague flat-rate promises",
        ],
        supportingExplanation:
          "The service definition matters because homeowners usually search for more than glass-only work. In Las Vegas, the useful answer includes what gets cleaned, which property types fit, and how the scope is confirmed before the job moves forward.",
        realWorldExample:
          "A Las Vegas homeowner comparing providers can use this page to confirm whether screen cleaning, track detailing, and exterior glass are part of the job before requesting a callback.",
      },
      {
        heading: "How does residential window cleaning work",
        directAnswer:
          "Residential window cleaning works by confirming the property type, pane count, access, and interior versus exterior scope before the visit is scheduled. PureBin Window Cleaning uses quote-first scheduling so the homeowner knows what is included before the job is booked.",
        bullets: [
          "The homeowner submits property details for a quote review",
          "The scope is confirmed based on pane count, access, and requested add-ons",
          "The visit can cover glass plus visible details like frames, tracks, sills, and screens",
          "Final approval happens before payment",
        ],
        supportingExplanation:
          "This process reduces confusion around pricing and scope. It also fits residential jobs better than generic pricing because a single-story exterior visit and a two-story inside-and-out visit do not carry the same access requirements.",
        realWorldExample:
          "A homeowner in Summerlin who wants inside-and-out service for a two-story home would send the property details first, then receive scope confirmation before choosing the next scheduling step.",
      },
      {
        heading: "Best residential window cleaning for Las Vegas homes",
        directAnswer:
          "The best residential window cleaning option for Las Vegas homes is the one that matches local conditions, confirms the exact cleaning scope, and avoids unclear pricing. PureBin LV positions its residential service around Las Vegas dust, mineral spotting, and a quote-first process.",
        bullets: [
          "Local condition fit matters because desert dust and hard water change how glass looks",
          "Clear scope matters because homeowners notice screens, tracks, frames, and sills",
          "Property-fit review matters for single-story, two-story, condo, and custom-home layouts",
          "Trust signals matter when the company explains service areas and final approval clearly",
        ],
        supportingExplanation:
          "We answer the buying questions directly instead of relying on generic claims. For this market, that means explaining what gets cleaned, what changes the quote, and why Las Vegas homes need regular glass care.",
        realWorldExample:
          "A homeowner in Henderson deciding between basic glass-only service and a fuller window-detailing visit can use the quote conversation to confirm whether screens, tracks, and sills should be included.",
      },
      {
        heading: "Is residential window cleaning worth it",
        directAnswer:
          "Residential window cleaning is worth it when the goal is to remove visible dust, water spotting, and buildup that make home glass look dull. In Las Vegas, the service can be easier to justify because desert conditions make clarity problems show up quickly.",
        bullets: [
          "Cleaner glass improves visible clarity from inside and outside the home",
          "Detailing tracks, sills, and screens improves the full-window finish",
          "Quote-first pricing helps the homeowner compare scope before committing",
          "Final approval before payment gives the homeowner a clearer finish standard",
        ],
        supportingExplanation:
          "Homeowners usually judge value by visible outcome and process clarity. When a service explains scope upfront and accounts for local buildup patterns, it is easier for the customer to decide whether the result justifies the visit.",
        realWorldExample:
          "A homeowner in Green Valley preparing for guests or listing photos may decide the service is worth it because the quote covers the exact glass areas and details that affect curb appeal most.",
      },
    ],
    comparisonTable: {
      caption: "Residential window cleaning factors homeowners compare before booking",
      columns: ["Topic", "How PureBin LV handles it"],
      rows: [
        {
          topic: "Included scope",
          details: "Quotes can include glass, screens, frames, tracks, and sills when you confirm the scope.",
        },
        {
          topic: "Pricing logic",
          details: "Pricing is reviewed after pane count, access, window type, and interior versus exterior scope are confirmed.",
        },
        {
          topic: "Property fit",
          details: "Single-story, two-story, condo, townhome, and custom-home layouts can be reviewed during quoting.",
        },
        {
          topic: "Trust process",
          details: "PureBin LV uses quote-first scheduling and final approval before payment.",
        },
      ],
    },
    sections: [
      {
        heading: "Exterior window washing built for Las Vegas homes",
        paragraphs: [
          "Desert wind, hard water, and long sun exposure make exterior glass look dull faster in the valley. We speak directly to those local issues instead of using generic window-cleaning language.",
          "That local framing makes the value clear for homeowners comparing options.",
        ],
      },
      {
        heading: "What homeowners expect from a full-service glass cleaning visit",
        paragraphs: [
          "The best residential window cleaning does not stop at glass-only language. We explain that screens, frames, tracks, sills, and visible edges matter because homeowners judge the final result as a full-window finish.",
          "This matches what we show on the homepage, with a full residential page so you can see exactly what is included.",
        ],
      },
      {
        heading: "Property types and quote factors",
        paragraphs: [
          "Residential quotes reference single-story homes, two-story homes, condos, townhomes, and custom properties so expectations stay realistic.",
          "Pane count, access, specialty windows, interior versus exterior work, and add-ons like track cleaning or hard water treatment are all discussed during quoting so you know the price before you book.",
        ],
      },
    ],
    faq: [
      CORE_FAQS[0],
      CORE_FAQS[1],
      CORE_FAQS[2],
      CORE_FAQS[4],
      CORE_FAQS[5],
      CORE_FAQS[7],
      {
        question: "Do you clean second-story and custom-home windows?",
        answer:
          "Yes. Residential quotes can cover single-story, two-story, condo, townhome, and custom-home layouts once pane count, access, and interior versus exterior scope are reviewed.",
      },
    ],
    internalLinks: [
      {
        href: "/service-areas/las-vegas",
        label: "Window Cleaning Las Vegas, NV",
        description: "Las Vegas neighborhoods and where we work.",
      },
      {
        href: "/faq",
        label: "Window Cleaning FAQs",
        description: "Common questions about pricing, access, service areas, and scheduling.",
      },
      {
        href: "/reviews",
        label: "Customer Reviews",
        description: "Review-backed proof for homeowners comparing local providers.",
      },
      {
        href: "/before-after",
        label: "Before & After Photos",
        description: "Visual proof showing the kind of finish homeowners can review before booking.",
      },
      {
        href: "/services/commercial-window-cleaning",
        label: "Commercial Window Cleaning Las Vegas",
        description: "Offices, storefronts, and managed properties.",
      },
      {
        href: "/services/high-rise-window-cleaning",
        label: "High-Rise Window Cleaning Las Vegas",
        description: "Multi-story or difficult-access glass requests.",
      },
    ],
    externalSources: [
      {
        label: "Southern Nevada Water Authority",
        href: "https://www.snwa.com/",
        description: "Regional water information that can support hard-water context for Las Vegas homeowners.",
      },
      {
        label: "National Weather Service Las Vegas",
        href: "https://www.weather.gov/vef/",
        description: "Local weather and dust-related context for Las Vegas service conditions.",
      },
      {
        label: "U.S. Environmental Protection Agency",
        href: "https://www.epa.gov/",
        description: "General household cleaning and home-maintenance guidance from a national authority.",
      },
    ],
  },
  {
    slug: "commercial-window-cleaning",
    shortLabel: "Commercial",
    navLabel: "Commercial Window Cleaning",
    title: "Commercial Window Cleaning Las Vegas",
    description:
      "Commercial window cleaning in Las Vegas for offices, storefronts, retail spaces, and managed properties that need clean glass and a dependable service process.",
    intro:
      "Commercial properties need clean glass for curb appeal, tenant perception, and day-to-day presentation. We go deeper here than a single homepage line so offices, storefronts, and managed properties know what to expect.",
    summary:
      "Commercial window cleaning, storefront glass, and exterior washing for Las Vegas businesses—explained clearly without jargon or vague promises.",
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
      "Retail, restaurant, office, and mixed-use properties welcome",
    ],
    sections: [
      {
        heading: "Storefront window cleaning that protects first impressions",
        paragraphs: [
          "Las Vegas storefront glass picks up traffic film, fingerprints, dust, and hard water much faster than residential windows. Storefront-specific service details help you decide faster and book with confidence.",
          "Commercial visitors want to know the service is dependable and presentation-focused, not just affordable. We speak to that directly.",
        ],
      },
      {
        heading: "Commercial glass cleaning for offices, retail, and managed properties",
        paragraphs: [
          "We name property types clearly: offices, retail centers, restaurants, storefronts, property-management accounts, and mixed-use buildings.",
          "Each use case gets its own explanation here instead of sending every question back to a generic overview.",
        ],
      },
      {
        heading: "Larger hospitality and specialty properties",
        paragraphs: [
          "Many Las Vegas businesses ask about hospitality, resort, and casino-related glass. Because access and safety requirements vary, we review those properties individually and confirm fit before scheduling.",
          "That keeps expectations honest and the plan realistic.",
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
          "Yes. Many businesses want recurring glass cleaning for dependable upkeep rather than a one-time visit—ask when you request a quote.",
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
      "High-rise and difficult-access glass in Las Vegas needs careful scoping. We explain the process honestly and avoid overstating capabilities that have not been confirmed.",
    summary:
      "Instead of claiming every tower or casino account outright, we route high-rise requests through a scope review, access planning, and property-fit confirmation.",
    keywords: [
      "high-rise window cleaning Las Vegas",
      "casino window cleaning Las Vegas",
      "difficult access glass cleaning Las Vegas",
      "multi-story window cleaning Las Vegas",
    ],
    highlights: [
      "Multi-story and difficult-access quote reviews",
      "Clear language around safety and property-fit confirmation",
      "Hospitality, resort, and casino-adjacent jobs reviewed honestly—no false claims",
      "Clear wording for multi-story and difficult-access requests",
    ],
    sections: [
      {
        heading: "Start with access, safety, and scope",
        paragraphs: [
          "High-rise window cleaning is a different buying decision from a standard residential job. You need to know whether a company can review access conditions, height, site logistics, and safety requirements before committing to a date.",
          "We reflect that decision path clearly so high-rise requests get a real answer—not a residential page with a new headline.",
        ],
      },
      {
        heading: "Las Vegas hospitality, resort, and casino glass needs",
        paragraphs: [
          "Las Vegas includes casino window cleaning and other hospitality-related needs. Because those properties vary widely, the most accurate approach is a scope review for hotels, resorts, casino-adjacent properties, and other large facilities.",
          "That keeps expectations aligned with what can be delivered safely.",
        ],
      },
      {
        heading: "When you are ready to move forward",
        paragraphs: [
          "Property managers, facilities teams, and business owners need a straight answer on fit. The call to action stays quote-focused instead of promising instant scheduling for every high-access property.",
          "That is the right trust posture for a service with real operational requirements.",
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
];

export const SERVICE_AREA_PAGES = [
  {
    slug: "las-vegas",
    title: "Window Cleaning Las Vegas, NV",
    description:
      "Window cleaning in Las Vegas, NV for homes, storefronts, and commercial properties with clear quotes, review-backed proof, and valley-wide coverage.",
    keywords: [
      "window cleaning Las Vegas",
      "Las Vegas window washing",
      "glass cleaning Las Vegas",
      "exterior window washing Las Vegas",
    ],
    intro:
      "Las Vegas is our core market. This page gives valley homeowners and businesses a clear local overview with neighborhood relevance and straightforward next steps.",
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
          "Between hard water, desert dust, traffic film, and year-round sun, glass in Las Vegas loses clarity quickly. That is why many homeowners and businesses call in the first place.",
          "This page explains those conditions in plain language so you know what you are dealing with before you book.",
        ],
      },
      {
        heading: "Residential, storefront, and commercial service coverage",
        paragraphs: [
          "A useful Las Vegas page should not feel like a city name dropped onto generic text. We connect the market to what we offer: residential window cleaning, commercial window cleaning, storefront glass cleaning, and difficult-access quote reviews.",
          "That broader picture helps you find the right fit whether you searched for one service or several.",
        ],
      },
      {
        heading: "Neighborhoods we reference by name",
        paragraphs: [
          "We reference real Las Vegas valley neighborhoods so coverage stays consistent wherever you read about us: Summerlin, Centennial Hills, Spring Valley, Southern Highlands, Enterprise, Skye Canyon, Green Valley, and Henderson.",
          "That keeps local context honest without thin, copy-pasted city pages.",
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
