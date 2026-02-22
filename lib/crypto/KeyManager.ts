/**
 * KeyManager — Key generation, secure storage, and rotation
 *
 * Handles the full lifecycle of cryptographic keys:
 * - Identity key pair (Ed25519 for signing, X25519 for DH)
 * - Signed pre-key (rotated periodically)
 * - One-time pre-keys (generated in batches, consumed once)
 *
 * All private keys are stored in expo-secure-store (hardware-backed).
 */

import type {
    KeyPair,
    LocalKeyStore,
    OneTimePreKey,
    SignedPreKey,
    UploadKeyBundleRequest,
} from '@/types/e2ee';
import { E2EEError, E2EEErrorCode } from '@/types/e2ee';
import * as SecureStore from 'expo-secure-store';

// ─── Constants ───────────────────────────────────────────────────────────────

const SECURE_STORE_KEY = '@thaf/e2ee/keystore';
const PRE_KEY_BATCH_SIZE = 100;
const PRE_KEY_REPLENISH_THRESHOLD = 25;
const SIGNED_PRE_KEY_ROTATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Sodium Lazy Loader ──────────────────────────────────────────────────────

let _sodium: typeof import('libsodium-wrappers-sumo') | null = null;

async function getSodium() {
  if (_sodium) return _sodium;

  const sodium = await import('libsodium-wrappers-sumo');
  await sodium.ready;
  _sodium = sodium;
  return sodium;
}

// ─── UUID Helper ─────────────────────────────────────────────────────────────

function generateDeviceId(): string {
  const chars = 'abcdef0123456789';
  const sections = [8, 4, 4, 4, 12];
  return sections
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}

// ─── Key Generation ──────────────────────────────────────────────────────────

/**
 * Generate an X25519 key pair for Diffie-Hellman key exchange.
 */
async function generateX25519KeyPair(): Promise<KeyPair> {
  const sodium = await getSodium();
  const kp = sodium.crypto_kx_keypair();
  return {
    publicKey: sodium.to_base64(kp.publicKey),
    privateKey: sodium.to_base64(kp.privateKey),
  };
}

/**
 * Generate an Ed25519 key pair for signing.
 */
async function generateEd25519KeyPair(): Promise<KeyPair> {
  const sodium = await getSodium();
  const kp = sodium.crypto_sign_keypair();
  return {
    publicKey: sodium.to_base64(kp.publicKey),
    privateKey: sodium.to_base64(kp.privateKey),
  };
}

/**
 * Generate a signed pre-key: an X25519 key pair signed with the identity key.
 */
async function generateSignedPreKey(
  identityKeyPair: KeyPair,
  id: number
): Promise<SignedPreKey> {
  const sodium = await getSodium();
  const keyPair = await generateX25519KeyPair();
  const publicKeyBytes = sodium.from_base64(keyPair.publicKey);
  const identityPrivateBytes = sodium.from_base64(identityKeyPair.privateKey);
  const signature = sodium.crypto_sign_detached(publicKeyBytes, identityPrivateBytes);

  return {
    id,
    keyPair,
    signature: sodium.to_base64(signature),
    createdAt: Date.now(),
  };
}

/**
 * Generate a batch of one-time pre-keys.
 */
async function generateOneTimePreKeys(
  startId: number,
  count: number = PRE_KEY_BATCH_SIZE
): Promise<OneTimePreKey[]> {
  const keys: OneTimePreKey[] = [];
  for (let i = 0; i < count; i++) {
    const keyPair = await generateX25519KeyPair();
    keys.push({ id: startId + i, keyPair });
  }
  return keys;
}

// ─── Secure Storage ──────────────────────────────────────────────────────────

/**
 * Save the local key store to expo-secure-store.
 * Hardware-backed on iOS (Keychain) and Android (Keystore).
 */
