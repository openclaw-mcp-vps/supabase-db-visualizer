import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import { hasPaidAccessFromServerCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Interactive Supabase schema explorer and query workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const hasAccess = await hasPaidAccessFromServerCookies();

  if (!hasAccess) {
    redirect("/");
  }

  return <DashboardWorkspace />;
}
