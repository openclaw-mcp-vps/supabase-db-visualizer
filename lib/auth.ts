import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export interface CookieReader {
  get: (name: string) => { value: string } | undefined;
}

export const ACCESS_COOKIE_NAME = "sbv_access";
const ACCESS_TTL_SECONDS = 60 * 60 * 24 * 30;

type AccessTokenPayload = {
  sessionId: string;
  expiresAt: number;
};

function getSigningSecret(): string {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "local-dev-signing-secret";
}

function createSignature(value: string): string {
  return createHmac("sha256", getSigningSecret()).update(value).digest("hex");
}

function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function mintAccessToken(sessionId: string): string {
  const payload: AccessTokenPayload = {
    sessionId,
    expiresAt: Date.now() + ACCESS_TTL_SECONDS * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseAccessToken(token: string | undefined): AccessTokenPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!safeEquals(createSignature(encodedPayload), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AccessTokenPayload;

    if (!parsed.sessionId || typeof parsed.expiresAt !== "number") {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasPaidAccessFromCookieStore(cookieStore: CookieReader): boolean {
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  return Boolean(parseAccessToken(token));
}

export async function hasPaidAccessFromServerCookies(): Promise<boolean> {
  const cookieStore = (await cookies()) as CookieReader;
  return hasPaidAccessFromCookieStore(cookieStore);
}

export function applyPaidAccessCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: mintAccessToken(sessionId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
}

export function clearPaidAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
