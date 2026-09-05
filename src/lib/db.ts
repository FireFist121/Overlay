import { MongoClient, Db, ServerApiVersion } from "mongodb";

const rawUri = (process.env.MONGODB_URI || "").replace(/^\"|\"$/g, "").trim();
// Ensure the URI has the database + required params
const uri = rawUri.includes("?")
  ? rawUri
  : `${rawUri}/overlay?retryWrites=true&w=majority&tls=true`;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const g = globalThis as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
  if (!g._mongoClientPromise) {
    client = new MongoClient(uri, options);
    g._mongoClientPromise = client.connect();
  }
  clientPromise = g._mongoClientPromise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db("overlay");
}

export interface Donor { name: string; amount: number; color?: string; }
export interface TimerState { remaining: number; running: boolean; total: number; targetEndTime?: number; }
export interface OverlayState {
  timer: TimerState; donors: Donor[];
  showTimer: boolean; showDonors: boolean; showAmounts: boolean; updatedAt: number;
  _action?: string;
}

export interface LogEntry {
  room: string;
  action: string;
  details: string;
  timestamp: number;
}

export function getDefaultState(): OverlayState {
  return {
    timer: { remaining: 600, running: false, total: 600 },
    donors: [], showTimer: true, showDonors: true, showAmounts: true, updatedAt: Date.now(),
  };
}

export async function getState(room: string): Promise<OverlayState> {
  try {
    const db = await getDb();
    const doc = await db.collection<{ room: string; state: OverlayState }>("states").findOne({ room });
    return doc?.state ?? getDefaultState();
  } catch { return getDefaultState(); }
}

export async function saveState(room: string, state: OverlayState): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("states").updateOne(
      { room },
      { $set: { room, state, updatedAt: state.updatedAt } },
      { upsert: true }
    );
  } catch (e) { console.error("MongoDB saveState error:", e); }
}

export async function saveLog(room: string, action: string, details: string): Promise<void> {
  try {
    const db = await getDb();
    await db.collection<LogEntry>("logs").insertOne({
      room,
      action,
      details,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("MongoDB saveLog error:", e);
  }
}

export async function getLogs(room: string, limit: number = 100): Promise<LogEntry[]> {
  try {
    const db = await getDb();
    return await db.collection<LogEntry>("logs")
      .find({ room })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (e) {
    console.error("MongoDB getLogs error:", e);
    return [];
  }
}