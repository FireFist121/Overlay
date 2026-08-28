import { Redis } from "@upstash/redis";

// Determine if we should use the mock in-memory database
const hasRealRedis = 
  process.env.UPSTASH_REDIS_REST_URL && 
  !process.env.UPSTASH_REDIS_REST_URL.includes("YOUR_URL");

export const redis = hasRealRedis ? Redis.fromEnv() : null;

// Fallback in-memory store for local testing without an Upstash account
const memoryStore = new Map<string, OverlayState>();

export interface Donor { name: string; amount: number; }
export interface TimerState { remaining: number; running: boolean; total: number; targetEndTime?: number; }
export interface OverlayState { timer: TimerState; donors: Donor[]; showTimer: boolean; showDonors: boolean; showAmounts: boolean; updatedAt: number; }

export function getDefaultState(): OverlayState {
  return { timer: { remaining: 600, running: false, total: 600 }, donors: [], showTimer: true, showDonors: true, showAmounts: true, updatedAt: Date.now() };
}

export function stateKey(room: string) { return `overlay:${room}`; }

export async function getState(key: string): Promise<OverlayState> {
  if (redis) {
    const s = await redis.get<OverlayState>(key);
    return s || getDefaultState();
  }
  return memoryStore.get(key) || getDefaultState();
}

export async function setState(key: string, state: OverlayState): Promise<void> {
  if (redis) { await redis.set(key, state, { ex: 172800 }); } 
  else { memoryStore.set(key, state); }
}
