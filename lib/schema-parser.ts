import type { IntrospectionRaw } from "@/lib/db-client";

export type SchemaColumn = {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
};

export type SchemaTable = {
  id: string;
  schema: string;
  name: string;
  fullName: string;
  rowEstimate: number;
  columns: SchemaColumn[];
};

export type SchemaRelationship = {
  id: string;
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
  label: string;
};

export type ErdNode = {
  id: string;
  label: string;
  title: string;
  group: string;
};

export type ErdEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  arrows: "to";
  color: { color: string };
};

export type ParsedSchema = {
  tableCount: number;
  relationshipCount: number;
  tables: SchemaTable[];
  relationships: SchemaRelationship[];
  erd: {
    nodes: ErdNode[];
    edges: ErdEdge[];
  };
};

function tableId(schema: string, name: string): string {
  return `${schema}.${name}`;
}

export function parseIntrospection(raw: IntrospectionRaw): ParsedSchema {
  const pkMap = new Set(raw.primaryKeys.map((pk) => `${pk.table_schema}.${pk.table_name}.${pk.column_name}`));

  const rowEstimateMap = new Map<string, number>(
    raw.rowEstimates.map((row) => [tableId(row.table_schema, row.table_name), Number(row.row_estimate) || 0])
  );

  const columnsByTable = new Map<string, SchemaColumn[]>();

  for (const column of raw.columns) {
    const id = tableId(column.table_schema, column.table_name);
    const existing = columnsByTable.get(id) ?? [];
    existing.push({
      name: column.column_name,
      dataType: column.data_type,
      nullable: column.is_nullable,
      defaultValue: column.column_default,
      isPrimaryKey: pkMap.has(`${id}.${column.column_name}`)
    });
    columnsByTable.set(id, existing);
  }

  const tables: SchemaTable[] = raw.tables.map((table) => {
    const id = tableId(table.table_schema, table.table_name);
    const columns = columnsByTable.get(id) ?? [];

    return {
      id,
      schema: table.table_schema,
      name: table.table_name,
      fullName: id,
      rowEstimate: rowEstimateMap.get(id) ?? 0,
      columns
    };
  });

  const relationships: SchemaRelationship[] = raw.foreignKeys.map((fk) => ({
    id: `${fk.constraint_name}-${fk.source_schema}.${fk.source_table}`,
    from: tableId(fk.source_schema, fk.source_table),
    to: tableId(fk.target_schema, fk.target_table),
    fromColumn: fk.source_column,
    toColumn: fk.target_column,
    label: `${fk.source_column} -> ${fk.target_column}`
  }));

  const nodes: ErdNode[] = tables.map((table) => {
    const pkCount = table.columns.filter((column) => column.isPrimaryKey).length;
    const previewColumns = table.columns
      .slice(0, 6)
      .map((column) => `${column.isPrimaryKey ? "PK " : ""}${column.name}: ${column.dataType}`)
      .join("\n");

    return {
      id: table.id,
      group: table.schema,
      label: `${table.name}\n${table.rowEstimate.toLocaleString()} rows`,
      title: `${table.fullName}\n${pkCount} primary key columns\n\n${previewColumns}`
    };
  });

  const edges: ErdEdge[] = relationships.map((relationship) => ({
    id: relationship.id,
    from: relationship.from,
    to: relationship.to,
    label: relationship.label,
    arrows: "to",
    color: { color: "#2f81f7" }
  }));

  return {
    tableCount: tables.length,
    relationshipCount: relationships.length,
    tables,
    relationships,
    erd: {
      nodes,
      edges
    }
  };
}
