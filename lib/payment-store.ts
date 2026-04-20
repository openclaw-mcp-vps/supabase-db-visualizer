import { promises as fs } from "node:fs";
import path from "node:path";

type SessionRecord = {
  paid: boolean;
  paidAt?: string;
  orderId?: string;
  customerEmail?: string;
  eventName?: string;
};

type StoreShape = {
  sessions: Record<string, SessionRecord>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "payments.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch {
    const initial: StoreShape = { sessions: {} };
    await fs.writeFile(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed.sessions || typeof parsed.sessions !== "object") {
      return { sessions: {} };
    }

    return parsed;
  } catch {
    return { sessions: {} };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function markSessionPaid(input: {
  token: string;
  orderId?: string;
  customerEmail?: string;
  eventName?: string;
}): Promise<void> {
  const store = await readStore();

  store.sessions[input.token] = {
    paid: true,
    paidAt: new Date().toISOString(),
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    eventName: input.eventName
  };

  await writeStore(store);
}

export async function isSessionPaid(token: string): Promise<boolean> {
  const store = await readStore();
  return Boolean(store.sessions[token]?.paid);
}
