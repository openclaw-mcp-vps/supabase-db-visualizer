"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Link2, TableProperties } from "lucide-react";
import { ConnectionForm } from "@/components/ConnectionForm";
import { ERDViewer } from "@/components/ERDViewer";
import { QueryEditor } from "@/components/QueryEditor";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import type { SlowQueryEntry } from "@/lib/query-cache";
import type { ParsedSchema } from "@/lib/schema-parser";

type SchemaApiPayload = {
  ok: boolean;
  schema?: ParsedSchema;
  slowQueries?: SlowQueryEntry[];
  error?: string;
};

export function DashboardWorkspace() {
  const [schema, setSchema] = useState<ParsedSchema | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQueryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSchema = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/schema", {
        method: "GET",
        cache: "no-store"
      });

      const payload = (await response.json()) as SchemaApiPayload;

      if (!response.ok || !payload.ok || !payload.schema) {
        if (response.status === 401) {
          setSchema(null);
          setSlowQueries([]);
          setLoading(false);
          return;
        }

        throw new Error(payload.error || "Failed to load schema.");
      }

      setSchema(payload.schema);
      setSlowQueries(payload.slowQueries ?? []);
    } catch (caught) {
      setSchema(null);
      setSlowQueries([]);
      setError(caught instanceof Error ? caught.message : "Failed to load schema.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSchema();
  }, [refreshSchema]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Supabase DB Visualizer</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
          ERD + Query Explorer + Row Counts in one shared dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--text-secondary)] md:text-base">
          Connect a Supabase Postgres URL, inspect table relationships, run cached read-only SQL, and monitor slow query activity without opening multiple tools.
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Tables</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold">
            <TableProperties className="h-5 w-5 text-[#2f81f7]" />
            {schema?.tableCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Relationships</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold">
            <Link2 className="h-5 w-5 text-[#2f81f7]" />
            {schema?.relationshipCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Logged Slow Queries</p>
          <p className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold">
            <Activity className="h-5 w-5 text-[#2f81f7]" />
            {slowQueries.length}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <ConnectionForm
          onConnected={async () => {
            await refreshSchema();
          }}
          onDisconnected={async () => {
            setSchema(null);
            setSlowQueries([]);
          }}
        />
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[#ff9c95]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-secondary)]">
          Loading schema and query history...
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr)]">
        <div className="space-y-6">
          <ERDViewer nodes={schema?.erd.nodes ?? []} edges={schema?.erd.edges ?? []} />
          <QueryEditor slowQueries={slowQueries} onSlowQueriesChange={setSlowQueries} />
        </div>

        <div>
          <SchemaExplorer tables={schema?.tables ?? []} />
        </div>
      </div>
    </main>
  );
}
