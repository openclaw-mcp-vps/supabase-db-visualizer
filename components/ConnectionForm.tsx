"use client";

import { FormEvent, useState } from "react";
import { Database, Loader2 } from "lucide-react";

export interface ConnectionDetails {
  connectionHash: string;
  database: string;
  serverVersion: string;
  latencyMs: number;
}

interface ConnectionFormProps {
  onConnected: (connection: ConnectionDetails) => void;
}

export function ConnectionForm({ onConnected }: ConnectionFormProps) {
  const [connectionString, setConnectionString] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setStatus("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionString }),
      });

      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        connection?: ConnectionDetails;
      };

      if (!response.ok || !payload.connection) {
        setError(payload.error || "Could not establish database connection.");
        return;
      }

      setStatus(payload.message || "Connection established.");
      onConnected(payload.connection);
    } catch {
      setError("Connection request failed. Verify your URL and network access.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#2c3a4f] bg-[#101827]/90 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-5 w-5 text-[#35c8ff]" />
        <h2 className="text-lg font-semibold text-white">Connect Supabase Database</h2>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-[#9fb0c3]">
        Paste the direct PostgreSQL connection URL from your Supabase project settings. The URL stays server-side and is
        never exposed in browser storage.
      </p>
      <label htmlFor="connection-string" className="mb-2 block text-xs uppercase tracking-wide text-[#8fa5bb]">
        Supabase PostgreSQL URL
      </label>
      <textarea
        id="connection-string"
        value={connectionString}
        onChange={(event) => setConnectionString(event.target.value)}
        placeholder="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
        className="min-h-28 w-full rounded-lg border border-[#2a3b4f] bg-[#0f1724] p-3 font-mono text-sm text-[#dce7f1] outline-none transition focus:border-[#35c8ff]"
        required
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#35c8ff] px-4 py-2 text-sm font-semibold text-[#052436] transition hover:bg-[#60d4ff] disabled:cursor-not-allowed disabled:bg-[#1e495a] disabled:text-[#8db5ca]"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Test & Save Connection
        </button>
        {status ? <span className="text-xs text-[#8fd2a5]">{status}</span> : null}
        {error ? <span className="text-xs text-[#f59ca2]">{error}</span> : null}
      </div>
    </form>
  );
}
