import { cookies } from "next/headers";

export const ACCESS_COOKIE_NAME = "sbv_paid";

export async function hasPaidAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE_NAME)?.value === "1";
}

export async function grantPaidAccess() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function revokePaidAccess() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_COOKIE_NAME,
    value: "0",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
