"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType, MiniMap, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

import type { DatabaseSchema } from "@/lib/types";

type ERDDiagramProps = {
  schema: DatabaseSchema;
};

function prettyRowEstimate(value: number | null) {
  if (value === null) {
    return "n/a";
  }

  return value.toLocaleString();
}

export default function ERDDiagram({ schema }: ERDDiagramProps) {
  const { nodes, edges } = useMemo(() => {
    const schemaOrder = Array.from(new Set(schema.tables.map((table) => table.schema))).sort();

    const localNodes: Node[] = schema.tables.map((table, index) => {
      const schemaOffset = schemaOrder.indexOf(table.schema);
      const column = index % 3;
      const row = Math.floor(index / 3);

      return {
        id: table.id,
        position: {
          x: column * 360 + schemaOffset * 24,
          y: row * 260
        },
        data: {
          label: (
            <div className="w-[280px]">
              <div className="mb-2 border-b border-[#30363d] pb-2">
                <p className="text-xs uppercase tracking-wide text-[#8b949e]">{table.schema}</p>
                <p className="font-semibold text-[#e6edf3]">{table.name}</p>
                <p className="text-xs text-[#8b949e]">~{prettyRowEstimate(table.rowEstimate)} rows</p>
              </div>
              <ul className="space-y-1 text-xs">
                {table.columns.slice(0, 8).map((columnDef) => (
                  <li key={columnDef.name} className="flex items-center justify-between gap-2 text-[#c9d1d9]">
                    <span className="truncate">
                      {columnDef.name}
                      {columnDef.isPrimaryKey ? " (PK)" : ""}
                    </span>
                    <span className="text-[#8b949e]">{columnDef.dataType}</span>
                  </li>
                ))}
                {table.columns.length > 8 ? (
                  <li className="text-[#8b949e]">+{table.columns.length - 8} more columns</li>
                ) : null}
              </ul>
            </div>
          )
        },
        style: {
          background: "#0f141b",
          border: "1px solid #30363d",
          borderRadius: 10,
          color: "#e6edf3",
          width: 300
        }
      };
    });

    const localEdges: Edge[] = schema.foreignKeys.map((fk, index) => ({
      id: `${fk.id}-${index}`,
      source: fk.sourceTableId,
      target: fk.targetTableId,
      label: `${fk.sourceColumn} -> ${fk.targetColumn}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#58a6ff"
      },
      style: {
        stroke: "#58a6ff",
        strokeWidth: 1.4
      },
      labelStyle: {
        fill: "#8b949e",
        fontSize: 10
      }
    }));

    return { nodes: localNodes, edges: localEdges };
  }, [schema]);

  if (!schema.tables.length) {
    return (
      <div className="rounded-xl border border-[#30363d] bg-[#101722] p-6 text-sm text-[#8b949e]">
        No tables found in this database.
      </div>
    );
  }

  return (
    <div className="h-[640px] rounded-xl border border-[#30363d] bg-[#0c1118]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.2}
        defaultEdgeOptions={{ animated: false }}
      >
        <Background color="#1f2733" gap={24} size={1} />
        <MiniMap
          nodeColor="#1f6feb"
          maskColor="rgba(13, 17, 23, 0.65)"
          style={{ background: "#0f141b", border: "1px solid #30363d" }}
        />
        <Controls
          style={{
            background: "#0f141b",
            border: "1px solid #30363d",
            color: "#e6edf3"
          }}
        />
      </ReactFlow>
    </div>
  );
}
