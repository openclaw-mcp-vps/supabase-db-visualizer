import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import type { NextResponse } from "next/server";
import { Pool, type FieldDef, type QueryResultRow } from "pg";
import { z } from "zod";

import type { CookieReader } from "@/lib/auth";
import type {
  ColumnInfo,
  ForeignKeyInfo,
  QueryExecutionResult,
  QueryColumn,
  SchemaSnapshot,
  SlowQueryRecord,
  TableInfo,
} from "@/types/database";

const DB_CONNECTION_COOKIE = "sbv_db_conn";
const DB_CONNECTION_SIGNATURE_COOKIE = "sbv_db_conn_sig";

const MAX_QUERY_ROWS = 500;
const DEFAULT_RESULT_LIMIT = 200;
const QUERY_CACHE_TTL_MS = 20_000;
const SLOW_QUERY_THRESHOLD_MS = 800;
const MAX_SLOW_QUERY_LOGS = 50;

type QueryCacheEntry = {
  expiresAt: number;
  result: QueryExecutionResult;
};

interface DatabaseState {
  pools: Map<string, Pool>;
  queryCache: Map<string, QueryCacheEntry>;
  slowQueries: Map<string, SlowQueryRecord[]>;
}

const globalState = globalThis as unknown as {
  __sbvDatabaseState?: DatabaseState;
};

const databaseState =
  globalState.__sbvDatabaseState ??
  (globalState.__sbvDatabaseState = {
    pools: new Map<string, Pool>(),
    queryCache: new Map<string, QueryCacheEntry>(),
    slowQueries: new Map<string, SlowQueryRecord[]>(),
  });

const connectPayloadSchema = z.object({
  connectionString: z.string().min(16).max(3000),
});

function getSigningSecret(): string {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "local-dev-signing-secret";
}

function createSignature(value: string): string {
  return createHmac("sha256", getSigningSecret()).update(value).digest("hex");
}

function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function createConnectionKey(connectionString: string): string {
  return createHash("sha256").update(connectionString).digest("hex");
}

export function hashConnectionString(connectionString: string): string {
  return createConnectionKey(connectionString).slice(0, 16);
}

function encodeConnectionString(connectionString: string): string {
  return Buffer.from(connectionString, "utf8").toString("base64url");
}

function decodeConnectionString(encodedValue: string): string {
  return Buffer.from(encodedValue, "base64url").toString("utf8");
}

export function parseConnectPayload(payload: unknown): { connectionString: string } {
  return connectPayloadSchema.parse(payload);
}

export function normalizeConnectionString(rawConnectionString: string): string {
  const trimmed = rawConnectionString.trim();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error("Connection string must be a valid PostgreSQL URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error("Connection string must start with postgres:// or postgresql://.");
  }

  if (!parsedUrl.searchParams.has("sslmode")) {
    parsedUrl.searchParams.set("sslmode", "require");
  }

  if (!parsedUrl.searchParams.has("application_name")) {
    parsedUrl.searchParams.set("application_name", "supabase-db-visualizer");
  }

  return parsedUrl.toString();
}

