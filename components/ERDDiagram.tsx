"use client";

import { useEffect, useRef, useState } from "react";

import type { ERDDiagramData } from "@/types/database";

interface ERDDiagramProps {
  diagram: ERDDiagramData | null;
}

export function ERDDiagram({ diagram }: ERDDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!diagram || !containerRef.current) {
      return;
    }

    let disposed = false;
    let network: { destroy: () => void } | null = null;

    const renderGraph = async () => {
      try {
        const vis = (await import("vis-network/standalone")) as unknown as {
          Network: new (
            container: HTMLElement,
            data: { nodes: ERDDiagramData["nodes"]; edges: ERDDiagramData["edges"] },
            options?: unknown,
          ) => { destroy: () => void };
        };

        if (!containerRef.current || disposed) {
          return;
        }

        setError("");

        network = new vis.Network(
          containerRef.current,
          {
            nodes: diagram.nodes,
            edges: diagram.edges,
          },
          {
            autoResize: true,
            nodes: {
              borderWidth: 1,
              shape: "box",
              widthConstraint: {
                maximum: 280,
              },
            },
            edges: {
              smooth: {
                type: "dynamic",
              },
              font: {
                color: "#b4c4d5",
                size: 10,
              },
              width: 1.2,
            },
            interaction: {
              hover: true,
              navigationButtons: true,
              keyboard: true,
            },
            physics: {
              enabled: true,
              stabilization: {
                iterations: 150,
              },
            },
          },
        );
      } catch {
        setError("Unable to render ERD diagram in this browser session.");
      }
    };

    void renderGraph();

    return () => {
      disposed = true;
      network?.destroy();
    };
  }, [diagram]);

  if (!diagram) {
    return (
      <section className="rounded-2xl border border-[#29374d] bg-[#101827]/90 p-5">
        <h2 className="text-lg font-semibold text-white">ERD Diagram</h2>
        <p className="mt-3 text-sm text-[#97abc0]">Connect a database and refresh schema to render relationships.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#29374d] bg-[#101827]/90 p-5">
      <h2 className="text-lg font-semibold text-white">ERD Diagram</h2>
      <p className="mt-2 text-xs text-[#8ba3bb]">Drag nodes, zoom in, and hover to inspect table details.</p>
      <div ref={containerRef} className="mt-4 h-[520px] w-full rounded-lg border border-[#253347] bg-[#0e1522]" />
      {error ? <p className="mt-3 text-xs text-[#f0a1a7]">{error}</p> : null}
    </section>
  );
}
