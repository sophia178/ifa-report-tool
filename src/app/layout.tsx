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
    "Draft suitability reports designed for FCA suitability report standards in 60 seconds from meeting notes. All output must be reviewed by a qualified regulated adviser before use.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Suitance — AI Suitability Reports for Financial Advisers",
    description:
      "Draft suitability reports designed for FCA suitability report standards in 60 seconds from meeting notes. All output must be reviewed by a qualified regulated adviser before use.",
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
