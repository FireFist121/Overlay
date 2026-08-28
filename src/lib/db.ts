import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!.replace(/^"|"$/g, "");
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In dev, reuse connection across hot-reloads
if (process.env.NODE_ENV === "development") {
  const g = globalThis as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
  if (!g._mongoClientPromise) {
    client = new MongoClient(uri, options);
    g._mongoClientPromise = client.connect();
  }
  clientPromise = g._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db("overlay");
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface Donor { name: string; amount: number; }
export interface TimerState {
  remaining: number;
  running: boolean;
  total: number;
  targetEndTime?: number;
}
export interface OverlayState {
  timer: TimerState;
  donors: Donor[];
  showTimer: boolean;
  showDonors: boolean;
  showAmounts: boolean;
  updatedAt: number;
}

export function getDefaultState(): OverlayState {
  return {
    timer: { remaining: 600, running: false, total: 600 },
    donors: [],
    showTimer: true,
    showDonors: true,
    showAmounts: true,
    updatedAt: Date.now(),
  };
}

// ── CRUD ────────────────────────────────────────────────────────────────────
export async function getState(room: string): Promise<OverlayState> {
  try {
    const db = await getDb();
    const doc = await db.collection<{ room: string; state: OverlayState }>("states").findOne({ room });
    return doc?.state ?? getDefaultState();
  } catch {
    return getDefaultState();
  }
}

export async function saveState(room: string, state: OverlayState): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("states").updateOne(
      { room },
      { $set: { room, state, updatedAt: state.updatedAt } },
      { upsert: true }
    );
  } catch (e) {
    console.error("MongoDB saveState error:", e);
  }
}