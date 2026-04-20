import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import { hasPaidAccess } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Connect your Supabase/Postgres databases, inspect ERDs, browse schema, run SQL, and monitor slow-query activity."
};

export default async function DashboardPage() {
  const cookieStore = await cookies();

  if (!hasPaidAccess(cookieStore)) {
    redirect("/");
  }

  return <DashboardWorkspace />;
}
