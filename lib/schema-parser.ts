import type { DatabaseSchema, DbColumn, DbForeignKey, DbTable } from "@/lib/types";

type ColumnRow = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
};

type PrimaryKeyRow = {
  table_schema: string;
  table_name: string;
  column_name: string;
};

type ForeignKeyRow = {
  constraint_name: string;
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
};

type RowEstimate = {
  table_schema: string;
  table_name: string;
  row_estimate: string | number | null;
};

function toTableId(schema: string, table: string) {
  return `${schema}.${table}`;
}

function normalizeRowEstimate(value: string | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function buildDatabaseSchema(params: {
  columns: ColumnRow[];
  primaryKeys: PrimaryKeyRow[];
  foreignKeys: ForeignKeyRow[];
  rowEstimates: RowEstimate[];
}): DatabaseSchema {
  const primaryKeySet = new Set(
    params.primaryKeys.map((pk) => `${pk.table_schema}.${pk.table_name}.${pk.column_name}`)
  );

  const rowEstimateMap = new Map(
    params.rowEstimates.map((entry) => [
      toTableId(entry.table_schema, entry.table_name),
      normalizeRowEstimate(entry.row_estimate)
    ])
  );

  const tableMap = new Map<string, DbTable>();

  for (const column of params.columns) {
    const tableId = toTableId(column.table_schema, column.table_name);
    const existing = tableMap.get(tableId);

    const parsedColumn: DbColumn = {
      name: column.column_name,
      dataType: column.data_type === "USER-DEFINED" ? column.udt_name : column.data_type,
      isNullable: column.is_nullable === "YES",
      defaultValue: column.column_default,
      isPrimaryKey: primaryKeySet.has(`${tableId}.${column.column_name}`)
    };

    if (existing) {
      existing.columns.push(parsedColumn);
    } else {
      tableMap.set(tableId, {
        id: tableId,
        schema: column.table_schema,
        name: column.table_name,
        rowEstimate: rowEstimateMap.get(tableId) ?? null,
        columns: [parsedColumn]
      });
    }
  }

  const tables = Array.from(tableMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  const foreignKeys: DbForeignKey[] = params.foreignKeys
    .map((fk) => ({
      id: fk.constraint_name,
      sourceTableId: toTableId(fk.source_schema, fk.source_table),
      sourceColumn: fk.source_column,
      targetTableId: toTableId(fk.target_schema, fk.target_table),
      targetColumn: fk.target_column
    }))
    .filter((fk) => tableMap.has(fk.sourceTableId) && tableMap.has(fk.targetTableId));

  return {
    generatedAt: new Date().toISOString(),
    tableCount: tables.length,
    relationCount: foreignKeys.length,
    tables,
    foreignKeys
  };
}
