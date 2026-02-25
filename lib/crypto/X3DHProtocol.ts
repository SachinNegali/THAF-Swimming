/**
 * X3DH Protocol — Extended Triple Diffie-Hellman Key Agreement
 *
 * Implements the X3DH handshake between two users to establish a shared secret.
 * This shared secret is then used to initialize the Double Ratchet.
 *
 * Reference: https://signal.org/docs/specifications/x3dh/
 *
 * Initiator (Alice) flow:
 *   1. Fetch Bob's key bundle from server
 *   2. Generate ephemeral key pair
 *   3. Perform 3 or 4 DH exchanges → derive shared secret via HKDF
 *   4. Send initial message with Alice's ephemeral public key
 *
 * Responder (Bob) flow:
 *   1. Receive Alice's initial message with ephemeral key + identity key
 *   2. Perform the same DH exchanges (mirrored) → derive same shared secret
 */

import type {
    KeyPair,
    LocalKeyStore,
    PublicKeyBundle,
} from '@/types/e2ee';
import { E2EEError, E2EEErrorCode } from '@/types/e2ee';
import { KeyManager } from './KeyManager';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface X3DHResult {
  /** The shared secret derived from the X3DH exchange */
  sharedSecret: string;  // base64, 32 bytes
  /** The ephemeral key pair used (public part sent to recipient) */
  ephemeralKeyPair: KeyPair;
  /** Which one-time pre-key was consumed (if any) */
  oneTimePreKeyId?: number;
  /** The remote identity key (for session state) */
  remoteIdentityKey: string;
}

export interface X3DHInitialMessage {
  /** Sender's identity public key */
  identityKey: string;
  /** Sender's ephemeral public key */
  ephemeralKey: string;
  /** Which one-time pre-key was consumed */
  oneTimePreKeyId?: number;
}

// The HKDF info string used for X3DH key derivation
const X3DH_INFO = 'THAF_X3DH_v1';

// ─── Sodium Accessor ─────────────────────────────────────────────────────────

async function getSodium() {
  return KeyManager._internal.getSodium();
}

// ─── Helper: Convert Ed25519 → X25519 ────────────────────────────────────────

/**
 * Convert an Ed25519 public key to X25519 for DH.
 * Signal Protocol uses X25519 for DH, but identity keys are Ed25519.
 */
async function ed25519PublicToX25519(ed25519Public: string): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.crypto_sign_ed25519_pk_to_curve25519(
    sodium.from_base64(ed25519Public)
  );
}

/**
 * Convert an Ed25519 private key to X25519 for DH.
 */
async function ed25519PrivateToX25519(ed25519Private: string): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.crypto_sign_ed25519_sk_to_curve25519(
    sodium.from_base64(ed25519Private)
  );
}

// ─── Helper: X25519 DH ──────────────────────────────────────────────────────

/**
 * Perform a single X25519 Diffie-Hellman exchange.
 */
async function dh(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.crypto_scalarmult(privateKey, publicKey);
}

// ─── Helper: HKDF Key Derivation ─────────────────────────────────────────────

/**
 * Derive a 32-byte key from input key material using HKDF (via libsodium).
 * We use crypto_kdf_derive_from_key as a simplified HKDF construct.
 */
