/**
 * Upload State Persistence
 *
 * In-memory Map backed by AsyncStorage for crash-resilient upload tracking.
 * When the app is killed mid-upload, the OS may continue the HTTP PUT.
 * On relaunch, hydrate() loads all records so reconciliation can pick up.
 *
 * Rule: ALWAYS call saveUpload() BEFORE starting any network call.
 */

import type { UploadRecord, UploadStatus } from '@/types/upload';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'upload:';
const MSG_INDEX_PREFIX = 'msg-index:';

// ─── In-memory cache ────────────────────────────────────
const cache = new Map<string, UploadRecord>();
let hydrated = false;

// ─── Listeners for reactive UI updates ──────────────────
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeUploadStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Hydrate from AsyncStorage on app launch ────────────

export async function hydrateUploadStore(): Promise<void> {
  if (hydrated) return;
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const uploadKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX));
    if (uploadKeys.length === 0) {
      hydrated = true;
      return;
    }
    const pairs = await AsyncStorage.multiGet(uploadKeys);
    for (const [key, value] of pairs) {
      if (value) {
        const record: UploadRecord = JSON.parse(value);
        cache.set(record.imageId, record);
      }
    }
    hydrated = true;
  } catch (e) {
    console.warn('[uploadStore] Hydration failed:', e);
    hydrated = true;
  }
}

// ─── CRUD ───────────────────────────────────────────────

export function saveUpload(record: UploadRecord): void {
  cache.set(record.imageId, record);
  notify();
  // Persist asynchronously — fire-and-forget
  AsyncStorage.setItem(STORAGE_PREFIX + record.imageId, JSON.stringify(record)).catch((e) =>
    console.warn('[uploadStore] Persist failed:', e),
  );
  // Maintain message → imageIds index
  _addToMessageIndex(record.messageId, record.imageId);
}

export function getUpload(imageId: string): UploadRecord | null {
  return cache.get(imageId) ?? null;
}

export function updateUpload(
  imageId: string,
  updates: Partial<UploadRecord>,
): UploadRecord | null {
  const existing = cache.get(imageId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  cache.set(imageId, updated);
  notify();
  AsyncStorage.setItem(STORAGE_PREFIX + imageId, JSON.stringify(updated)).catch((e) =>
    console.warn('[uploadStore] Persist failed:', e),
  );
  return updated;
}

export function getUploadsByStatus(statuses: UploadStatus[]): UploadRecord[] {
  const results: UploadRecord[] = [];
  cache.forEach((record) => {
    if (statuses.includes(record.status)) results.push(record);
  });
  return results;
}

export function getUploadsByMessage(messageId: string): UploadRecord[] {
  const results: UploadRecord[] = [];
  cache.forEach((record) => {
    if (record.messageId === messageId) results.push(record);
  });
  return results;
}

export function deleteUpload(imageId: string): void {
  cache.delete(imageId);
  notify();
  AsyncStorage.removeItem(STORAGE_PREFIX + imageId).catch((e) =>
    console.warn('[uploadStore] Delete failed:', e),
  );
}

/**
 * Snapshot of all uploads — used by useSyncExternalStore.
 * Returns a new array reference only when the store changes.
 */
let snapshotCache: UploadRecord[] | null = null;
listeners.add(() => {
  snapshotCache = null;
});

export function getUploadSnapshot(): UploadRecord[] {
  if (!snapshotCache) {
    snapshotCache = Array.from(cache.values());
  }
  return snapshotCache;
}

// ─── Internal helpers ───────────────────────────────────

async function _addToMessageIndex(messageId: string, imageId: string) {
  try {
    const key = MSG_INDEX_PREFIX + messageId;
    const raw = await AsyncStorage.getItem(key);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    if (!existing.includes(imageId)) {
      existing.push(imageId);
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {
    // non-critical — the scan fallback in getUploadsByMessage still works
  }
}
