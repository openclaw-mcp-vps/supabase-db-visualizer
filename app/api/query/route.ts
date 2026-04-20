import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectionStringFromCookies } from "@/lib/auth";
import { executeReadOnlyQuery, fingerprintConnection } from "@/lib/db-client";
import {
  getCachedQuery,
  setCachedQuery,
  slowQueriesForConnection,
  trackSlowQuery,
  type QueryPayload
} from "@/lib/query-cache";

const bodySchema = z.object({
  sql: z.string().min(6, "SQL is too short."),
  limit: z.number().int().min(1).max(2000).default(300)
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const connectionString = connectionStringFromCookies(cookieStore);

  if (!connectionString) {
    return NextResponse.json({ ok: false, error: "Connect a database first." }, { status: 401 });
  }

  try {
    const parsedBody = bodySchema.parse(await request.json());
    const fingerprint = fingerprintConnection(connectionString);
    const trimmedSql = parsedBody.sql.trim();

    const cached = getCachedQuery(fingerprint, trimmedSql);
    if (cached) {
      return NextResponse.json({
        ok: true,
        result: cached,
        slowQueries: slowQueriesForConnection(fingerprint)
      });
    }

    const executed = await executeReadOnlyQuery(connectionString, trimmedSql, parsedBody.limit);

    const payload: QueryPayload = {
      ...executed,
      cached: false,
      executedAt: new Date().toISOString()
    };

    setCachedQuery(fingerprint, trimmedSql, payload);
    trackSlowQuery(fingerprint, trimmedSql, payload.durationMs, payload.rowCount);

    return NextResponse.json({
      ok: true,
      result: payload,
      slowQueries: slowQueriesForConnection(fingerprint)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run query.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
