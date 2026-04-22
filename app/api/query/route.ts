import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { withDbClient } from "@/lib/db-client";
import type { QueryExecution } from "@/lib/types";

type QueryBody = {
  connectionString?: unknown;
  sql?: unknown;
};

const SAFE_QUERY_PATTERN = /^(select|with|explain)\b/i;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeSql(sql: string) {
  const normalized = sql.trim();
  return normalized.endsWith(";") ? normalized.slice(0, -1) : normalized;
}

function enforceLimit(sql: string) {
  if (/^explain\b/i.test(sql)) {
    return sql;
  }

  if (/\blimit\s+\d+\b/i.test(sql)) {
    return sql;
  }

  return `${sql}\nLIMIT 200`;
}

export async function POST(request: Request) {
  let body: QueryBody;

  try {
    body = (await request.json()) as QueryBody;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (typeof body.connectionString !== "string") {
    return badRequest("`connectionString` is required.");
  }

  if (typeof body.sql !== "string") {
    return badRequest("`sql` is required.");
  }

  const rawSql = normalizeSql(body.sql);

  if (!rawSql) {
    return badRequest("SQL query cannot be empty.");
  }

  if (!SAFE_QUERY_PATTERN.test(rawSql)) {
    return badRequest("Only SELECT, WITH, and EXPLAIN statements are allowed.");
  }

  const executableSql = enforceLimit(rawSql);

  try {
    const result = await withDbClient(body.connectionString, async (client) => {
      const startedAt = performance.now();
      const queryResult = await client.query(executableSql);
      const durationMs = Number((performance.now() - startedAt).toFixed(2));

      const payload: QueryExecution = {
        executedSql: executableSql,
        columns: queryResult.fields.map((field) => field.name),
        rows: queryResult.rows,
        rowCount: queryResult.rowCount ?? queryResult.rows.length,
        durationMs,
        isSlowQuery: durationMs >= 750
      };

      return payload;
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute query.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
