import { NextResponse } from "next/server";
import { markSessionPaid } from "@/lib/payment-store";
import { verifyWebhookSignature } from "@/lib/auth";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      session_token?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      status?: string;
    };
  };
};

const PAYMENT_EVENTS = new Set([
  "order_created",
  "subscription_created",
  "subscription_payment_success"
]);

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: LemonWebhookPayload;

  try {
    payload = JSON.parse(raw) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;

  if (!eventName || !PAYMENT_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const sessionToken = payload.meta?.custom_data?.session_token;

  if (!sessionToken) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await markSessionPaid({
    token: sessionToken,
    orderId: payload.data?.id,
    customerEmail: payload.data?.attributes?.user_email,
    eventName
  });

  return NextResponse.json({ ok: true });
}
