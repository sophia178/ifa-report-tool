import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Suitance — AI Suitability Reports for Financial Advisers",
  description:
    "Generate FCA suitability reports in 60 seconds. Designed for UK, Australian and US financial advisers. 7-day free trial.",
  metadataBase: new URL("https://suitance.co.uk"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Suitance — AI Suitability Reports for Financial Advisers",
    description:
      "Generate FCA suitability reports in 60 seconds. Designed for UK, Australian and US financial advisers. 7-day free trial.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Suitance Branding",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
