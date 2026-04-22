export type DbColumn = {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
};

export type DbTable = {
  id: string;
  schema: string;
  name: string;
  rowEstimate: number | null;
  columns: DbColumn[];
};

export type DbForeignKey = {
  id: string;
  sourceTableId: string;
  sourceColumn: string;
  targetTableId: string;
  targetColumn: string;
};

export type DatabaseSchema = {
  generatedAt: string;
  tableCount: number;
  relationCount: number;
  tables: DbTable[];
  foreignKeys: DbForeignKey[];
};

export type ConnectionSummary = {
  database: string;
  user: string;
  postgresVersion: string;
  tableCount: number;
};

export type QueryExecution = {
  executedSql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  durationMs: number;
  isSlowQuery: boolean;
};