async function hkdfDerive(
  inputKeyMaterial: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium();

  // Use BLAKE2b-based key derivation (libsodium's generic hash as KDF)
  // Hash the concatenated DH outputs to get a 32-byte root key
  const key = sodium.crypto_generichash(
    32,
    inputKeyMaterial,
    sodium.from_string(X3DH_INFO)
  );

  return key;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const X3DHProtocol = {
  /**
   * Initiator (Alice) side of X3DH.
   *
   * Called when Alice wants to establish a session with Bob.
   * Alice fetches Bob's key bundle and computes the shared secret.
   *
   * @param localKeyStore - Alice's local key store
   * @param remoteBundle - Bob's public key bundle from the server
   * @returns X3DH result with shared secret and ephemeral key
   */
  async initiatorAgree(
    localKeyStore: LocalKeyStore,
    remoteBundle: PublicKeyBundle
  ): Promise<X3DHResult> {
    const sodium = await getSodium();

    // 1. Convert Alice's Ed25519 identity key to X25519 for DH
    const aliceIdentityDHPrivate = await ed25519PrivateToX25519(
      localKeyStore.identityKeyPair.privateKey
    );

    // 2. Generate Alice's ephemeral X25519 key pair
    const ephemeralKeyPair = await KeyManager._internal.generateX25519KeyPair();
    const ephemeralPrivate = sodium.from_base64(ephemeralKeyPair.privateKey);

    // 3. Parse Bob's public keys
    const bobIdentityDHPublic = await ed25519PublicToX25519(remoteBundle.identityKey);
    const bobSignedPreKeyPublic = sodium.from_base64(remoteBundle.signedPreKey.key);

    // 4. Verify Bob's signed pre-key signature
    const signatureValid = sodium.crypto_sign_verify_detached(
      sodium.from_base64(remoteBundle.signedPreKey.signature),
      bobSignedPreKeyPublic,
      sodium.from_base64(remoteBundle.identityKey)
    );

    if (!signatureValid) {
      throw new E2EEError(
        E2EEErrorCode.SIGNATURE_INVALID,
        'Remote signed pre-key signature is invalid — possible MITM attack'
      );
    }

    // 5. Perform DH exchanges
    //    DH1 = DH(IK_A, SPK_B)  — Alice's identity × Bob's signed pre-key
    //    DH2 = DH(EK_A, IK_B)   — Alice's ephemeral × Bob's identity
    //    DH3 = DH(EK_A, SPK_B)  — Alice's ephemeral × Bob's signed pre-key
    const dh1 = await dh(aliceIdentityDHPrivate, bobSignedPreKeyPublic);
    const dh2 = await dh(ephemeralPrivate, bobIdentityDHPublic);
    const dh3 = await dh(ephemeralPrivate, bobSignedPreKeyPublic);

    // 6. Optional DH4 with one-time pre-key
    let dh4: Uint8Array | null = null;
    let oneTimePreKeyId: number | undefined;

    if (remoteBundle.oneTimePreKey) {
      const bobOPKPublic = sodium.from_base64(remoteBundle.oneTimePreKey.key);
      dh4 = await dh(ephemeralPrivate, bobOPKPublic);
      oneTimePreKeyId = remoteBundle.oneTimePreKey.id;
    }

    // 7. Concatenate DH outputs
    const totalLength = dh1.length + dh2.length + dh3.length + (dh4?.length ?? 0);
    const dhConcat = new Uint8Array(totalLength);
    let offset = 0;
    dhConcat.set(dh1, offset); offset += dh1.length;
    dhConcat.set(dh2, offset); offset += dh2.length;
    dhConcat.set(dh3, offset); offset += dh3.length;
    if (dh4) {
      dhConcat.set(dh4, offset);
    }

    // 8. Derive shared secret via HKDF
    const sharedSecret = await hkdfDerive(dhConcat);

    return {
      sharedSecret: sodium.to_base64(sharedSecret),
      ephemeralKeyPair,
      oneTimePreKeyId,
      remoteIdentityKey: remoteBundle.identityKey,
    };
  },

  /**
   * Responder (Bob) side of X3DH.
   *
   * Called when Bob receives Alice's initial message.
   * Bob reconstructs the same shared secret.
   *
   * @param localKeyStore - Bob's local key store
   * @param initialMessage - Alice's X3DH initial message metadata
   * @returns The shared secret (should match Alice's)
   */
  async responderAgree(
    localKeyStore: LocalKeyStore,
    initialMessage: X3DHInitialMessage
  ): Promise<X3DHResult> {
    const sodium = await getSodium();

    // 1. Convert Bob's Ed25519 identity key to X25519
    const bobIdentityDHPrivate = await ed25519PrivateToX25519(
      localKeyStore.identityKeyPair.privateKey
    );

    // 2. Parse Alice's public keys
    const aliceIdentityDHPublic = await ed25519PublicToX25519(initialMessage.identityKey);
    const aliceEphemeralPublic = sodium.from_base64(initialMessage.ephemeralKey);

    // 3. Bob's signed pre-key private
    const bobSignedPreKeyPrivate = sodium.from_base64(
      localKeyStore.signedPreKey.keyPair.privateKey
    );

    // 4. Perform DH exchanges (mirrored from Alice)
    //    DH1 = DH(SPK_B, IK_A)  — Bob's signed pre-key × Alice's identity
    //    DH2 = DH(IK_B, EK_A)   — Bob's identity × Alice's ephemeral
    //    DH3 = DH(SPK_B, EK_A)  — Bob's signed pre-key × Alice's ephemeral
    const dh1 = await dh(bobSignedPreKeyPrivate, aliceIdentityDHPublic);
    const dh2 = await dh(bobIdentityDHPrivate, aliceEphemeralPublic);
    const dh3 = await dh(bobSignedPreKeyPrivate, aliceEphemeralPublic);

    // 5. Optional DH4 with one-time pre-key
    let dh4: Uint8Array | null = null;

    if (initialMessage.oneTimePreKeyId !== undefined) {
      const opk = await KeyManager.findOneTimePreKey(initialMessage.oneTimePreKeyId);
      if (opk) {
        const opkPrivate = sodium.from_base64(opk.keyPair.privateKey);
        dh4 = await dh(opkPrivate, aliceEphemeralPublic);
        // Consume the one-time pre-key (single use)
        await KeyManager.consumeOneTimePreKey(initialMessage.oneTimePreKeyId);
      }
    }

    // 6. Concatenate DH outputs (same order as initiator)
    const totalLength = dh1.length + dh2.length + dh3.length + (dh4?.length ?? 0);
    const dhConcat = new Uint8Array(totalLength);
    let offset = 0;
    dhConcat.set(dh1, offset); offset += dh1.length;
    dhConcat.set(dh2, offset); offset += dh2.length;
    dhConcat.set(dh3, offset); offset += dh3.length;
    if (dh4) {
      dhConcat.set(dh4, offset);
    }

    // 7. Derive shared secret via HKDF
    const sharedSecret = await hkdfDerive(dhConcat);

    return {
      sharedSecret: sodium.to_base64(sharedSecret),
      ephemeralKeyPair: localKeyStore.signedPreKey.keyPair, // Not really needed on responder side
      oneTimePreKeyId: initialMessage.oneTimePreKeyId,
      remoteIdentityKey: initialMessage.identityKey,
    };
  },

  /**
   * Build the initial message metadata to send alongside the first encrypted message.
   */
  buildInitialMessage(
    localKeyStore: LocalKeyStore,
    x3dhResult: X3DHResult
  ): X3DHInitialMessage {
    return {
      identityKey: localKeyStore.identityKeyPair.publicKey,
      ephemeralKey: x3dhResult.ephemeralKeyPair.publicKey,
      oneTimePreKeyId: x3dhResult.oneTimePreKeyId,
    };
  },
};
