import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "FCA Suitability Reports",
  description:
    "Generate FCA-style suitability reports from meeting notes or adviser audio uploads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
