import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasPaidAccessFromCookieStore, type CookieReader } from "@/lib/auth";
import { fetchSchemaSnapshot, getSlowQueryLog, readConnectionStringFromCookieStore } from "@/lib/database";
import { generateErdDiagram } from "@/lib/erd-generator";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const cookieStore = (await cookies()) as CookieReader;

  if (!hasPaidAccessFromCookieStore(cookieStore)) {
    return NextResponse.json(
      {
        error: "Active subscription required before using the explorer.",
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
    const snapshot = await fetchSchemaSnapshot(connectionString);
    const erd = generateErdDiagram(snapshot);

    return NextResponse.json({
      schema: snapshot,
      erd,
      slowQueries: getSlowQueryLog(snapshot.connectionHash),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load schema.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}
