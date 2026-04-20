"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, LockKeyhole } from "lucide-react";
import { lemonSqueezySetup } from "lemonsqueezy.js";

type CheckoutSessionPayload = {
  ok: boolean;
  sessionToken?: string;
  checkoutUrl?: string;
  error?: string;
};

type AccessStatusPayload = {
  ok: boolean;
  unlocked: boolean;
};

type LemonSqueezyWindow = Window & {
  LemonSqueezy?: {
    Url?: {
      Open?: (url: string) => void;
    };
  };
};

export function LemonCheckoutButton() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (lemonSqueezySetup as unknown as (input: unknown) => void)({
      eventHandler: (event: unknown) => {
        const typedEvent = event as { event?: string };

        if (typedEvent.event === "Checkout.Success") {
          setPolling(true);
        }
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function pollUntilUnlocked(sessionToken: string) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      const response = await fetch(`/api/access-status?token=${encodeURIComponent(sessionToken)}`, {
        cache: "no-store"
      });

      const payload = (await response.json()) as AccessStatusPayload;

      if (response.ok && payload.unlocked) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setPolling(false);
        router.push("/dashboard");
        router.refresh();
      }
    }, 3000);
  }

  async function handleCheckout() {
    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout-session", {
        method: "POST"
      });

      const payload = (await response.json()) as CheckoutSessionPayload;

      if (!response.ok || !payload.ok || !payload.checkoutUrl || !payload.sessionToken) {
        throw new Error(payload.error || "Unable to initialize checkout.");
      }

      setPolling(true);
      void pollUntilUnlocked(payload.sessionToken);

      const lemonWindow = window as LemonSqueezyWindow;
      const open = lemonWindow.LemonSqueezy?.Url?.Open;

      if (open) {
        open(payload.checkoutUrl);
      } else {
        window.location.assign(payload.checkoutUrl);
      }
    } catch (caught) {
      setPolling(false);
      setError(caught instanceof Error ? caught.message : "Unable to start checkout.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={starting}
        onClick={handleCheckout}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Unlock Full Dashboard for $12/mo
      </button>

      <p className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <LockKeyhole className="h-3.5 w-3.5" />
        {polling
          ? "Waiting for payment confirmation from Lemon Squeezy..."
          : "Secure checkout overlay. Access is granted via signed, httpOnly cookie after payment."}
      </p>

      {error ? <p className="text-xs text-[#ff9c95]">{error}</p> : null}
    </div>
  );
}
