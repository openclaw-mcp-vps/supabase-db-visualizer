import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  CONNECTION_STRING_SCHEMA,
  fingerprintConnection,
  testConnection
} from "@/lib/db-client";
import {
  CONNECTION_COOKIE_NAME,
  CONNECTION_TTL_SECONDS,
  connectionStringFromCookies,
  defaultCookieSecurity,
  encryptConnectionString
} from "@/lib/auth";
import { resetConnectionCache } from "@/lib/query-cache";

const bodySchema = z.object({
  connectionString: CONNECTION_STRING_SCHEMA
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { connectionString } = bodySchema.parse(json);

    const summary = await testConnection(connectionString);

    const response = NextResponse.json({
      ok: true,
      summary
    });

    response.cookies.set({
      ...defaultCookieSecurity(),
      name: CONNECTION_COOKIE_NAME,
      value: encryptConnectionString(connectionString),
      maxAge: CONNECTION_TTL_SECONDS
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const currentConnection = connectionStringFromCookies(cookieStore);

  if (currentConnection) {
    resetConnectionCache(fingerprintConnection(currentConnection));
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    ...defaultCookieSecurity(),
    name: CONNECTION_COOKIE_NAME,
    value: "",
    maxAge: 0
  });

  return response;
}
