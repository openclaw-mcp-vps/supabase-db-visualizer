"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

async function claimSession(sessionId: string): Promise<boolean> {
  const response = await fetch("/api/subscription/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  return response.ok;
}

function PurchaseSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = useMemo(() => searchParams.get("session") ?? "", [searchParams]);

  const [statusText, setStatusText] = useState("Verifying payment status...");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setStatusText("Missing checkout session. Start checkout again from the pricing section.");
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/subscription/status?session=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setStatusText("Unable to verify payment yet. We will retry automatically.");
          return;
        }

        const payload = (await response.json()) as { paid?: boolean };

        if (payload.paid) {
          const claimed = await claimSession(sessionId);

          if (!cancelled && claimed) {
            setStatusText("Payment verified. Redirecting to dashboard...");
            setIsComplete(true);
            router.replace("/dashboard");
          }
        } else if (!cancelled) {
          setStatusText("Payment is still processing. Keep this page open for automatic unlock.");
        }
      } catch {
        if (!cancelled) {
          setStatusText("Temporary network issue while verifying payment. Retrying...");
        }
      }
    };

    void pollStatus();

    const interval = window.setInterval(() => {
      void pollStatus();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router, sessionId]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-[#2a394d] bg-[#101726]/90 p-6 text-center sm:p-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Finalizing Your Access</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#9eb3c8] sm:text-base">{statusText}</p>
        {isComplete ? null : (
          <p className="mt-4 text-xs text-[#7f97b0]">Session: {sessionId || "not available"}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg border border-[#2a3a4f] px-4 py-2 text-sm text-[#d0dde9] transition hover:border-[#35c8ff] hover:text-[#35c8ff]"
          >
            Back to Pricing
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#35c8ff] px-4 py-2 text-sm font-semibold text-[#032435] transition hover:bg-[#64d6ff]"
          >
            Try Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-16 sm:px-6">
          <section className="w-full rounded-2xl border border-[#2a394d] bg-[#101726]/90 p-6 text-center sm:p-8">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Finalizing Your Access</h1>
            <p className="mt-4 text-sm leading-relaxed text-[#9eb3c8] sm:text-base">Loading checkout session...</p>
          </section>
        </main>
      }
    >
      <PurchaseSuccessContent />
    </Suspense>
  );
}
