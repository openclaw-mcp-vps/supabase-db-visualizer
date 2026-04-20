"use client";

import { useEffect, useRef } from "react";
import type { ErdEdge, ErdNode } from "@/lib/schema-parser";

type ERDViewerProps = {
  nodes: ErdNode[];
  edges: ErdEdge[];
};

export function ERDViewer({ nodes, edges }: ERDViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) {
      return;
    }

    let disposed = false;
    let network: { destroy: () => void } | null = null;

    void import("vis-network/standalone").then(({ Network }) => {
      if (!containerRef.current || disposed) {
        return;
      }

      network = new Network(
        containerRef.current,
        {
          nodes,
          edges
        },
        {
          autoResize: true,
          physics: {
            enabled: true,
            solver: "forceAtlas2Based",
            stabilization: {
              iterations: 180,
              fit: true
            }
          },
          interaction: {
            hover: true,
            tooltipDelay: 120,
            dragView: true,
            zoomView: true,
            navigationButtons: true
          },
          nodes: {
            shape: "box",
            margin: {
              top: 12,
              right: 12,
              bottom: 12,
              left: 12
            },
            color: {
              border: "#30363d",
              background: "#161b22",
              highlight: {
                border: "#2f81f7",
                background: "#1f2f44"
              }
            },
            font: {
              color: "#f0f6fc",
              face: "Space Grotesk"
            }
          },
          edges: {
            color: "#2f81f7",
            font: {
              color: "#9ba5b4",
              size: 11,
              face: "JetBrains Mono"
            },
            smooth: {
              enabled: true,
              type: "dynamic",
              roundness: 0.35
            }
          }
        }
      );
    });

    return () => {
      disposed = true;
      network?.destroy();
    };
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-secondary)]">
        Connect a database to generate your ERD graph.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Entity Relationship Diagram</p>
          <h3 className="mt-1 text-lg font-semibold">Interactive ERD</h3>
        </div>
        <p className="rounded-md border border-[var(--border)] bg-[#10161f] px-3 py-1 text-xs text-[var(--text-secondary)]">
          Drag nodes, hover for column details
        </p>
      </div>

      <div ref={containerRef} className="h-[420px] rounded-xl border border-[var(--border)] bg-[#0f141c]" />
    </section>
  );
}
