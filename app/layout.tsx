import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://supabase-db-visualizer.com"),
  title: {
    default: "Supabase DB Visualizer",
    template: "%s | Supabase DB Visualizer",
  },
  description:
    "Paste a Supabase connection string and instantly inspect ERD, schema, row counts, and slow-query telemetry from one unified dashboard.",
  applicationName: "Supabase DB Visualizer",
  keywords: [
    "Supabase",
    "database visualizer",
    "ERD",
    "SQL explorer",
    "schema browser",
    "row count dashboard",
  ],
  openGraph: {
    title: "Supabase DB Visualizer",
    description:
      "Cloud-native PostgreSQL explorer for founders running multiple Supabase projects.",
    url: "https://supabase-db-visualizer.com",
    siteName: "Supabase DB Visualizer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supabase DB Visualizer",
    description:
      "Connect any Supabase database and generate ERD, schema maps, and query insights in seconds.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
