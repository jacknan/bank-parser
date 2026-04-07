import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safedataflow.com";
const siteName = "SafeDataFlow";
const siteDescription =
  "Convert bank statement PDFs to CSV, Excel, JSON, and QuickBooks formats with secure parsing and no data storage.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Bank Statement to CSV Converter`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "bank statement converter",
    "bank statement to csv",
    "pdf to csv",
    "bank statement parser",
    "quickbooks import",
    "bank statement to excel",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    locale: "en_US",
    title: `${siteName} | Bank Statement to CSV Converter`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Bank Statement to CSV Converter`,
    description: siteDescription,
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
