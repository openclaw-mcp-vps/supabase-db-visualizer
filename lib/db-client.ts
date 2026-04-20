import crypto from "node:crypto";
import { Client, type QueryResultRow } from "pg";
import { z } from "zod";

export const CONNECTION_STRING_SCHEMA = z
  .string()
  .min(16, "Connection string is too short.")
  .refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), {
    message: "Connection string must start with postgres:// or postgresql://"
  });

type PgClientConfig = {
  connectionString: string;
  statement_timeout: number;
  query_timeout: number;
  connectionTimeoutMillis: number;
  ssl?: { rejectUnauthorized: boolean };
};

export type ConnectionSummary = {
  database: string;
  schema: string;
  version: string;
  serverTime: string;
};

export type RawTable = {
  table_schema: string;
  table_name: string;
};

export type RawColumn = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
};

export type RawPrimaryKey = {
  table_schema: string;
  table_name: string;
  column_name: string;
};

export type RawForeignKey = {
  constraint_name: string;
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
};

export type RawRowEstimate = {
  table_schema: string;
  table_name: string;
  row_estimate: number;
};

export type IntrospectionRaw = {
  tables: RawTable[];
  columns: RawColumn[];
  primaryKeys: RawPrimaryKey[];
  foreignKeys: RawForeignKey[];
  rowEstimates: RawRowEstimate[];
};

export type QueryExecutionResult<T extends QueryResultRow = QueryResultRow> = {
  rows: T[];
  rowCount: number;
  durationMs: number;
  columns: string[];
};

const SYSTEM_SCHEMAS = ["pg_catalog", "information_schema"];

function toClientConfig(connectionString: string): PgClientConfig {
  const parsed = new URL(connectionString);
  const isLocal =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";
  const sslMode = parsed.searchParams.get("sslmode");

  return {
    connectionString,
    statement_timeout: 20000,
    query_timeout: 20000,
    connectionTimeoutMillis: 10000,
    ...(isLocal || sslMode === "disable" ? {} : { ssl: { rejectUnauthorized: false } })
  };
}

async function withClient<T>(connectionString: string, run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(toClientConfig(connectionString));
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export function parseConnectionString(connectionString: string): string {
  return CONNECTION_STRING_SCHEMA.parse(connectionString.trim());
}

export function fingerprintConnection(connectionString: string): string {
  return crypto.createHash("sha256").update(connectionString).digest("hex").slice(0, 24);
}

export async function testConnection(connectionString: string): Promise<ConnectionSummary> {
  const parsedConnection = parseConnectionString(connectionString);

  return withClient(parsedConnection, async (client) => {
    const result = await client.query<{
      database_name: string;
      current_schema: string;
      version: string;
      server_time: string;
    }>(`
      SELECT
        current_database() AS database_name,
        current_schema() AS current_schema,
        version() AS version,
        now()::text AS server_time
    `);

    const row = result.rows[0];

    return {
      database: row.database_name,
      schema: row.current_schema,
      version: row.version,
      serverTime: row.server_time
    };
  });
}

export async function introspectDatabase(connectionString: string): Promise<IntrospectionRaw> {
  const parsedConnection = parseConnectionString(connectionString);

  return withClient(parsedConnection, async (client) => {
    const [tables, columns, primaryKeys, foreignKeys, rowEstimates] = await Promise.all([
      client.query<RawTable>(
        `
          SELECT table_schema, table_name
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
            AND table_schema <> ALL($1::text[])
          ORDER BY table_schema, table_name
        `,
        [SYSTEM_SCHEMAS]
      ),
      client.query<RawColumn>(
        `
          SELECT
            table_schema,
            table_name,
            column_name,
            data_type,
            is_nullable = 'YES' AS is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema <> ALL($1::text[])
          ORDER BY table_schema, table_name, ordinal_position
        `,
        [SYSTEM_SCHEMAS]
      ),
      client.query<RawPrimaryKey>(
        `
          SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            AND tc.table_name = kcu.table_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema <> ALL($1::text[])
          ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position
        `,
        [SYSTEM_SCHEMAS]
      ),
      client.query<RawForeignKey>(
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
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema <> ALL($1::text[])
          ORDER BY tc.table_schema, tc.table_name, tc.constraint_name
        `,
        [SYSTEM_SCHEMAS]
      ),
      client.query<RawRowEstimate>(
        `
          SELECT
            ns.nspname AS table_schema,
            c.relname AS table_name,
            GREATEST(COALESCE(s.n_live_tup, c.reltuples, 0), 0)::bigint::int AS row_estimate
          FROM pg_class c
          JOIN pg_namespace ns ON ns.oid = c.relnamespace
          LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
          WHERE c.relkind = 'r'
            AND ns.nspname <> ALL($1::text[])
          ORDER BY ns.nspname, c.relname
        `,
        [SYSTEM_SCHEMAS]
      )
    ]);

    return {
      tables: tables.rows,
      columns: columns.rows,
      primaryKeys: primaryKeys.rows,
      foreignKeys: foreignKeys.rows,
      rowEstimates: rowEstimates.rows
    };
  });
}

function normalizeQuery(sql: string): string {
  return sql.trim().replace(/;+\s*$/, "");
}

function enforceReadOnly(sql: string): string {
  const normalized = normalizeQuery(sql);
  const lower = normalized.toLowerCase();

  const startsAllowed =
    lower.startsWith("select") || lower.startsWith("with") || lower.startsWith("explain");

  if (!startsAllowed) {
    throw new Error("Only SELECT, WITH, and EXPLAIN queries are allowed.");
  }

  const forbidden = [
    /\binsert\b/i,
    /\bupdate\b/i,
    /\bdelete\b/i,
    /\btruncate\b/i,
    /\balter\b/i,
    /\bdrop\b/i,
    /\bcreate\b/i,
    /\bgrant\b/i,
    /\brevoke\b/i,
    /\bcomment\b/i,
    /\bvacuum\b/i
  ];

  if (forbidden.some((pattern) => pattern.test(lower))) {
    throw new Error("Mutating statements are blocked. Use read-only SQL.");
  }

  return normalized;
}

function maybeAppendLimit(sql: string, limit: number): string {
  const lower = sql.toLowerCase();

  if (lower.startsWith("explain") || /\blimit\s+\d+/i.test(lower)) {
    return sql;
  }

  return `${sql} LIMIT ${limit}`;
}

export async function executeReadOnlyQuery(
  connectionString: string,
  sql: string,
  rowLimit: number
): Promise<QueryExecutionResult> {
  const parsedConnection = parseConnectionString(connectionString);
  const safeSql = maybeAppendLimit(enforceReadOnly(sql), rowLimit);

  return withClient(parsedConnection, async (client) => {
    const started = Date.now();
    const result = await client.query(safeSql);
    const durationMs = Date.now() - started;

    return {
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
      durationMs,
      columns: result.fields.map((field) => field.name)
    };
  });
}
