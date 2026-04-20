import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { hasPaidAccessFromCookieStore, type CookieReader } from "@/lib/auth";
import {
  normalizeConnectionString,
  parseConnectPayload,
  setConnectionCookies,
  testConnection,
} from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = (await cookies()) as CookieReader;

  if (!hasPaidAccessFromCookieStore(cookieStore)) {
    return NextResponse.json(
      {
        error: "Active subscription required before connecting a database.",
      },
      { status: 402 },
    );
  }

  try {
    const payload = parseConnectPayload(await request.json());
    const normalizedConnectionString = normalizeConnectionString(payload.connectionString);
    const testResult = await testConnection(normalizedConnectionString);

    const response = NextResponse.json({
      ok: true,
      message: "Database connection is valid.",
      connection: testResult,
    });

    setConnectionCookies(response, normalizedConnectionString);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to connect to database.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}