async function saveKeyStore(store: LocalKeyStore): Promise<void> {
  const json = JSON.stringify(store);
  await SecureStore.setItemAsync(SECURE_STORE_KEY, json, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Load the local key store from secure storage.
 */
async function loadKeyStore(): Promise<LocalKeyStore | null> {
  const json = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  if (!json) return null;
  return JSON.parse(json) as LocalKeyStore;
}

/**
 * Delete the entire local key store.
 */
async function deleteKeyStore(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const KeyManager = {
  /**
   * Initialize keys for a new user/device.
   * Generates identity key, signed pre-key, and one-time pre-keys.
   * Stores everything in secure storage.
   *
   * @returns The local key store (for immediate use) and the upload request (for server)
   */
  async initialize(): Promise<{
    keyStore: LocalKeyStore;
    uploadRequest: UploadKeyBundleRequest;
  }> {
    const sodium = await getSodium();

    // Generate identity key pair (Ed25519 for signing)
    const identityKeyPair = await generateEd25519KeyPair();
    const deviceId = generateDeviceId();

    // Generate signed pre-key
    const signedPreKey = await generateSignedPreKey(identityKeyPair, 1);

    // Generate one-time pre-keys
    const oneTimePreKeys = await generateOneTimePreKeys(1, PRE_KEY_BATCH_SIZE);

    const keyStore: LocalKeyStore = {
      identityKeyPair,
      signedPreKey,
      oneTimePreKeys,
      nextPreKeyId: PRE_KEY_BATCH_SIZE + 1,
      nextSignedPreKeyId: 2,
      deviceId,
    };

    // Persist to secure storage
    await saveKeyStore(keyStore);

    // Build server upload request (public keys only)
    const uploadRequest: UploadKeyBundleRequest = {
      deviceId,
      identityKey: identityKeyPair.publicKey,
      signedPreKey: {
        id: signedPreKey.id,
        key: signedPreKey.keyPair.publicKey,
        signature: signedPreKey.signature,
      },
      oneTimePreKeys: oneTimePreKeys.map((k) => ({
        id: k.id,
        key: k.keyPair.publicKey,
      })),
    };

    return { keyStore, uploadRequest };
  },

  /**
   * Load the existing key store from secure storage.
   * Returns null if no keys have been generated yet.
   */
  async load(): Promise<LocalKeyStore | null> {
    return loadKeyStore();
  },

  /**
   * Get or initialize the key store. If keys exist, loads them;
   * otherwise generates new keys.
   */
  async getOrInitialize(): Promise<{
    keyStore: LocalKeyStore;
    uploadRequest: UploadKeyBundleRequest | null;
    isNew: boolean;
  }> {
    const existing = await loadKeyStore();
    if (existing) {
      return { keyStore: existing, uploadRequest: null, isNew: false };
    }
    const { keyStore, uploadRequest } = await this.initialize();
    return { keyStore, uploadRequest, isNew: true };
  },

  /**
   * Rotate the signed pre-key if it's older than the rotation interval.
   * Returns an upload request if rotation occurred.
   */
  async rotateSignedPreKeyIfNeeded(): Promise<UploadKeyBundleRequest | null> {
    const keyStore = await loadKeyStore();
    if (!keyStore) {
      throw new E2EEError(E2EEErrorCode.KEY_NOT_FOUND, 'No key store found');
    }

    const age = Date.now() - keyStore.signedPreKey.createdAt;
    if (age < SIGNED_PRE_KEY_ROTATION_MS) {
      return null; // Not yet time to rotate
    }

    const newSignedPreKey = await generateSignedPreKey(
      keyStore.identityKeyPair,
      keyStore.nextSignedPreKeyId
    );

    keyStore.signedPreKey = newSignedPreKey;
    keyStore.nextSignedPreKeyId += 1;
    await saveKeyStore(keyStore);

    return {
      deviceId: keyStore.deviceId,
      identityKey: keyStore.identityKeyPair.publicKey,
      signedPreKey: {
        id: newSignedPreKey.id,
        key: newSignedPreKey.keyPair.publicKey,
        signature: newSignedPreKey.signature,
      },
      oneTimePreKeys: [], // No new OPKs during rotation
    };
  },

  /**
   * Generate a new batch of one-time pre-keys for replenishment.
   */
  async replenishOneTimePreKeys(): Promise<{
    deviceId: string;
    newKeys: Array<{ id: number; key: string }>;
  }> {
    const keyStore = await loadKeyStore();
    if (!keyStore) {
      throw new E2EEError(E2EEErrorCode.KEY_NOT_FOUND, 'No key store found');
    }

    const newKeys = await generateOneTimePreKeys(
      keyStore.nextPreKeyId,
      PRE_KEY_BATCH_SIZE
    );

    keyStore.oneTimePreKeys.push(...newKeys);
    keyStore.nextPreKeyId += PRE_KEY_BATCH_SIZE;
    await saveKeyStore(keyStore);

    return {
      deviceId: keyStore.deviceId,
      newKeys: newKeys.map((k) => ({ id: k.id, key: k.keyPair.publicKey })),
    };
  },

  /**
   * Find a local one-time pre-key by ID (used when processing incoming X3DH).
   */
  async findOneTimePreKey(id: number): Promise<OneTimePreKey | null> {
    const keyStore = await loadKeyStore();
    if (!keyStore) return null;
    return keyStore.oneTimePreKeys.find((k) => k.id === id) ?? null;
  },

  /**
   * Remove a consumed one-time pre-key from local storage.
   */
  async consumeOneTimePreKey(id: number): Promise<void> {
    const keyStore = await loadKeyStore();
    if (!keyStore) return;
    keyStore.oneTimePreKeys = keyStore.oneTimePreKeys.filter((k) => k.id !== id);
    await saveKeyStore(keyStore);
  },

  /**
   * Get the number of remaining local one-time pre-keys.
   */
  async getLocalPreKeyCount(): Promise<number> {
    const keyStore = await loadKeyStore();
    return keyStore?.oneTimePreKeys.length ?? 0;
  },

  /**
   * Check if pre-keys need replenishment.
   */
  async needsReplenishment(): Promise<boolean> {
    const count = await this.getLocalPreKeyCount();
    return count < PRE_KEY_REPLENISH_THRESHOLD;
  },

  /**
   * Completely wipe all keys from secure storage.
   * WARNING: This is irreversible. All existing sessions will be lost.
   */
  async wipeKeys(): Promise<void> {
    await deleteKeyStore();
    _sodium = null;
  },

  /**
   * Get the identity public key for display (e.g., safety number).
   */
  async getIdentityPublicKey(): Promise<string | null> {
    const keyStore = await loadKeyStore();
    return keyStore?.identityKeyPair.publicKey ?? null;
  },

  /**
   * Get the device ID.
   */
  async getDeviceId(): Promise<string | null> {
    const keyStore = await loadKeyStore();
    return keyStore?.deviceId ?? null;
  },

  /** Exposed for testing / advanced use */
  _internal: {
    getSodium,
    generateX25519KeyPair,
    generateEd25519KeyPair,
  },
};
