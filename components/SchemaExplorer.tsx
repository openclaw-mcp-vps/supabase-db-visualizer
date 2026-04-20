"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Database, KeyRound, Search } from "lucide-react";
import type { SchemaTable } from "@/lib/schema-parser";

type SchemaExplorerProps = {
  tables: SchemaTable[];
};

export function SchemaExplorer({ tables }: SchemaExplorerProps) {
  const [query, setQuery] = useState("");

  const filteredTables = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return tables;
    }

    return tables.filter((table) => {
      const tableMatch = table.fullName.toLowerCase().includes(normalized);
      const columnMatch = table.columns.some((column) => column.name.toLowerCase().includes(normalized));
      return tableMatch || columnMatch;
    });
  }, [query, tables]);

  const chartData = useMemo(() => {
    return [...tables]
      .sort((a, b) => b.rowEstimate - a.rowEstimate)
      .slice(0, 8)
      .map((table) => ({
        name: table.name,
        rows: table.rowEstimate
      }));
  }, [tables]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl shadow-black/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Schema Browser</p>
          <h3 className="mt-1 text-lg font-semibold">Tables, Columns, and Row Estimates</h3>
        </div>

        <label className="relative block w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tables or columns"
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[#0f141c] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[#5f6b7a]"
          />
        </label>
      </div>

      <div className="mb-5 h-52 rounded-lg border border-[var(--border)] bg-[#0f141c] px-3 py-2">
        <p className="mb-2 text-xs text-[var(--text-secondary)]">Top tables by estimated row count</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2732" />
            <XAxis dataKey="name" stroke="#7d8897" tick={{ fontSize: 11 }} />
            <YAxis stroke="#7d8897" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "10px",
                color: "#f0f6fc"
              }}
            />
            <Bar dataKey="rows" fill="#2f81f7" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {filteredTables.map((table) => (
          <article key={table.id} className="rounded-lg border border-[var(--border)] bg-[#0f141c] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Database className="h-4 w-4 text-[#2f81f7]" />
                {table.fullName}
              </h4>
              <span className="text-xs text-[var(--text-secondary)]">
                {table.rowEstimate.toLocaleString()} estimated rows
              </span>
            </div>

            <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
              {table.columns.map((column) => (
                <li key={`${table.id}-${column.name}`} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{column.name}</span>
                  <span>{column.dataType}</span>
                  {column.isPrimaryKey ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#1b2d47] px-1.5 py-0.5 text-[#7cb4ff]">
                      <KeyRound className="h-3 w-3" /> PK
                    </span>
                  ) : null}
                  <span>{column.nullable ? "nullable" : "required"}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}

        {filteredTables.length === 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[#0f141c] px-4 py-5 text-sm text-[var(--text-secondary)]">
            No tables matched "{query}".
          </div>
        )}
      </div>
    </section>
  );
}
