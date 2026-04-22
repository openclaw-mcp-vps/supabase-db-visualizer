"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "sql-formatter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { QueryExecution } from "@/lib/types";

const STORAGE_KEY = "sbv-slow-query-log";

type SlowQueryLog = {
  sql: string;
  durationMs: number;
  recordedAt: string;
};

type QueryEditorProps = {
  connectionString: string;
};

export default function QueryEditor({ connectionString }: QueryEditorProps) {
  const [sql, setSql] = useState(
    "SELECT table_schema, table_name, n_live_tup\nFROM pg_stat_user_tables\nORDER BY n_live_tup DESC;"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryExecution | null>(null);
  const [slowQueryLog, setSlowQueryLog] = useState<SlowQueryLog[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SlowQueryLog[];
        setSlowQueryLog(parsed.slice(0, 12));
      }
    } catch {
      setSlowQueryLog([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slowQueryLog));
  }, [slowQueryLog]);

  const chartData = useMemo(() => {
    return [...slowQueryLog]
      .slice(0, 8)
      .reverse()
      .map((entry, index) => ({
        name: `Q${index + 1}`,
        durationMs: entry.durationMs
      }));
  }, [slowQueryLog]);

  async function runQuery() {
    if (!sql.trim()) {
      setError("Write a SQL statement before running.");
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          connectionString,
          sql
        })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        result?: QueryExecution;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error ?? "Failed to run query.");
      }

      setResult(payload.result);

      if (payload.result.isSlowQuery) {
        setSlowQueryLog((prev) => {
          const next = [
            {
              sql: payload.result?.executedSql ?? sql,
              durationMs: payload.result?.durationMs ?? 0,
              recordedAt: new Date().toISOString()
            },
            ...prev
          ];
          return next.slice(0, 12);
        });
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected query error.");
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }

  function formatSql() {
    try {
      setSql((prev) => format(prev, { language: "postgresql" }));
      setError(null);
    } catch {
      setError("Could not format SQL. Check statement syntax.");
    }
  }

  return (
    <Card className="border-[#30363d] bg-[#0f141b]">
      <CardHeader>
        <CardTitle className="text-lg">Query Explorer</CardTitle>
        <CardDescription>
          Read-only runner for diagnostics (`SELECT`, `WITH`, `EXPLAIN`). Queries without a
          LIMIT automatically get `LIMIT 200`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={sql} onChange={(event) => setSql(event.target.value)} className="min-h-44" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={runQuery} disabled={isRunning}>
            {isRunning ? "Running..." : "Run query"}
          </Button>
          <Button type="button" variant="secondary" onClick={formatSql}>
            Format SQL
          </Button>
        </div>
        {error ? <p className="text-sm text-[#ff8a8a]">{error}</p> : null}

        {result ? (
          <div className="space-y-4 rounded-lg border border-[#30363d] bg-[#111824] p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={result.isSlowQuery ? "default" : "success"}>
                {result.isSlowQuery ? "Slow query" : "Healthy runtime"}
              </Badge>
              <Badge variant="muted">{result.durationMs} ms</Badge>
              <Badge variant="muted">{result.rowCount.toLocaleString()} rows</Badge>
            </div>
            <p className="text-xs text-[#8b949e] whitespace-pre-wrap">{result.executedSql}</p>

            {result.columns.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.columns.map((columnName) => (
                      <TableHead key={columnName}>{columnName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.slice(0, 50).map((row, index) => (
                    <TableRow key={index}>
                      {result.columns.map((columnName) => (
                        <TableCell key={`${index}-${columnName}`}>
                          {String(row[columnName] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-[#8b949e]">Query returned no tabular columns.</p>
            )}
          </div>
        ) : null}

        <div className="rounded-lg border border-[#30363d] bg-[#111824] p-4">
          <h3 className="text-sm font-semibold text-[#e6edf3]">Slow-query log</h3>
          <p className="mb-3 mt-1 text-xs text-[#8b949e]">
            Captures statements that run for 750ms or longer in this browser session.
          </p>

          {chartData.length ? (
            <div className="h-52 w-full">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24303d" />
                  <XAxis dataKey="name" stroke="#8b949e" />
                  <YAxis stroke="#8b949e" />
                  <Tooltip
                    cursor={{ fill: "rgba(47, 129, 247, 0.15)" }}
                    contentStyle={{
                      background: "#0f141b",
                      border: "1px solid #30363d",
                      color: "#e6edf3"
                    }}
                  />
                  <Bar dataKey="durationMs" fill="#2f81f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[#8b949e]">No slow queries recorded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
