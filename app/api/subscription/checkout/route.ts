import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { markCheckoutSessionPaid } from "@/lib/subscription";
import { buildCheckoutUrl, createCheckoutSession, isLemonConfigured } from "@/lib/subscription";

function resolveOrigin(hostHeader: string | null, protoHeader: string | null): string {
  if (!hostHeader) {
    return "http://localhost:3000";
  }

  const protocol = protoHeader || (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${protocol}://${hostHeader}`;
}

export async function POST(): Promise<NextResponse> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto");
  const origin = requestHeaders.get("origin") ?? resolveOrigin(host, proto);

  const session = createCheckoutSession();

  if (!isLemonConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      markCheckoutSessionPaid(session.id, { orderIdentifier: "local-dev" });

      return NextResponse.json({
        sessionId: session.id,
        checkoutUrl: null,
        autoUnlocked: true,
        message:
          "Lemon Squeezy environment variables are missing, so this local session has been unlocked for development.",
      });
    }

    return NextResponse.json(
      {
        error: "Checkout is not configured. Add Lemon Squeezy environment variables.",
      },
      { status: 500 },
    );
  }

  const checkoutUrl = buildCheckoutUrl(origin, session.id);

  if (!checkoutUrl) {
    return NextResponse.json(
      {
        error: "Failed to build checkout URL.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    sessionId: session.id,
    checkoutUrl,
    autoUnlocked: false,
  });
}
