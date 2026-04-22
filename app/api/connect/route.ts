import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { withDbClient } from "@/lib/db-client";
import type { ConnectionSummary } from "@/lib/types";

type ConnectBody = {
  connectionString?: unknown;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: ConnectBody;

  try {
    body = (await request.json()) as ConnectBody;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (typeof body.connectionString !== "string") {
    return badRequest("`connectionString` is required.");
  }

  try {
    const summary = await withDbClient(body.connectionString, async (client) => {
      const [identityResult, countResult] = await Promise.all([
        client.query<{
          database_name: string;
          current_role: string;
          server_version: string;
        }>(
          `
          SELECT
            current_database() AS database_name,
            current_user AS current_role,
            split_part(version(), ',', 1) AS server_version
          `
        ),
        client.query<{ table_count: string }>(
          `
          SELECT COUNT(*)::text AS table_count
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
            AND table_schema NOT IN ('pg_catalog', 'information_schema')
          `
        )
      ]);

      const identity = identityResult.rows[0];
      const tableCount = Number(countResult.rows[0]?.table_count ?? "0");

      const payload: ConnectionSummary = {
        database: identity.database_name,
        user: identity.current_role,
        postgresVersion: identity.server_version,
        tableCount: Number.isFinite(tableCount) ? tableCount : 0
      };

      return payload;
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect to database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
