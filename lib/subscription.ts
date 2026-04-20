import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export interface CheckoutSession {
  id: string;
  status: "pending" | "paid";
  createdAt: number;
  paidAt?: number;
  orderIdentifier?: string;
  customerEmail?: string;
}

interface CheckoutState {
  sessions: Map<string, CheckoutSession>;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

const globalState = globalThis as unknown as {
  __sbvCheckoutState?: CheckoutState;
};

const checkoutState =
  globalState.__sbvCheckoutState ??
  (globalState.__sbvCheckoutState = {
    sessions: new Map<string, CheckoutSession>(),
  });

function purgeExpiredSessions(): void {
  const now = Date.now();

  for (const [id, session] of checkoutState.sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      checkoutState.sessions.delete(id);
    }
  }
}

export function isLemonConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID && process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID,
  );
}

export function createCheckoutSession(): CheckoutSession {
  purgeExpiredSessions();

  const session: CheckoutSession = {
    id: randomUUID(),
    status: "pending",
    createdAt: Date.now(),
  };

  checkoutState.sessions.set(session.id, session);
  return session;
}

export function buildCheckoutUrl(origin: string, sessionId: string): string | null {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!productId) {
    return null;
  }

  const url = new URL(`https://checkout.lemonsqueezy.com/buy/${productId}`);
  url.searchParams.set("embed", "1");
  url.searchParams.set("checkout[custom][session_id]", sessionId);
  url.searchParams.set("checkout[success_url]", `${origin}/purchase/success?session=${sessionId}`);
  url.searchParams.set("checkout[cancel_url]", `${origin}/?checkout=cancelled`);

  return url.toString();
}

export function markCheckoutSessionPaid(
  sessionId: string,
  details?: { orderIdentifier?: string; customerEmail?: string },
): boolean {
  purgeExpiredSessions();

  const session = checkoutState.sessions.get(sessionId);
  if (!session) {
    return false;
  }

  session.status = "paid";
  session.paidAt = Date.now();
  session.orderIdentifier = details?.orderIdentifier;
  session.customerEmail = details?.customerEmail;

  checkoutState.sessions.set(sessionId, session);
  return true;
}

export function getCheckoutSession(sessionId: string): CheckoutSession | null {
  purgeExpiredSessions();
  return checkoutState.sessions.get(sessionId) ?? null;
}

export function isCheckoutSessionPaid(sessionId: string): boolean {
  const session = getCheckoutSession(sessionId);
  return session?.status === "paid";
}

function getWebhookSecret(): string {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";
}

function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = getWebhookSecret();

  if (!secret || !signature) {
    return false;
  }

  const normalizedSignature = signature.replace(/^sha256=/i, "").trim();
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  return safeEquals(digest, normalizedSignature);
}

function findValueByKey(input: unknown, targetKeys: string[], depth = 0): string | null {
  if (depth > 8 || !input || typeof input !== "object") {
    return null;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const foundInArray = findValueByKey(item, targetKeys, depth + 1);
      if (foundInArray) {
        return foundInArray;
      }
    }

    return null;
  }

  const record = input as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (targetKeys.includes(key) && typeof value === "string") {
      return value;
    }

    const foundInNested = findValueByKey(value, targetKeys, depth + 1);
    if (foundInNested) {
      return foundInNested;
    }
  }

  return null;
}

export function extractSessionIdFromWebhookPayload(payload: unknown): string | null {
  return findValueByKey(payload, ["session_id", "sessionId"]);
}

export function extractOrderIdentifierFromWebhookPayload(payload: unknown): string | undefined {
  return (
    findValueByKey(payload, ["order_id", "orderId", "identifier", "id"]) || undefined
  );
}

export function extractCustomerEmailFromWebhookPayload(payload: unknown): string | undefined {
  return findValueByKey(payload, ["user_email", "email", "customer_email"]) || undefined;
}
