"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

type CheckoutResponse = {
  sessionId?: string;
  checkoutUrl?: string | null;
  autoUnlocked?: boolean;
  message?: string;
  error?: string;
};

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

export function CheckoutCTA({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    let cancelled = false;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/subscription/status?session=${encodeURIComponent(activeSessionId)}`, {
          cache: "no-store",
        });

        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as { paid?: boolean };

        if (payload.paid) {
          const claimed = await claimSession(activeSessionId);

          if (claimed && !cancelled) {
            setStatus("Payment confirmed. Redirecting to dashboard...");
            router.push("/dashboard");
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("Checkout is open. Waiting for payment confirmation...");
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
  }, [activeSessionId, router]);

  const startCheckout = async () => {
    setError("");
    setStatus("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
      });

      const payload = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        setError(payload.error || "Unable to start checkout.");
        return;
      }

      if (!payload.sessionId) {
        setError("Checkout session could not be created.");
        return;
      }

      if (payload.autoUnlocked) {
        const claimed = await claimSession(payload.sessionId);

        if (claimed) {
          router.push("/dashboard");
          return;
        }
      }

      setActiveSessionId(payload.sessionId);
      setStatus(payload.message || "Checkout opened. Complete payment to unlock dashboard access.");

      if (payload.checkoutUrl) {
        try {
          window.createLemonSqueezy?.();

          if (window.LemonSqueezy?.Url?.Open) {
            window.LemonSqueezy.Url.Open(payload.checkoutUrl);
          } else {
            window.open(payload.checkoutUrl, "_blank", "noopener,noreferrer");
          }
        } catch {
          window.open(payload.checkoutUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        router.push(`/purchase/success?session=${encodeURIComponent(payload.sessionId)}`);
      }
    } catch {
      setError("Checkout could not be initialized due to a network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={fullWidth ? "w-full" : "inline-flex flex-col"}>
      <button
        type="button"
        onClick={startCheckout}
        disabled={isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#35c8ff] px-4 py-3 text-sm font-semibold text-[#032435] transition hover:bg-[#61d5ff] disabled:cursor-not-allowed disabled:bg-[#1f4958] disabled:text-[#8ab6c9] ${
          fullWidth ? "w-full" : ""
        }`}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Unlock Dashboard for $12/mo
      </button>
      {status ? <p className="mt-2 text-xs text-[#8fb5cf]">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-[#ef8f8f]">{error}</p> : null}
    </div>
  );
}
