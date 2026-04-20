import crypto from "node:crypto";

export const ACCESS_COOKIE_NAME = "sbv_paid";
export const CONNECTION_COOKIE_NAME = "sbv_conn";
export const CHECKOUT_COOKIE_NAME = "sbv_checkout";

export const ACCESS_TTL_SECONDS = 60 * 60 * 24 * 31;
export const CONNECTION_TTL_SECONDS = 60 * 60 * 12;
export const CHECKOUT_TTL_SECONDS = 60 * 30;

export type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
};

function appSecret(): string {
  return (
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ||
    "local-dev-secret-change-this-before-production"
  );
}

function hmac(value: string): string {
  return crypto.createHmac("sha256", appSecret()).update(value).digest("base64url");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function keyMaterial(): Buffer {
  return crypto.createHash("sha256").update(appSecret()).digest();
}

export function defaultCookieSecurity() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/"
  };
}

export function issueAccessCookieValue(): string {
  const payload = {
    scope: "pro",
    exp: Date.now() + ACCESS_TTL_SECONDS * 1000
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${hmac(encoded)}`;
}

export function hasPaidAccess(cookieStore: CookieStoreLike): boolean {
  const raw = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!raw) {
    return false;
  }

  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature || !timingSafeEqualString(signature, hmac(encoded))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      exp?: number;
      scope?: string;
    };

    return payload.scope === "pro" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function generateCheckoutSessionToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomBytes(10).toString("hex")}`;
}

export function encryptConnectionString(connectionString: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(connectionString, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptConnectionString(payload: string): string | null {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [ivPart, tagPart, encryptedPart] = parts;

  try {
    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    const encrypted = Buffer.from(encryptedPart, "base64url");

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyMaterial(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function connectionStringFromCookies(cookieStore: CookieStoreLike): string | null {
  const encrypted = cookieStore.get(CONNECTION_COOKIE_NAME)?.value;
  if (!encrypted) {
    return null;
  }

  return decryptConnectionString(encrypted);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", appSecret()).update(rawBody).digest("hex");
  return timingSafeEqualString(expected, signature);
}
