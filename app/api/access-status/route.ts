import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TTL_SECONDS,
  CHECKOUT_COOKIE_NAME,
  defaultCookieSecurity,
  issueAccessCookieValue
} from "@/lib/auth";
import { isSessionPaid } from "@/lib/payment-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, unlocked: false }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CHECKOUT_COOKIE_NAME)?.value;

  if (cookieToken !== token) {
    return NextResponse.json({ ok: false, unlocked: false }, { status: 403 });
  }

  const paid = await isSessionPaid(token);

  if (!paid) {
    return NextResponse.json({ ok: true, unlocked: false });
  }

  const response = NextResponse.json({ ok: true, unlocked: true });

  response.cookies.set({
    ...defaultCookieSecurity(),
    name: ACCESS_COOKIE_NAME,
    value: issueAccessCookieValue(),
    maxAge: ACCESS_TTL_SECONDS
  });

  response.cookies.set({
    ...defaultCookieSecurity(),
    name: CHECKOUT_COOKIE_NAME,
    value: "",
    maxAge: 0
  });

  return response;
}
