import { Client } from "pg";

const STATEMENT_TIMEOUT_MS = 15_000;

function ensureConnectionString(connectionString: string) {
  const trimmed = connectionString.trim();

  if (!trimmed) {
    throw new Error("Connection string is required.");
  }

  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new Error("Connection string must start with postgres:// or postgresql://.");
  }

  return trimmed;
}

function shouldUseSsl(connectionString: string) {
  return !/sslmode=disable/i.test(connectionString);
}

export async function withDbClient<T>(
  connectionString: string,
  operation: (client: Client) => Promise<T>
) {
  const safeConnectionString = ensureConnectionString(connectionString);

  const client = new Client({
    connectionString: safeConnectionString,
    ssl: shouldUseSsl(safeConnectionString) ? { rejectUnauthorized: false } : undefined,
    statement_timeout: STATEMENT_TIMEOUT_MS,
    query_timeout: STATEMENT_TIMEOUT_MS,
    application_name: "supabase-db-visualizer"
  });

  await client.connect();

  try {
    return await operation(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}
