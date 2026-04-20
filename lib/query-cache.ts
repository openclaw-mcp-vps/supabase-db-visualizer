import type { QueryExecutionResult } from "@/lib/db-client";

export type QueryPayload = QueryExecutionResult & {
  cached: boolean;
  executedAt: string;
};

export type SlowQueryEntry = {
  sql: string;
  durationMs: number;
  rowCount: number;
  executedAt: string;
};

type CacheEntry = {
  expiresAt: number;
  payload: QueryPayload;
};

const QUERY_TTL_MS = 45_000;
const SLOW_QUERY_THRESHOLD_MS = 750;
const MAX_SLOW_LOGS = 30;

const queryCache = new Map<string, CacheEntry>();
const slowQueryLog = new Map<string, SlowQueryEntry[]>();

function cacheKey(connectionFingerprint: string, sql: string): string {
  return `${connectionFingerprint}:${sql}`;
}

export function getCachedQuery(connectionFingerprint: string, sql: string): QueryPayload | null {
  const key = cacheKey(connectionFingerprint, sql);
  const entry = queryCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    queryCache.delete(key);
    return null;
  }

  return {
    ...entry.payload,
    cached: true
  };
}

export function setCachedQuery(connectionFingerprint: string, sql: string, payload: QueryPayload): void {
  const key = cacheKey(connectionFingerprint, sql);
  queryCache.set(key, {
    expiresAt: Date.now() + QUERY_TTL_MS,
    payload
  });
}

export function trackSlowQuery(
  connectionFingerprint: string,
  sql: string,
  durationMs: number,
  rowCount: number
): void {
  if (durationMs < SLOW_QUERY_THRESHOLD_MS) {
    return;
  }

  const next: SlowQueryEntry = {
    sql,
    durationMs,
    rowCount,
    executedAt: new Date().toISOString()
  };

  const current = slowQueryLog.get(connectionFingerprint) ?? [];
  current.unshift(next);
  slowQueryLog.set(connectionFingerprint, current.slice(0, MAX_SLOW_LOGS));
}

export function slowQueriesForConnection(connectionFingerprint: string): SlowQueryEntry[] {
  return slowQueryLog.get(connectionFingerprint) ?? [];
}

export function resetConnectionCache(connectionFingerprint: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${connectionFingerprint}:`)) {
      queryCache.delete(key);
    }
  }

  slowQueryLog.delete(connectionFingerprint);
}
