"use client";

import { useState } from "react";
import { Activity, Database, GitBranch, RefreshCw, UserRound } from "lucide-react";

import ConnectionForm from "@/components/ConnectionForm";
import ERDDiagram from "@/components/ERDDiagram";
import QueryEditor from "@/components/QueryEditor";
import SchemaExplorer from "@/components/SchemaExplorer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConnectionSummary, DatabaseSchema } from "@/lib/types";

export default function DashboardApp() {
  const [connectionString, setConnectionString] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConnectionSummary | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSchema(activeConnectionString: string) {
    const response = await fetch("/api/schema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ connectionString: activeConnectionString })
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      schema?: DatabaseSchema;
    };

    if (!response.ok || !payload.ok || !payload.schema) {
      throw new Error(payload.error ?? "Schema introspection failed.");
    }

    setSchema(payload.schema);
  }

  async function connect(connectionStringInput: string) {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ connectionString: connectionStringInput })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        summary?: ConnectionSummary;
      };

      if (!response.ok || !payload.ok || !payload.summary) {
        throw new Error(payload.error ?? "Connection test failed.");
      }

      setConnectionString(connectionStringInput);
      setSummary(payload.summary);
      await loadSchema(connectionStringInput);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected connection error.");
      setConnectionString(null);
      setSummary(null);
      setSchema(null);
      throw caughtError;
    } finally {
      setIsConnecting(false);
    }
  }

  async function refreshSchema() {
    if (!connectionString) {
      return;
    }

    setIsRefreshingSchema(true);
    setError(null);

    try {
      await loadSchema(connectionString);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to refresh schema.");
    } finally {
      setIsRefreshingSchema(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-8 lg:px-10">
      <ConnectionForm onConnect={connect} isConnecting={isConnecting} />

      {error ? (
        <div className="rounded-lg border border-[#5a2e2e] bg-[#2a1515] px-4 py-3 text-sm text-[#ffc9c9]">
          {error}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#30363d] bg-[#101722]">
            <CardContent className="flex items-center gap-3 p-4">
              <Database className="h-5 w-5 text-[#58a6ff]" />
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">Database</p>
                <p className="text-sm font-semibold text-[#e6edf3]">{summary.database}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#30363d] bg-[#101722]">
            <CardContent className="flex items-center gap-3 p-4">
              <UserRound className="h-5 w-5 text-[#58a6ff]" />
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">Role</p>
                <p className="text-sm font-semibold text-[#e6edf3]">{summary.user}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#30363d] bg-[#101722]">
            <CardContent className="flex items-center gap-3 p-4">
              <Activity className="h-5 w-5 text-[#58a6ff]" />
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">Version</p>
                <p className="text-sm font-semibold text-[#e6edf3]">{summary.postgresVersion}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#30363d] bg-[#101722]">
            <CardContent className="flex items-center gap-3 p-4">
              <GitBranch className="h-5 w-5 text-[#58a6ff]" />
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">Tables</p>
                <p className="text-sm font-semibold text-[#e6edf3]">{summary.tableCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {schema ? (
        <>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={refreshSchema}
              disabled={isRefreshingSchema}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingSchema ? "animate-spin" : ""}`} />
              {isRefreshingSchema ? "Refreshing schema..." : "Refresh schema"}
            </Button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
            <SchemaExplorer schema={schema} />
            <ERDDiagram schema={schema} />
          </div>

          {connectionString ? <QueryEditor connectionString={connectionString} /> : null}
        </>
      ) : null}
    </div>
  );
}
