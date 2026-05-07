import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

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
    "Generate FCA-compliant suitability reports in 60 seconds from your meeting notes. Used by UK independent financial advisers and paraplanners.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Suitance — AI Suitability Reports for Financial Advisers",
    description:
      "Generate FCA-compliant suitability reports in 60 seconds from your meeting notes. Used by UK independent financial advisers and paraplanners.",
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
      <body className={`${inter.variable} ${playfair.variable}`}>{children}</body>
    </html>
  );
}
