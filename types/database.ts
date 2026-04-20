export interface ColumnInfo {
  schema: string;
  table: string;
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

export interface TableInfo {
  schema: string;
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
}

export interface ForeignKeyInfo {
  constraintName: string;
  sourceSchema: string;
  sourceTable: string;
  sourceColumn: string;
  targetSchema: string;
  targetTable: string;
  targetColumn: string;
}

export interface SchemaSnapshot {
  connectionHash: string;
  fetchedAt: string;
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
}

export interface ERDNode {
  id: string;
  label: string;
  title: string;
  color?: string;
  font?: {
    color: string;
    face?: string;
    size?: number;
  };
  shape?: string;
  margin?: number;
}

export interface ERDEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  arrows?: string;
  color?: string;
}

export interface ERDDiagramData {
  nodes: ERDNode[];
  edges: ERDEdge[];
}

export interface QueryColumn {
  name: string;
  dataTypeId: number;
}

export interface QueryExecutionResult {
  columns: QueryColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  durationMs: number;
  executedAt: string;
  sqlExecuted: string;
  fromCache: boolean;
}

export interface SlowQueryRecord {
  id: string;
  sql: string;
  durationMs: number;
  recordedAt: string;
  connectionHash: string;
  error?: string;
}