function getPool(connectionString: string): Pool {
  const connectionKey = createConnectionKey(connectionString);
  const existingPool = databaseState.pools.get(connectionKey);

  if (existingPool) {
    return existingPool;
  }

  const pool = new Pool({
    connectionString,
    max: 6,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  databaseState.pools.set(connectionKey, pool);
  return pool;
}

export function setConnectionCookies(response: NextResponse, connectionString: string): void {
  const encodedConnection = encodeConnectionString(connectionString);
  const signature = createSignature(encodedConnection);

  response.cookies.set({
    name: DB_CONNECTION_COOKIE,
    value: encodedConnection,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  response.cookies.set({
    name: DB_CONNECTION_SIGNATURE_COOKIE,
    value: signature,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function clearConnectionCookies(response: NextResponse): void {
  response.cookies.set({
    name: DB_CONNECTION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: DB_CONNECTION_SIGNATURE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readConnectionStringFromCookieStore(cookieStore: CookieReader): string | null {
  const encodedConnection = cookieStore.get(DB_CONNECTION_COOKIE)?.value;
  const signature = cookieStore.get(DB_CONNECTION_SIGNATURE_COOKIE)?.value;

  if (!encodedConnection || !signature) {
    return null;
  }

  if (!safeEquals(createSignature(encodedConnection), signature)) {
    return null;
  }

  try {
    return decodeConnectionString(encodedConnection);
  } catch {
    return null;
  }
}

function pushSlowQuery(connectionHash: string, sql: string, durationMs: number, error?: string): void {
  const entry: SlowQueryRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    sql,
    durationMs,
    recordedAt: new Date().toISOString(),
    connectionHash,
    error,
  };

  const existing = databaseState.slowQueries.get(connectionHash) ?? [];
  const updated = [entry, ...existing].slice(0, MAX_SLOW_QUERY_LOGS);
  databaseState.slowQueries.set(connectionHash, updated);
}

export function getSlowQueryLog(connectionHash: string): SlowQueryRecord[] {
  return databaseState.slowQueries.get(connectionHash) ?? [];
}

async function runTimedQuery<T extends QueryResultRow>(
  connectionString: string,
  sql: string,
  params: unknown[] = [],
): Promise<{ rows: T[]; rowCount: number; fields: FieldDef[]; durationMs: number }> {
  const pool = getPool(connectionString);
  const connectionHash = hashConnectionString(connectionString);

  const startedAt = Date.now();
  try {
    const result = await pool.query<T>(sql, params);
    const durationMs = Date.now() - startedAt;

    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      pushSlowQuery(connectionHash, sql, durationMs);
    }

    return {
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
      fields: result.fields,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      const message = error instanceof Error ? error.message : "Unknown database error";
      pushSlowQuery(connectionHash, sql, durationMs, message);
    }

    throw error;
  }
}

export async function testConnection(connectionString: string): Promise<{
  connectionHash: string;
  database: string;
  serverVersion: string;
  latencyMs: number;
}> {
  const result = await runTimedQuery<{
    current_database: string;
    server_version: string;
  }>(
    connectionString,
    "SELECT current_database() AS current_database, current_setting('server_version') AS server_version;",
  );

  return {
    connectionHash: hashConnectionString(connectionString),
    database: result.rows[0]?.current_database ?? "unknown",
    serverVersion: result.rows[0]?.server_version ?? "unknown",
    latencyMs: result.durationMs,
  };
}

type TableRow = {
  table_schema: string;
  table_name: string;
  row_count: string | number | null;
};

type ColumnRow = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  is_primary_key: boolean;
};

type ForeignKeyRow = {
  constraint_name: string;
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
};

export async function fetchSchemaSnapshot(connectionString: string): Promise<SchemaSnapshot> {
  const tables = await runTimedQuery<TableRow>(
    connectionString,
    `
      SELECT
        n.nspname AS table_schema,
        c.relname AS table_name,
        COALESCE(s.n_live_tup::bigint, c.reltuples::bigint, 0)::bigint AS row_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY n.nspname, c.relname;
    `,
  );

  const columns = await runTimedQuery<ColumnRow>(
    connectionString,
    `
      SELECT
        cols.table_schema,
        cols.table_name,
        cols.column_name,
        COALESCE(cols.udt_name, cols.data_type) AS data_type,
        cols.is_nullable = 'YES' AS is_nullable,
        cols.column_default,
        EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = cols.table_schema
            AND tc.table_name = cols.table_name
            AND kcu.column_name = cols.column_name
        ) AS is_primary_key
      FROM information_schema.columns cols
      WHERE cols.table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY cols.table_schema, cols.table_name, cols.ordinal_position;
    `,
  );

  const foreignKeys = await runTimedQuery<ForeignKeyRow>(
    connectionString,
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
      ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
    `,
  );

  const columnsByTable = new Map<string, ColumnInfo[]>();

  for (const row of columns.rows) {
    const key = `${row.table_schema}.${row.table_name}`;
    const bucket = columnsByTable.get(key) ?? [];

    bucket.push({
      schema: row.table_schema,
      table: row.table_name,
      name: row.column_name,
      dataType: row.data_type,
      nullable: row.is_nullable,
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
    });

    columnsByTable.set(key, bucket);
  }

  const tableEntries: TableInfo[] = tables.rows.map((row) => {
    const key = `${row.table_schema}.${row.table_name}`;
    const rowCount = typeof row.row_count === "string" ? Number(row.row_count) : Number(row.row_count ?? 0);

    return {
      schema: row.table_schema,
      name: row.table_name,
      rowCount: Number.isFinite(rowCount) ? rowCount : 0,
      columns: columnsByTable.get(key) ?? [],
    };
  });

  const fkEntries: ForeignKeyInfo[] = foreignKeys.rows.map((row) => ({
    constraintName: row.constraint_name,
    sourceSchema: row.source_schema,
    sourceTable: row.source_table,
    sourceColumn: row.source_column,
    targetSchema: row.target_schema,
    targetTable: row.target_table,
    targetColumn: row.target_column,
  }));

  return {
    connectionHash: hashConnectionString(connectionString),
    fetchedAt: new Date().toISOString(),
    tables: tableEntries,
    foreignKeys: fkEntries,
  };
}

function isReadOnlySql(sql: string): boolean {
  return /^\s*(select|with|explain)\b/i.test(sql);
}

function applyResultLimit(sql: string, limit: number): string {
  const cleanedSql = sql.trim().replace(/;+\s*$/, "");

  if (!/^\s*(select|with)\b/i.test(cleanedSql)) {
    return cleanedSql;
  }

  if (/\blimit\s+\d+/i.test(cleanedSql)) {
    return cleanedSql;
  }

  return `${cleanedSql}\nLIMIT ${limit}`;
}

function pruneExpiredCacheEntries(): void {
  const now = Date.now();

  for (const [cacheKey, entry] of databaseState.queryCache) {
    if (entry.expiresAt <= now) {
      databaseState.queryCache.delete(cacheKey);
    }
  }
}

export async function executeCachedReadOnlyQuery(
  connectionString: string,
  rawSql: string,
  resultLimit = DEFAULT_RESULT_LIMIT,
): Promise<QueryExecutionResult> {
  const sql = rawSql.trim();

  if (!sql) {
    throw new Error("SQL query is required.");
  }

  if (!isReadOnlySql(sql)) {
    throw new Error("Only SELECT, WITH, and EXPLAIN statements are allowed.");
  }

  const boundedLimit = Math.max(1, Math.min(resultLimit, MAX_QUERY_ROWS));
  const sqlWithLimit = applyResultLimit(sql, boundedLimit);

  const connectionKey = createConnectionKey(connectionString);
  const sqlKey = createHash("sha256").update(sqlWithLimit).digest("hex");
  const cacheKey = `${connectionKey}:${sqlKey}`;

  pruneExpiredCacheEntries();

  const cached = databaseState.queryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached.result,
      fromCache: true,
    };
  }

  const result = await runTimedQuery<Record<string, unknown>>(connectionString, sqlWithLimit);
  const columns: QueryColumn[] = result.fields.map((field) => ({
    name: field.name,
    dataTypeId: field.dataTypeID,
  }));

  const payload: QueryExecutionResult = {
    columns,
    rows: result.rows,
    rowCount: result.rowCount,
    durationMs: result.durationMs,
    executedAt: new Date().toISOString(),
    sqlExecuted: sqlWithLimit,
    fromCache: false,
  };

  databaseState.queryCache.set(cacheKey, {
    expiresAt: Date.now() + QUERY_CACHE_TTL_MS,
    result: payload,
  });

  return payload;
}
