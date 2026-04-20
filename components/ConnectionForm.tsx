"use client";

import { type FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Plug, Unplug, XCircle } from "lucide-react";

type ConnectionSummary = {
  database: string;
  schema: string;
  version: string;
  serverTime: string;
};

type ConnectionFormProps = {
  onConnected: () => Promise<void> | void;
  onDisconnected: () => Promise<void> | void;
};

export function ConnectionForm({ onConnected, onDisconnected }: ConnectionFormProps) {
  const [connectionString, setConnectionString] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConnectionSummary | null>(null);

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!connectionString.trim()) {
      setError("Paste your Supabase Postgres URL to connect.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ connectionString })
      });

      const payload = (await response.json()) as {
        ok: boolean;
        summary?: ConnectionSummary;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.summary) {
        throw new Error(payload.error || "Connection failed.");
      }

      setSummary(payload.summary);
      await onConnected();
    } catch (caught) {
      setSummary(null);
      setError(caught instanceof Error ? caught.message : "Connection failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/connect", { method: "DELETE" });
      setSummary(null);
      setConnectionString("");
      await onDisconnected();
    } catch {
      setError("Unable to disconnect right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">Connection</p>
          <h2 className="mt-1 text-xl font-semibold">Supabase Postgres URL</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            We keep credentials on the server in an encrypted, httpOnly cookie. Nothing is stored in localStorage.
          </p>
        </div>
      </div>

      <form onSubmit={handleConnect} className="space-y-3">
        <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="connectionString">
          Connection String
        </label>
        <input
          id="connectionString"
          autoComplete="off"
          spellCheck={false}
          value={connectionString}
          onChange={(event) => setConnectionString(event.target.value)}
          placeholder="postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres"
          className="h-12 w-full rounded-lg border border-[var(--border)] bg-[#0f141c] px-4 text-sm text-[var(--text-primary)] placeholder:text-[#5f6b7a]"
          type="password"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={loading}
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
            Connect Database
          </button>

          <button
            disabled={loading || !summary}
            type="button"
            onClick={handleDisconnect}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[#1d2430] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Unplug className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[#ff9c95]">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-4 rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 p-3 text-sm text-[#a2f5ab]">
          <p className="mb-2 inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Connected successfully
          </p>
          <ul className="space-y-1 text-xs text-[#98dba0]">
            <li>Database: {summary.database}</li>
            <li>Default schema: {summary.schema}</li>
            <li>Server time: {summary.serverTime}</li>
            <li className="truncate">Version: {summary.version}</li>
          </ul>
        </div>
      )}
    </section>
  );
}
