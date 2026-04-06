import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

function getMetadataBase() {
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

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "PureBin Window Cleaning",
    template: "%s | PureBin Window Cleaning",
  },
  description: "Window cleaning quote calculator, reviews, and field admin tools.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "PureBin Window Cleaning",
    description: "Window cleaning quote calculator, reviews, and field admin tools.",
    siteName: "PureBin Window Cleaning",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "PureBin Window Cleaning",
    description: "Window cleaning quote calculator, reviews, and field admin tools.",
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
