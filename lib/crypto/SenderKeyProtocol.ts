/**
 * Sender Key Protocol — Group E2EE using Sender Keys
 *
 * Each group member generates a unique Sender Key. This key is distributed
 * to all other members via their pairwise E2EE sessions. When sending a
 * group message, the sender encrypts once with their Sender Key, and the
 * server fans the ciphertext to all members.
 *
 * Key rotation occurs when:
 * - A member is removed from the group
 * - An admin forces rotation
 * - The chain advances past a threshold
 *
 * Reference: Signal Sender Keys / MLS concepts
 */

import type {
    SenderKeyState
} from '@/types/e2ee';
import { E2EEError, E2EEErrorCode } from '@/types/e2ee';
import { KeyManager } from './KeyManager';

// ─── Constants ───────────────────────────────────────────────────────────────

const NONCE_BYTES = 24; // XChaCha20-Poly1305

// ─── Sodium Accessor ─────────────────────────────────────────────────────────

async function getSodium() {
  return KeyManager._internal.getSodium();
}

// ─── Chain KDF ───────────────────────────────────────────────────────────────

/**
 * Advance the chain key and derive a message key for group encryption.
 */
async function advanceChainKey(
  chainKey: Uint8Array
): Promise<{ newChainKey: Uint8Array; messageKey: Uint8Array }> {
  const sodium = await getSodium();

  // Message key: HMAC(chainKey, 0x01)
  const msgInput = new Uint8Array(chainKey.length + 1);
  msgInput.set(chainKey, 0);
  msgInput[chainKey.length] = 0x01;
  const messageKey = sodium.crypto_generichash(32, msgInput, null);

  // New chain key: HMAC(chainKey, 0x02)
  const ckInput = new Uint8Array(chainKey.length + 1);
  ckInput.set(chainKey, 0);
  ckInput[chainKey.length] = 0x02;
  const newChainKey = sodium.crypto_generichash(32, ckInput, null);

  return { newChainKey, messageKey };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const SenderKeyProtocol = {
  /**
   * Generate a new Sender Key for a group.
   * Called when creating or joining a group, or when rotating keys.
   */
  async generateSenderKey(groupId: string): Promise<SenderKeyState> {
    const sodium = await getSodium();
    const chainKey = sodium.randombytes_buf(32);
    const signingKeyPair = await KeyManager._internal.generateEd25519KeyPair();

    return {
      groupId,
      version: 1,
      chainKey: sodium.to_base64(chainKey),
      messageNumber: 0,
      signingKeyPair,
    };
  },

  /**
   * Serialize a sender key for distribution to a group member.
   * The serialized data will be encrypted via the pairwise E2EE session.
   */
  serializeForDistribution(senderKey: SenderKeyState): string {
    return JSON.stringify({
      groupId: senderKey.groupId,
      version: senderKey.version,
      chainKey: senderKey.chainKey,
      messageNumber: senderKey.messageNumber,
      signingPublicKey: senderKey.signingKeyPair.publicKey,
    });
  },

  /**
   * Deserialize a received sender key distribution.
   */
  deserializeDistribution(
    data: string,
    signingPublicKey: string
  ): Omit<SenderKeyState, 'signingKeyPair'> & { signingPublicKey: string } {
    const parsed = JSON.parse(data);
    return {
      groupId: parsed.groupId,
      version: parsed.version,
      chainKey: parsed.chainKey,
      messageNumber: parsed.messageNumber,
      signingPublicKey: parsed.signingPublicKey || signingPublicKey,
    };
  },

  /**
   * Encrypt a group message using the sender's Sender Key.
   *
   * @param senderKey - Our sender key for this group
   * @param plaintext - The plaintext to encrypt
   * @returns Encrypted payload and updated sender key state
   */
  async encryptGroupMessage(
    senderKey: SenderKeyState,
    plaintext: string
  ): Promise<{
    ciphertext: string; // base64 (nonce + ciphertext + signature)
    updatedSenderKey: SenderKeyState;
  }> {
    const sodium = await getSodium();

    // Advance chain key to get message key
    const { newChainKey, messageKey } = await advanceChainKey(
      sodium.from_base64(senderKey.chainKey)
    );

    // Encrypt with XChaCha20-Poly1305
    const nonce = sodium.randombytes_buf(NONCE_BYTES);
    const plaintextBytes = sodium.from_string(plaintext);

    // Associated data: group ID + version + message number
    const ad = sodium.from_string(
      `${senderKey.groupId}:${senderKey.version}:${senderKey.messageNumber}`
    );

    const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintextBytes,
      ad,
      null,
      nonce,
      messageKey
    );

    // Sign the ciphertext for sender authentication
    const signature = sodium.crypto_sign_detached(
      encrypted,
      sodium.from_base64(senderKey.signingKeyPair.privateKey)
    );

    // Combine: [nonce (24)] + [signature (64)] + [ciphertext (?)]
    const combined = new Uint8Array(
      nonce.length + signature.length + encrypted.length
    );
    combined.set(nonce, 0);
    combined.set(signature, nonce.length);
    combined.set(encrypted, nonce.length + signature.length);

    const updatedSenderKey: SenderKeyState = {
      ...senderKey,
      chainKey: sodium.to_base64(newChainKey),
      messageNumber: senderKey.messageNumber + 1,
    };

    return {
      ciphertext: sodium.to_base64(combined),
      updatedSenderKey,
    };
  },

  /**
   * Decrypt a group message from another member.
   *
   * @param senderKey - The sender's key state (received via distribution)
   * @param ciphertextBase64 - The encrypted payload
   * @param signingPublicKey - The sender's signing public key (for verification)
   */
  async decryptGroupMessage(
    senderKey: SenderKeyState,
    ciphertextBase64: string,
    signingPublicKey: string
  ): Promise<{
    plaintext: string;
    updatedSenderKey: SenderKeyState;
  }> {
    const sodium = await getSodium();

    const combined = sodium.from_base64(ciphertextBase64);

    // Parse: [nonce (24)] + [signature (64)] + [ciphertext (?)]
    const nonce = combined.slice(0, NONCE_BYTES);
    const signature = combined.slice(NONCE_BYTES, NONCE_BYTES + 64);
    const encrypted = combined.slice(NONCE_BYTES + 64);

    // Verify sender signature
    const signatureValid = sodium.crypto_sign_verify_detached(
      signature,
      encrypted,
      sodium.from_base64(signingPublicKey)
    );

    if (!signatureValid) {
      throw new E2EEError(
        E2EEErrorCode.SIGNATURE_INVALID,
        'Group message signature verification failed'
      );
    }

    // Advance chain key to get message key
    const { newChainKey, messageKey } = await advanceChainKey(
      sodium.from_base64(senderKey.chainKey)
    );

    // Decrypt
    const ad = sodium.from_string(
      `${senderKey.groupId}:${senderKey.version}:${senderKey.messageNumber}`
    );

    try {
      const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        encrypted,
        ad,
        nonce,
        messageKey
      );

      const updatedSenderKey: SenderKeyState = {
        ...senderKey,
        chainKey: sodium.to_base64(newChainKey),
        messageNumber: senderKey.messageNumber + 1,
      };

      return {
        plaintext: sodium.to_string(plaintext),
        updatedSenderKey,
      };
    } catch {
      throw new E2EEError(
        E2EEErrorCode.DECRYPTION_FAILED,
        'Group message decryption failed'
      );
    }
  },

  /**
   * Rotate the sender key for a group (e.g., when a member is removed).
   * Generates a new sender key with an incremented version.
   */
  async rotateSenderKey(
    currentSenderKey: SenderKeyState
  ): Promise<SenderKeyState> {
    const sodium = await getSodium();
    const newChainKey = sodium.randombytes_buf(32);
    const newSigningKeyPair = await KeyManager._internal.generateEd25519KeyPair();

    return {
      groupId: currentSenderKey.groupId,
      version: currentSenderKey.version + 1,
      chainKey: sodium.to_base64(newChainKey),
      messageNumber: 0,
      signingKeyPair: newSigningKeyPair,
    };
  },
};
