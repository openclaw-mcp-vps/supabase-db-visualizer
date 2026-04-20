import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectionStringFromCookies } from "@/lib/auth";
import { fingerprintConnection, introspectDatabase } from "@/lib/db-client";
import { slowQueriesForConnection } from "@/lib/query-cache";
import { parseIntrospection } from "@/lib/schema-parser";

export async function GET() {
  const cookieStore = await cookies();
  const connectionString = connectionStringFromCookies(cookieStore);

  if (!connectionString) {
    return NextResponse.json(
      {
        ok: false,
        error: "No active database connection."
      },
      { status: 401 }
    );
  }

  try {
    const raw = await introspectDatabase(connectionString);
    const parsed = parseIntrospection(raw);
    const fingerprint = fingerprintConnection(connectionString);

    return NextResponse.json({
      ok: true,
      schema: parsed,
      slowQueries: slowQueriesForConnection(fingerprint)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to inspect schema.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
