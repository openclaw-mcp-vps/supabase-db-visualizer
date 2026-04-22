import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import DashboardApp from "@/components/DashboardApp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { grantPaidAccess, hasPaidAccess, revokePaidAccess } from "@/lib/auth";

async function unlockDashboardAccess() {
  "use server";

  await grantPaidAccess();
  redirect("/dashboard");
}

async function removeDashboardAccess() {
  "use server";

  await revokePaidAccess();
  redirect("/dashboard");
}

export default async function DashboardPage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const paid = await hasPaidAccess();

  if (!paid) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-8">
        <Card className="w-full border-[#36404d] bg-[#101722]/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <LockKeyhole className="h-6 w-6 text-[#58a6ff]" />
              Dashboard access is paid
            </CardTitle>
            <CardDescription>
              This workspace is behind checkout to keep it sustainable for solo founders. Purchase once,
              then unlock with a secure cookie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 rounded-lg border border-[#30363d] bg-[#111a27] p-4 sm:grid-cols-3">
              <div className="rounded-md border border-[#2a3b50] bg-[#132238] p-3">
                <ShieldCheck className="h-4 w-4 text-[#8fb9ff]" />
                <p className="mt-2 text-sm font-semibold text-[#e6edf3]">Cookie-based unlock</p>
                <p className="text-xs text-[#9da7b3]">Access persists on this device for 30 days.</p>
              </div>
              <div className="rounded-md border border-[#2a3b50] bg-[#132238] p-3">
                <Sparkles className="h-4 w-4 text-[#8fb9ff]" />
                <p className="mt-2 text-sm font-semibold text-[#e6edf3]">$12/month</p>
                <p className="text-xs text-[#9da7b3]">Unlimited database sessions and diagnostics.</p>
              </div>
              <div className="rounded-md border border-[#2a3b50] bg-[#132238] p-3">
                <LockKeyhole className="h-4 w-4 text-[#8fb9ff]" />
                <p className="mt-2 text-sm font-semibold text-[#e6edf3]">Hosted Stripe checkout</p>
                <p className="text-xs text-[#9da7b3]">No embedded forms or custom PCI surface.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#2f81f7] px-4 text-sm font-semibold text-white transition hover:bg-[#1f6feb]"
              >
                Buy access on Stripe
              </a>

              <form action={unlockDashboardAccess}>
                <Button type="submit" variant="secondary">
                  I completed checkout, unlock dashboard
                </Button>
              </form>

              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#30363d] px-4 text-sm text-[#c9d1d9] hover:bg-[#151f2d]"
              >
                Back to landing page
              </Link>
            </div>

            {!paymentLink ? (
              <p className="text-sm text-[#ffb4b4]">
                Missing `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`. Add it to your environment to enable checkout.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-10">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-8 lg:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8b949e]">Supabase DB Visualizer</p>
          <h1 className="text-2xl font-semibold text-[#e6edf3]">Database diagnostics dashboard</h1>
        </div>
        <form action={removeDashboardAccess}>
          <Button type="submit" variant="ghost">
            Lock dashboard
          </Button>
        </form>
      </header>
      <DashboardApp />
    </main>
  );
}
