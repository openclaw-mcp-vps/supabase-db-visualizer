import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://supabase-db-visualizer.example.com"),
  title: "Supabase DB Visualizer | ERD, Schema Explorer, and Query Insights",
  description:
    "Paste a Supabase connection string and instantly inspect ERDs, schema health, row counts, and slow queries from one cloud-native dashboard.",
  openGraph: {
    title: "Supabase DB Visualizer",
    description:
      "Cloud-native Supabase schema visualizer with ERD, query runner, and slow-query log for solo founders managing multiple projects.",
    type: "website",
    url: "https://supabase-db-visualizer.example.com",
    siteName: "Supabase DB Visualizer"
  },
  twitter: {
    card: "summary_large_image",
    title: "Supabase DB Visualizer",
    description:
      "Paste connection string. Get ERD, schema browser, row counts, and query diagnostics in under a minute."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
