"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Loader2, Play, Timer } from "lucide-react";
import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/ext-language_tools";

type QueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  durationMs: number;
  cached: boolean;
  executedAt: string;
};

type SlowQueryEntry = {
  sql: string;
  durationMs: number;
  rowCount: number;
  executedAt: string;
};

type QueryEditorProps = {
  slowQueries: SlowQueryEntry[];
  onSlowQueriesChange: (entries: SlowQueryEntry[]) => void;
};

const AceEditor = dynamic(async () => (await import("react-ace")).default, {
  ssr: false
});

function renderCell(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function QueryEditor({ slowQueries, onSlowQueriesChange }: QueryEditorProps) {
  const [sql, setSql] = useState(
    "SELECT table_schema, table_name, table_type\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY table_name;"
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recentSlowQueries = useMemo(() => slowQueries.slice(0, 6), [slowQueries]);

  async function runQuery() {
    if (!sql.trim()) {
      setError("Write a SQL query first.");
      return;
    }

    setRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sql, limit: 300 })
      });

      const payload = (await response.json()) as {
        ok: boolean;
        result?: QueryResult;
        slowQueries?: SlowQueryEntry[];
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error || "Query failed.");
      }

      setResult(payload.result);
      onSlowQueriesChange(payload.slowQueries ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Query failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl shadow-black/20">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Query Explorer</p>
          <h3 className="mt-1 text-lg font-semibold">Run Read-Only SQL</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Supports <code>SELECT</code>, <code>WITH</code>, and <code>EXPLAIN</code>. Results are cached for 45 seconds.
          </p>
        </div>

        <button
          onClick={runQuery}
          disabled={running}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Query
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <AceEditor
          mode="sql"
          theme="twilight"
          name="sql-editor"
          value={sql}
          onChange={setSql}
          width="100%"
          height="220px"
          fontSize={14}
          showPrintMargin={false}
          setOptions={{
            showLineNumbers: true,
            tabSize: 2,
            enableLiveAutocompletion: true,
            useWorker: false
          }}
        />
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[#ff9c95]">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="rounded-md border border-[var(--border)] bg-[#0f141c] px-2 py-1">
              {result.rowCount.toLocaleString()} rows
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[#0f141c] px-2 py-1">
              <Timer className="h-3.5 w-3.5" />
              {result.durationMs} ms
            </span>
            <span className="rounded-md border border-[var(--border)] bg-[#0f141c] px-2 py-1">
              {result.cached ? "cache hit" : "live query"}
            </span>
            <span className="rounded-md border border-[var(--border)] bg-[#0f141c] px-2 py-1">
              {new Date(result.executedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[#0f141c]">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {result.columns.map((column) => (
                    <th key={column} className="px-3 py-2 font-semibold text-[var(--text-primary)]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 300).map((row, index) => (
                  <tr key={`row-${index}`} className="border-b border-[var(--border)]/50 align-top">
                    {result.columns.map((column) => (
                      <td key={`${index}-${column}`} className="max-w-[280px] px-3 py-2 text-[var(--text-secondary)]">
                        <pre className="whitespace-pre-wrap break-words">{renderCell(row[column])}</pre>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] bg-[#0f141c] p-3">
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Slow Query Log</p>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
          {recentSlowQueries.length === 0 ? (
            <li>No slow queries yet. Entries appear when runtime exceeds 750ms.</li>
          ) : (
            recentSlowQueries.map((entry, index) => (
              <li key={`${entry.executedAt}-${index}`} className="rounded border border-[var(--border)]/70 bg-[#111925] p-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{entry.durationMs} ms</span>
                  <span>{entry.rowCount.toLocaleString()} rows</span>
                  <span>{new Date(entry.executedAt).toLocaleTimeString()}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words">{entry.sql}</pre>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
