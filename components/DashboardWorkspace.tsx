"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { ConnectionForm, type ConnectionDetails } from "@/components/ConnectionForm";
import { ERDDiagram } from "@/components/ERDDiagram";
import { QueryEditor } from "@/components/QueryEditor";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import type { ERDDiagramData, SchemaSnapshot, SlowQueryRecord } from "@/types/database";

type SchemaResponse = {
  schema?: SchemaSnapshot;
  erd?: ERDDiagramData;
  slowQueries?: SlowQueryRecord[];
  error?: string;
};

export function DashboardWorkspace() {
  const [schema, setSchema] = useState<SchemaSnapshot | null>(null);
  const [erd, setErd] = useState<ERDDiagramData | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQueryRecord[]>([]);
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [error, setError] = useState("");

  const refreshSchema = useCallback(async () => {
    setError("");
    setIsLoadingSchema(true);

    try {
      const response = await fetch("/api/schema", {
        cache: "no-store",
      });

      const payload = (await response.json()) as SchemaResponse;

      if (!response.ok || !payload.schema || !payload.erd) {
        setSchema(null);
        setErd(null);
        if (response.status !== 400) {
          setError(payload.error || "Schema refresh failed.");
        }
        return;
      }

      setSchema(payload.schema);
      setErd(payload.erd);
      setSlowQueries(payload.slowQueries ?? []);
    } catch {
      setError("Could not fetch schema. Verify connection and retry.");
    } finally {
      setIsLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    void refreshSchema();
  }, [refreshSchema]);

  const handleConnected = (connectionDetails: ConnectionDetails) => {
    setConnection(connectionDetails);
    void refreshSchema();
  };

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-[#2a3a4f] bg-[#101827]/90 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Supabase DB Dashboard</h1>
            <p className="mt-1 text-sm text-[#96acc1]">
              Explore schema structure, visualize relationships, run cached read-only SQL, and review slow-query history.
            </p>
            {connection ? (
              <p className="mt-2 text-xs text-[#7f98b2]">
                Connected to <span className="font-mono text-[#b4c7da]">{connection.database}</span> • hash {" "}
                <span className="font-mono">{connection.connectionHash}</span> • {connection.latencyMs}ms latency
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void refreshSchema()}
              disabled={isLoadingSchema}
              className="inline-flex items-center gap-2 rounded-lg border border-[#33475f] px-3 py-2 text-sm text-[#d7e3ef] transition hover:border-[#35c8ff] hover:text-[#35c8ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingSchema ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Schema
            </button>
            <Link
              href="/"
              className="rounded-lg border border-[#33475f] px-3 py-2 text-sm text-[#c6d6e6] transition hover:border-[#35c8ff] hover:text-[#35c8ff]"
            >
              Pricing & Billing
            </Link>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-[#f2a1a9]">{error}</p> : null}
      </header>

      <div className="space-y-6">
        <ConnectionForm onConnected={handleConnected} />

        {schema && erd ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
              <SchemaExplorer snapshot={schema} />
              <ERDDiagram diagram={erd} />
            </div>

            <QueryEditor onSlowQueriesUpdate={setSlowQueries} />

            <section className="rounded-2xl border border-[#29374d] bg-[#101827]/90 p-5">
              <h2 className="text-lg font-semibold text-white">Slow Query Log</h2>
              <p className="mt-2 text-xs text-[#8ca4bc]">
                Captures statements executed from this workspace that exceeded the slow-query threshold.
              </p>

              <div className="mt-4 space-y-2">
                {slowQueries.length ? (
                  slowQueries.slice(0, 12).map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-[#27354a] bg-[#0f1724] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8ea5bc]">
                        <span>{new Date(entry.recordedAt).toLocaleString()}</span>
                        <span className="font-semibold text-[#f1c17b]">{entry.durationMs}ms</span>
                      </div>
                      <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-[#d8e6f3]">
                        {entry.sql}
                      </pre>
                      {entry.error ? <p className="mt-2 text-xs text-[#f29ea8]">{entry.error}</p> : null}
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[#8ea5bc]">No slow queries recorded yet in this session.</p>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-[#29374d] bg-[#101827]/90 p-5">
            <h2 className="text-lg font-semibold text-white">Awaiting Connection</h2>
            <p className="mt-2 text-sm text-[#95aac0]">
              Connect your Supabase database above to unlock ERD generation, schema browsing, query execution, and slow-query
              logging.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
