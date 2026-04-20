"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { SchemaSnapshot } from "@/types/database";

interface SchemaExplorerProps {
  snapshot: SchemaSnapshot;
}

export function SchemaExplorer({ snapshot }: SchemaExplorerProps) {
  const [search, setSearch] = useState("");

  const filteredTables = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return snapshot.tables;
    }

    return snapshot.tables.filter((table) => {
      const tableName = `${table.schema}.${table.name}`.toLowerCase();
      return tableName.includes(searchTerm);
    });
  }, [search, snapshot.tables]);

  const chartData = useMemo(() => {
    return [...snapshot.tables]
      .sort((left, right) => right.rowCount - left.rowCount)
      .slice(0, 8)
      .map((table) => ({
        name: `${table.schema}.${table.name}`,
        rowCount: table.rowCount,
      }));
  }, [snapshot.tables]);

  return (
    <section className="rounded-2xl border border-[#29374d] bg-[#101827]/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Schema Explorer</h2>
        <span className="text-xs text-[#8ea5bc]">
          {snapshot.tables.length} tables • {snapshot.foreignKeys.length} foreign keys
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#27354a] bg-[#0f1826] p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-[#7f96ad]">Largest Tables by Estimated Rows</p>
        <div className="h-44 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#223247" />
              <XAxis dataKey="name" tick={{ fill: "#91a7bd", fontSize: 10 }} interval={0} angle={-18} height={55} />
              <Tooltip
                contentStyle={{
                  background: "#111a29",
                  borderColor: "#2a3a50",
                  color: "#d8e6f4",
                }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Bar dataKey="rowCount" fill="#35c8ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <label htmlFor="table-search" className="mt-4 block text-xs uppercase tracking-wide text-[#7f96ad]">
        Filter Tables
      </label>
      <input
        id="table-search"
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="public.users"
        className="mt-2 w-full rounded-lg border border-[#2a3b4e] bg-[#0f1724] px-3 py-2 text-sm text-[#dce8f4] outline-none transition focus:border-[#35c8ff]"
      />

      <div className="mt-4 max-h-[500px] space-y-3 overflow-auto pr-1">
        {filteredTables.map((table) => (
          <article key={`${table.schema}.${table.name}`} className="rounded-lg border border-[#263549] bg-[#0f1725] p-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-mono text-sm font-semibold text-[#e5eef7]">{table.schema}.{table.name}</h3>
              <span className="text-xs text-[#8aa3bc]">~{table.rowCount.toLocaleString()} rows</span>
            </div>
            <div className="mt-2 grid gap-1">
              {table.columns.slice(0, 10).map((column) => (
                <p key={`${table.schema}.${table.name}.${column.name}`} className="font-mono text-xs text-[#9db1c6]">
                  <span className="text-[#d6e4f2]">{column.name}</span>: {column.dataType}
                  {column.isPrimaryKey ? " [pk]" : ""}
                  {column.nullable ? "" : " [not null]"}
                </p>
              ))}
              {table.columns.length > 10 ? (
                <p className="text-xs text-[#7790a7]">+{table.columns.length - 10} additional columns</p>
              ) : null}
            </div>
          </article>
        ))}

        {!filteredTables.length ? <p className="text-sm text-[#8ea5bc]">No tables matched this filter.</p> : null}
      </div>
    </section>
  );
}
