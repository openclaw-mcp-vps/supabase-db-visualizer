"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Loader2, Play } from "lucide-react";

import type { QueryExecutionResult, SlowQueryRecord } from "@/types/database";

interface QueryEditorProps {
  onSlowQueriesUpdate: (slowQueries: SlowQueryRecord[]) => void;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function QueryEditor({ onSlowQueriesUpdate }: QueryEditorProps) {
  const [sql, setSql] = useState(
    "SELECT table_schema, table_name, table_type\nFROM information_schema.tables\nWHERE table_schema NOT IN ('information_schema', 'pg_catalog')\nORDER BY table_schema, table_name;",
  );
  const [limit, setLimit] = useState(200);
  const [result, setResult] = useState<QueryExecutionResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runQuery = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, limit }),
      });

      const payload = (await response.json()) as {
        error?: string;
        result?: QueryExecutionResult;
        slowQueries?: SlowQueryRecord[];
      };

      if (!response.ok || !payload.result) {
        setError(payload.error || "Unable to execute query.");
        return;
      }

      setResult(payload.result);
      onSlowQueriesUpdate(payload.slowQueries ?? []);
    } catch {
      setError("Query request failed due to a network issue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#29374d] bg-[#101827]/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Query Explorer</h2>
        <div className="flex items-center gap-2 text-xs text-[#8da5bd]">
          <label htmlFor="query-limit">Result Limit</label>
          <input
            id="query-limit"
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="w-20 rounded border border-[#31435a] bg-[#0f1724] px-2 py-1 text-right text-[#d6e3ef] outline-none"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-[#89a1ba]">
        Read-only statements only: SELECT, WITH, and EXPLAIN are allowed. Query responses are briefly cached.
      </p>

      <div className="mt-4 overflow-hidden rounded-lg border border-[#253347]">
        <Editor
          height="260px"
          defaultLanguage="sql"
          value={sql}
          onChange={(value) => setSql(value ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runQuery}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#35c8ff] px-4 py-2 text-sm font-semibold text-[#032435] transition hover:bg-[#60d4ff] disabled:cursor-not-allowed disabled:bg-[#1e495a] disabled:text-[#90b6cb]"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Query
        </button>
        {error ? <span className="text-xs text-[#f39ca2]">{error}</span> : null}
      </div>

      {result ? (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-4 text-xs text-[#8ca5bc]">
            <span>Rows: {result.rowCount.toLocaleString()}</span>
            <span>Duration: {result.durationMs}ms</span>
            <span>Cache: {result.fromCache ? "hit" : "miss"}</span>
            <span>Executed: {new Date(result.executedAt).toLocaleTimeString()}</span>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-lg border border-[#253347]">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-[#121c2c] text-[#b6c8da]">
                <tr>
                  {result.columns.map((column) => (
                    <th key={column.name} className="border-b border-[#253347] px-3 py-2 font-semibold">
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="odd:bg-[#101928] even:bg-[#0f1623]">
                    {result.columns.map((column) => (
                      <td
                        key={`${rowIndex}-${column.name}`}
                        className="max-w-[340px] border-b border-[#1f2d3f] px-3 py-2 font-mono text-[#d8e5f0]"
                      >
                        {formatCell(row[column.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
