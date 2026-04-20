import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { hasPaidAccessFromCookieStore, type CookieReader } from "@/lib/auth";
import {
  executeCachedReadOnlyQuery,
  getSlowQueryLog,
  hashConnectionString,
  readConnectionStringFromCookieStore,
} from "@/lib/database";

export const runtime = "nodejs";

const queryPayloadSchema = z.object({
  sql: z.string().min(1).max(20_000),
  limit: z.number().int().min(1).max(500).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = (await cookies()) as CookieReader;

  if (!hasPaidAccessFromCookieStore(cookieStore)) {
    return NextResponse.json(
      {
        error: "Active subscription required before running queries.",
      },
      { status: 402 },
    );
  }

  const connectionString = readConnectionStringFromCookieStore(cookieStore);

  if (!connectionString) {
    return NextResponse.json(
      {
        error: "No database connection found. Connect a Supabase project first.",
      },
      { status: 400 },
    );
  }

  try {
    const payload = queryPayloadSchema.parse(await request.json());
    const result = await executeCachedReadOnlyQuery(connectionString, payload.sql, payload.limit);

    return NextResponse.json({
      result,
      slowQueries: getSlowQueryLog(hashConnectionString(connectionString)),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query request payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to run query.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}
