"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DatabaseSchema } from "@/lib/types";

type SchemaExplorerProps = {
  schema: DatabaseSchema;
};

export default function SchemaExplorer({ schema }: SchemaExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string>(schema.tables[0]?.id ?? "");

  const filteredTables = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const sorted = [...schema.tables].sort((a, b) => a.id.localeCompare(b.id));

    if (!needle) {
      return sorted;
    }

    return sorted.filter((table) => {
      return (
        table.name.toLowerCase().includes(needle) ||
        table.schema.toLowerCase().includes(needle) ||
        table.columns.some((column) => column.name.toLowerCase().includes(needle))
      );
    });
  }, [schema.tables, searchTerm]);

  const selectedTable =
    filteredTables.find((table) => table.id === selectedTableId) ?? filteredTables[0] ?? null;

  return (
    <Card className="h-full border-[#30363d] bg-[#0f141b]">
      <CardHeader>
        <CardTitle className="text-base">Schema Explorer</CardTitle>
        <CardDescription>
          Search tables and inspect columns with PK/FK context and estimated row volume.
        </CardDescription>
        <Input
          placeholder="Search tables or columns"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="max-h-[380px] space-y-1 overflow-y-auto rounded-md border border-[#30363d] bg-[#0e151f] p-2">
          {filteredTables.map((table) => (
            <button
              key={table.id}
              type="button"
              className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition ${
                selectedTable?.id === table.id
                  ? "bg-[#1f324f] text-[#e6edf3]"
                  : "text-[#9da7b3] hover:bg-[#162130]"
              }`}
              onClick={() => setSelectedTableId(table.id)}
            >
              <p className="font-medium">{table.name}</p>
              <p className="text-xs text-[#8b949e]">{table.schema}</p>
            </button>
          ))}
          {!filteredTables.length ? (
            <p className="p-2 text-sm text-[#8b949e]">No tables match this filter.</p>
          ) : null}
        </div>

        {selectedTable ? (
          <div className="rounded-md border border-[#30363d] bg-[#0e151f] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm uppercase tracking-wide text-[#8b949e]">{selectedTable.schema}</p>
                <h3 className="text-lg font-semibold text-[#e6edf3]">{selectedTable.name}</h3>
              </div>
              <Badge variant="muted">~{(selectedTable.rowEstimate ?? 0).toLocaleString()} rows</Badge>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto">
              {selectedTable.columns.map((column) => (
                <div
                  key={column.name}
                  className="flex items-center justify-between gap-2 rounded-md border border-[#273140] bg-[#111b29] p-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#d2d9e1]">{column.name}</p>
                    <p className="text-xs text-[#8b949e]">
                      {column.isNullable ? "nullable" : "not null"}
                      {column.defaultValue ? ` • default: ${column.defaultValue}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {column.isPrimaryKey ? <Badge variant="success">PK</Badge> : null}
                    <Badge variant="default">{column.dataType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-[#30363d] bg-[#0e151f] p-4 text-sm text-[#8b949e]">
            Select a table to inspect columns.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
