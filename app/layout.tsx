import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: {
    default: "Supabase DB Visualizer",
    template: "%s | Supabase DB Visualizer"
  },
  description:
    "Paste a Supabase Postgres URL and get an instant ERD, schema browser, query explorer, and row count dashboard. Built for solo founders managing multiple databases.",
  metadataBase: new URL("https://supabase-db-visualizer.example.com"),
  keywords: [
    "Supabase",
    "database visualizer",
    "ERD generator",
    "Postgres explorer",
    "schema browser",
    "query explorer"
  ],
  openGraph: {
    title: "Supabase DB Visualizer",
    description:
      "Auto-generate ERDs, browse tables, run SQL safely, and inspect slow query activity across any Supabase Postgres URL.",
    url: "https://supabase-db-visualizer.example.com",
    siteName: "Supabase DB Visualizer",
    images: [
      {
        url: "https://supabase-db-visualizer.example.com/og.png",
        width: 1200,
        height: 630,
        alt: "Supabase DB Visualizer dashboard preview"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Supabase DB Visualizer",
    description:
      "Universal cloud-native Supabase schema and SQL explorer for solo founders.",
    images: ["https://supabase-db-visualizer.example.com/og.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
