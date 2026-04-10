import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { BUSINESS } from "@/lib/marketing-content";
import { getMetadataBase } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${BUSINESS.name} | Window Cleaning Las Vegas`,
    template: "%s | PureBin Window Cleaning",
  },
  description: BUSINESS.description,
  keywords: [
    "window cleaning Las Vegas",
    "residential window cleaning Las Vegas",
    "commercial window cleaning Las Vegas",
    "storefront window cleaning Las Vegas",
    "glass cleaning Las Vegas",
    "exterior window washing Las Vegas",
  ],
  applicationName: BUSINESS.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${BUSINESS.name} | Window Cleaning Las Vegas`,
    description: BUSINESS.description,
    siteName: BUSINESS.name,
    locale: "en_US",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BUSINESS.name} | Window Cleaning Las Vegas`,
    description: BUSINESS.description,
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
