import type { ERDDiagramData, ERDEdge, ERDNode, SchemaSnapshot } from "@/types/database";

function tableNodeId(schema: string, table: string): string {
  return `${schema}.${table}`;
}

export function generateErdDiagram(snapshot: SchemaSnapshot): ERDDiagramData {
  const nodes: ERDNode[] = snapshot.tables.map((table) => {
    const id = tableNodeId(table.schema, table.name);

    const columnPreview = table.columns
      .slice(0, 5)
      .map((column) => {
        const pkMarker = column.isPrimaryKey ? " (PK)" : "";
        return `${column.name}: ${column.dataType}${pkMarker}`;
      })
      .join("\n");

    const omittedColumns = table.columns.length > 5 ? `\n... ${table.columns.length - 5} more` : "";

    return {
      id,
      shape: "box",
      margin: 10,
      color: "#111827",
      font: {
        color: "#f8fafc",
        face: "ui-monospace",
        size: 13,
      },
      label: `${table.schema}.${table.name}\n${table.rowCount.toLocaleString()} rows`,
      title: `${table.schema}.${table.name}\n\n${columnPreview}${omittedColumns}`,
    };
  });

  const edges: ERDEdge[] = snapshot.foreignKeys.map((fk) => ({
    id: `${fk.constraintName}-${fk.sourceSchema}-${fk.sourceTable}-${fk.sourceColumn}`,
    from: tableNodeId(fk.sourceSchema, fk.sourceTable),
    to: tableNodeId(fk.targetSchema, fk.targetTable),
    label: `${fk.sourceColumn} → ${fk.targetColumn}`,
    arrows: "to",
    color: "#3b82f6",
  }));

  return { nodes, edges };
}
