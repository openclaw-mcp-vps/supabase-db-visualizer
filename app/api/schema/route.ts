import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { withDbClient } from "@/lib/db-client";
import { buildDatabaseSchema } from "@/lib/schema-parser";

type SchemaBody = {
  connectionString?: unknown;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: SchemaBody;

  try {
    body = (await request.json()) as SchemaBody;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (typeof body.connectionString !== "string") {
    return badRequest("`connectionString` is required.");
  }

  try {
    const schema = await withDbClient(body.connectionString, async (client) => {
      const [columnRows, pkRows, fkRows, rowEstimateRows] = await Promise.all([
        client.query<{
          table_schema: string;
          table_name: string;
          column_name: string;
          data_type: string;
          udt_name: string;
          is_nullable: "YES" | "NO";
          column_default: string | null;
        }>(
          `
          SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            c.data_type,
            c.udt_name,
            c.is_nullable,
            c.column_default
          FROM information_schema.columns c
          INNER JOIN information_schema.tables t
            ON c.table_schema = t.table_schema
           AND c.table_name = t.table_name
          WHERE t.table_type = 'BASE TABLE'
            AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY c.table_schema, c.table_name, c.ordinal_position
          `
        ),
        client.query<{
          table_schema: string;
          table_name: string;
          column_name: string;
        }>(
          `
          SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name
          FROM information_schema.table_constraints tc
          INNER JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
          `
        ),
        client.query<{
          constraint_name: string;
          source_schema: string;
          source_table: string;
          source_column: string;
          target_schema: string;
          target_table: string;
          target_column: string;
        }>(
          `
          SELECT
            tc.constraint_name,
            tc.table_schema AS source_schema,
            tc.table_name AS source_table,
            kcu.column_name AS source_column,
            ccu.table_schema AS target_schema,
            ccu.table_name AS target_table,
            ccu.column_name AS target_column
          FROM information_schema.table_constraints tc
          INNER JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          INNER JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
          `
        ),
        client.query<{
          table_schema: string;
          table_name: string;
          row_estimate: string;
        }>(
          `
          SELECT
            schemaname AS table_schema,
            relname AS table_name,
            n_live_tup::text AS row_estimate
          FROM pg_stat_user_tables
          `
        )
      ]);

      return buildDatabaseSchema({
        columns: columnRows.rows,
        primaryKeys: pkRows.rows,
        foreignKeys: fkRows.rows,
        rowEstimates: rowEstimateRows.rows
      });
    });

    return NextResponse.json({ ok: true, schema });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to introspect schema.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
