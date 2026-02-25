/**
 * SessionStore — Persistent Storage for E2EE Session State
 *
 * Manages the storage and retrieval of Double Ratchet session states
 * using expo-secure-store for key material and AsyncStorage for
 * non-sensitive session metadata.
 *
 * Each session is keyed by (remoteUserId, remoteDeviceId).
 */

import type { SenderKeyState, SessionState } from '@/types/e2ee';
import * as SecureStore from 'expo-secure-store';
import { DoubleRatchet } from './DoubleRatchet';

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_PREFIX = '@thaf/e2ee/session/';
const SENDER_KEY_PREFIX = '@thaf/e2ee/senderkey/';
const SESSION_INDEX_KEY = '@thaf/e2ee/session_index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a storage key for a pairwise session.
 */
function sessionKey(remoteUserId: string, remoteDeviceId: string): string {
  return `${SESSION_PREFIX}${remoteUserId}:${remoteDeviceId}`;
}

/**
 * Build a storage key for a group sender key.
 */
function senderKeyKey(
  groupId: string,
  senderId: string,
  senderDeviceId: string
): string {
  return `${SENDER_KEY_PREFIX}${groupId}:${senderId}:${senderDeviceId}`;
}

/**
 * expo-secure-store has a 2048-byte limit per key on some platforms.
 * For larger session states, we split across multiple keys.
 */
const CHUNK_SIZE = 2000;

async function setLargeValue(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // Clean up any old chunks
    await SecureStore.deleteItemAsync(`${key}:chunks`);
    return;
  }

  // Split into chunks
  const chunks = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(`${key}:chunks`, String(chunks), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  for (let i = 0; i < chunks; i++) {
    const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}:${i}`, chunk, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
}

async function getLargeValue(key: string): Promise<string | null> {
  // Check if it's chunked
  const chunksStr = await SecureStore.getItemAsync(`${key}:chunks`);
  if (!chunksStr) {
    // Not chunked, try direct
    return SecureStore.getItemAsync(key);
  }

  const chunks = parseInt(chunksStr, 10);
  let result = '';
  for (let i = 0; i < chunks; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}:${i}`);
    if (!chunk) return null; // Corrupted
    result += chunk;
  }
  return result;
}

async function deleteLargeValue(key: string): Promise<void> {
  const chunksStr = await SecureStore.getItemAsync(`${key}:chunks`);
  if (chunksStr) {
    const chunks = parseInt(chunksStr, 10);
    for (let i = 0; i < chunks; i++) {
      await SecureStore.deleteItemAsync(`${key}:${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}:chunks`);
  }
  await SecureStore.deleteItemAsync(key);
}

// ─── Session Index ───────────────────────────────────────────────────────────

/**
 * Maintain an index of active sessions for enumeration.
 */
async function getSessionIndex(): Promise<string[]> {
  const data = await SecureStore.getItemAsync(SESSION_INDEX_KEY);
  if (!data) return [];
  return JSON.parse(data) as string[];
}

async function addToSessionIndex(key: string): Promise<void> {
  const index = await getSessionIndex();
  if (!index.includes(key)) {
    index.push(key);
    await SecureStore.setItemAsync(SESSION_INDEX_KEY, JSON.stringify(index));
  }
}

async function removeFromSessionIndex(key: string): Promise<void> {
  const index = await getSessionIndex();
  const updated = index.filter((k) => k !== key);
  await SecureStore.setItemAsync(SESSION_INDEX_KEY, JSON.stringify(updated));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const SessionStore = {
  // ─── Pairwise Sessions ───────────────────────────────────────────────────

  /**
   * Save a pairwise session state.
   */
  async saveSession(
    remoteUserId: string,
    remoteDeviceId: string,
    session: SessionState
  ): Promise<void> {
    const key = sessionKey(remoteUserId, remoteDeviceId);
    const serialized = DoubleRatchet.serializeSession(session);
    await setLargeValue(key, serialized);
    await addToSessionIndex(key);
  },

  /**
   * Load a pairwise session state.
   * Returns null if no session exists with this user/device.
   */
  async loadSession(
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<SessionState | null> {
    const key = sessionKey(remoteUserId, remoteDeviceId);
    const serialized = await getLargeValue(key);
    if (!serialized) return null;
    return DoubleRatchet.deserializeSession(serialized);
  },

  /**
   * Check if a session exists with a remote user/device.
   */
  async hasSession(
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<boolean> {
    const session = await this.loadSession(remoteUserId, remoteDeviceId);
    return session !== null;
  },

  /**
   * Delete a pairwise session.
   */
  async deleteSession(
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<void> {
    const key = sessionKey(remoteUserId, remoteDeviceId);
    await deleteLargeValue(key);
    await removeFromSessionIndex(key);
  },

  /**
   * List all active session keys (for debugging / settings screen).
   */
  async listSessions(): Promise<string[]> {
    return getSessionIndex();
  },

  /**
   * Delete ALL sessions. Used on key reset / account deletion.
   */
  async deleteAllSessions(): Promise<void> {
    const index = await getSessionIndex();
    for (const key of index) {
      await deleteLargeValue(key);
    }
    await SecureStore.deleteItemAsync(SESSION_INDEX_KEY);
  },

  // ─── Group Sender Keys ──────────────────────────────────────────────────

  /**
   * Save a sender key state for a group member.
   */
  async saveSenderKey(
    groupId: string,
    senderId: string,
    senderDeviceId: string,
    senderKey: SenderKeyState
  ): Promise<void> {
    const key = senderKeyKey(groupId, senderId, senderDeviceId);
    await setLargeValue(key, JSON.stringify(senderKey));
  },

  /**
   * Load a sender key state for a group member.
   */
  async loadSenderKey(
    groupId: string,
    senderId: string,
    senderDeviceId: string
  ): Promise<SenderKeyState | null> {
    const key = senderKeyKey(groupId, senderId, senderDeviceId);
    const data = await getLargeValue(key);
    if (!data) return null;
    return JSON.parse(data) as SenderKeyState;
  },

  /**
   * Delete a specific sender key.
   */
  async deleteSenderKey(
    groupId: string,
    senderId: string,
    senderDeviceId: string
  ): Promise<void> {
    const key = senderKeyKey(groupId, senderId, senderDeviceId);
    await deleteLargeValue(key);
  },

  /**
   * Delete ALL sender keys for a group (used on group exit or key reset).
   */
  async deleteGroupSenderKeys(groupId: string): Promise<void> {
    // Since we can't enumerate secure store easily, we track via the
    // session index approach. For now, individual deletion is required.
    // This is a pragmatic limitation — a local SQLite DB would be better
    // for large-scale group key tracking (Phase 2 optimization).
    console.warn(
      'deleteGroupSenderKeys: Currently requires individual key deletion'
    );
  },

  // ─── Utility ─────────────────────────────────────────────────────────────

  /**
   * Wipe ALL E2EE session data (nuclear option for key reset).
   */
  async wipeAll(): Promise<void> {
    await this.deleteAllSessions();
    // Note: Group sender keys require individual cleanup
    // A full secure store clear is handled in KeyManager.wipeKeys()
  },
};
