import { NextResponse } from "next/server";

import {
  extractCustomerEmailFromWebhookPayload,
  extractOrderIdentifierFromWebhookPayload,
  extractSessionIdFromWebhookPayload,
  markCheckoutSessionPaid,
  verifyWebhookSignature,
} from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("x-signature") ?? request.headers.get("X-Signature");
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      {
        error: "Invalid webhook signature.",
      },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      {
        error: "Webhook payload is not valid JSON.",
      },
      { status: 400 },
    );
  }

  const sessionId = extractSessionIdFromWebhookPayload(payload);

  if (!sessionId) {
    return NextResponse.json({
      accepted: true,
      updated: false,
      reason: "No checkout session ID found in webhook payload.",
    });
  }

  const updated = markCheckoutSessionPaid(sessionId, {
    orderIdentifier: extractOrderIdentifierFromWebhookPayload(payload),
    customerEmail: extractCustomerEmailFromWebhookPayload(payload),
  });

  return NextResponse.json({
    accepted: true,
    updated,
    sessionId,
  });
}
