import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@thaf/nudge-cooldowns-v1';

type CooldownMap = Record<string, number>; // key -> epoch ms when next nudge allowed

let state: CooldownMap = {};
let hydrated = false;
const listeners = new Set<() => void>();

function key(groupId: string, toUserId: string) {
  return `${groupId}::${toUserId}`;
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[nudgeStore] persist failed', err);
  }
}

export async function hydrateNudgeStore() {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (err) {
    console.warn('[nudgeStore] hydrate failed', err);
  }
  hydrated = true;
  listeners.forEach((l) => l());
}

export function subscribeNudgeStore(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getNudgeSnapshot(): CooldownMap {
  return state;
}

export function getNudgeAllowedAt(
  groupId: string,
  toUserId: string,
): number | null {
  const ts = state[key(groupId, toUserId)];
  if (!ts) return null;
  if (ts <= Date.now()) return null;
  return ts;
}

export function setNudgeCooldown(
  groupId: string,
  toUserId: string,
  allowedAtMs: number,
) {
  state = { ...state, [key(groupId, toUserId)]: allowedAtMs };
  listeners.forEach((l) => l());
  void persist();
}

/** `retryAfter` from the server is in seconds. */
export function setNudgeCooldownFromRetryAfter(
  groupId: string,
  toUserId: string,
  retryAfterSec: number,
) {
  setNudgeCooldown(groupId, toUserId, Date.now() + retryAfterSec * 1000);
}
