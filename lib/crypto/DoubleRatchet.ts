/**
 * Double Ratchet Algorithm — Forward-Secret Message Encryption
 *
 * Implements the Double Ratchet algorithm for end-to-end encrypted messaging:
 *   1. DH Ratchet: Periodically rotates DH key pairs for future secrecy
 *   2. Symmetric-key Ratchet: KDF chain advances per message for forward secrecy
 *
 * Each message gets a unique message key derived from the chain key.
 * Skipped message keys are cached for out-of-order delivery.
 *
 * Reference: https://signal.org/docs/specifications/doubleratchet/
 */

import type {
    KeyPair,
    MessageHeader,
    SessionState,
} from '@/types/e2ee';
import { E2EEError, E2EEErrorCode } from '@/types/e2ee';
import { KeyManager } from './KeyManager';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum number of skipped message keys to cache */
const MAX_SKIP = 1000;
/** Nonce size for XChaCha20-Poly1305 (24 bytes / 192 bits) */
const NONCE_BYTES = 24;
/** Key size for AES-256-GCM (32 bytes / 256 bits) */
const KEY_BYTES = 32;
/** Chain KDF info strings */
const CHAIN_KEY_INFO = 'THAF_ChainKey';
const MESSAGE_KEY_INFO = 'THAF_MessageKey';
const ROOT_KEY_INFO = 'THAF_RootKey';

// ─── Sodium Accessor ─────────────────────────────────────────────────────────

async function getSodium() {
  return KeyManager._internal.getSodium();
}

// ─── KDF Helpers ─────────────────────────────────────────────────────────────

/**
 * KDF for root key ratchet step.
 * Derives a new root key and chain key from the current root key + DH output.
 */
async function kdfRootKey(
  rootKey: Uint8Array,
  dhOutput: Uint8Array
): Promise<{ newRootKey: Uint8Array; chainKey: Uint8Array }> {
  const sodium = await getSodium();

  // Concatenate rootKey + dhOutput as input
  const input = new Uint8Array(rootKey.length + dhOutput.length);
  input.set(rootKey, 0);
  input.set(dhOutput, rootKey.length);

  // Derive 64 bytes: first 32 = new root key, next 32 = chain key
  const derived = sodium.crypto_generichash(
    64,
    input,
    sodium.from_string(ROOT_KEY_INFO)
  );

  return {
    newRootKey: derived.slice(0, 32),
    chainKey: derived.slice(32, 64),
  };
}

/**
 * KDF for symmetric chain ratchet.
 * Advances the chain key and derives a message key.
 */
async function kdfChainKey(
  chainKey: Uint8Array
): Promise<{ newChainKey: Uint8Array; messageKey: Uint8Array }> {
  const sodium = await getSodium();

  // Derive message key: HMAC(chainKey, 0x01)
  const messageInput = new Uint8Array(chainKey.length + 1);
  messageInput.set(chainKey, 0);
  messageInput[chainKey.length] = 0x01;
  const messageKey = sodium.crypto_generichash(KEY_BYTES, messageInput, null);

  // Derive new chain key: HMAC(chainKey, 0x02)
  const chainInput = new Uint8Array(chainKey.length + 1);
  chainInput.set(chainKey, 0);
  chainInput[chainKey.length] = 0x02;
  const newChainKey = sodium.crypto_generichash(KEY_BYTES, chainInput, null);

  return { newChainKey, messageKey };
}

/**
 * Perform a DH exchange between our private key and their public key.
 */
async function performDH(
  privateKey: string,
  publicKey: string
): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.crypto_scalarmult(
    sodium.from_base64(privateKey),
    sodium.from_base64(publicKey)
  );
}

// ─── Encryption / Decryption ─────────────────────────────────────────────────

/**
 * Encrypt plaintext with AES-256-GCM.
 */
async function aesEncrypt(
  messageKey: Uint8Array,
  plaintext: string,
  associatedData: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(NONCE_BYTES);
  const plaintextBytes = sodium.from_string(plaintext);

  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintextBytes,
    associatedData,
    null, // nsec (unused)
    nonce,
    messageKey
  );

  return { ciphertext, nonce };
}

/**
 * Decrypt ciphertext with AES-256-GCM.
 */
async function aesDecrypt(
  messageKey: Uint8Array,
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  associatedData: Uint8Array
): Promise<string> {
  const sodium = await getSodium();

  const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null, // nsec (unused)
    ciphertext,
    associatedData,
    nonce,
    messageKey
  );

  return sodium.to_string(plaintext);
}

// ─── Skipped Key Helper ──────────────────────────────────────────────────────

function skippedKeyId(ratchetKey: string, messageNum: number): string {
  return `${ratchetKey}:${messageNum}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const DoubleRatchet = {
  /**
   * Initialize a ratchet session as the INITIATOR (Alice).
   * Called after X3DH completes on the sender side.
   *
   * @param sharedSecret - The X3DH shared secret (base64, 32 bytes)
   * @param remoteRatchetKey - Bob's signed pre-key public key (initial ratchet key)
   * @param remoteIdentityKey - Bob's identity public key (for verification)
   * @param localIdentityPublicKey - Alice's identity public key
   */
  async initSender(
    sharedSecret: string,
    remoteRatchetKey: string,
    remoteIdentityKey: string,
    localIdentityPublicKey: string
  ): Promise<SessionState> {
    const sodium = await getSodium();

    // Generate our initial DH ratchet key pair
    const localRatchetKeyPair = await KeyManager._internal.generateX25519KeyPair();

    // Perform DH with remote's initial ratchet key
    const dhOutput = await performDH(localRatchetKeyPair.privateKey, remoteRatchetKey);

    // Derive root key and sending chain key
    const { newRootKey, chainKey } = await kdfRootKey(
      sodium.from_base64(sharedSecret),
      dhOutput
    );

    return {
      remoteRatchetKey,
      localRatchetKeyPair,
      rootKey: sodium.to_base64(newRootKey),
      sendingChainKey: sodium.to_base64(chainKey),
      receivingChainKey: null,
      sendMessageNumber: 0,
      receiveMessageNumber: 0,
      previousChainLength: 0,
      skippedMessageKeys: {},
      remoteIdentityKey,
      localIdentityPublicKey,
    };
  },

  /**
   * Initialize a ratchet session as the RESPONDER (Bob).
   * Called after X3DH completes on the receiver side.
   *
   * @param sharedSecret - The X3DH shared secret (base64, 32 bytes)
   * @param localRatchetKeyPair - Bob's signed pre-key key pair (initial ratchet key)
   * @param remoteIdentityKey - Alice's identity public key
   * @param localIdentityPublicKey - Bob's identity public key
   */
  async initReceiver(
    sharedSecret: string,
    localRatchetKeyPair: KeyPair,
    remoteIdentityKey: string,
    localIdentityPublicKey: string
  ): Promise<SessionState> {
    return {
      remoteRatchetKey: '', // Will be set when we receive Alice's first message
      localRatchetKeyPair,
      rootKey: sharedSecret,
      sendingChainKey: null,
      receivingChainKey: null,
      sendMessageNumber: 0,
      receiveMessageNumber: 0,
      previousChainLength: 0,
      skippedMessageKeys: {},
      remoteIdentityKey,
      localIdentityPublicKey,
    };
  },

  /**
   * Encrypt a message using the current session state.
   *
   * @param session - Current session state (mutated in place)
   * @param plaintext - The plaintext message to encrypt
   * @returns The encrypted payload (header + ciphertext + nonce) and updated session
   */
  async encrypt(
    session: SessionState,
    plaintext: string
  ): Promise<{
    header: MessageHeader;
    ciphertext: string;  // base64
    updatedSession: SessionState;
  }> {
    const sodium = await getSodium();

    if (!session.sendingChainKey) {
      throw new E2EEError(
        E2EEErrorCode.SESSION_NOT_FOUND,
        'No sending chain key — session not properly initialized'
      );
    }

    // Advance the sending chain
    const { newChainKey, messageKey } = await kdfChainKey(
      sodium.from_base64(session.sendingChainKey)
    );

    // Build header
    const header: MessageHeader = {
      ratchetKey: session.localRatchetKeyPair.publicKey,
      messageNumber: session.sendMessageNumber,
      previousChainLength: session.previousChainLength,
    };

    // Serialize header as associated data (ensures header integrity)
    const ad = sodium.from_string(JSON.stringify(header));

    // Encrypt
    const { ciphertext, nonce } = await aesEncrypt(messageKey, plaintext, ad);

    // Combine nonce + ciphertext for transport
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce, 0);
    combined.set(ciphertext, nonce.length);

    // Update session state
    const updatedSession: SessionState = {
      ...session,
      sendingChainKey: sodium.to_base64(newChainKey),
      sendMessageNumber: session.sendMessageNumber + 1,
    };

    return {
      header,
      ciphertext: sodium.to_base64(combined),
      updatedSession,
    };
  },

  /**
   * Decrypt a received message.
   *
   * Handles DH ratchet step if the sender's ratchet key has changed,
   * and handles out-of-order delivery via skipped key cache.
   *
   * @param session - Current session state
   * @param header - The message header
   * @param ciphertextBase64 - The encrypted payload (nonce + ciphertext, base64)
   * @returns Decrypted plaintext and updated session
   */
  async decrypt(
    session: SessionState,
    header: MessageHeader,
    ciphertextBase64: string
  ): Promise<{
    plaintext: string;
    updatedSession: SessionState;
  }> {
    const sodium = await getSodium();

    // 1. Check skipped message keys first (out-of-order delivery)
    const skipId = skippedKeyId(header.ratchetKey, header.messageNumber);
    if (session.skippedMessageKeys[skipId]) {
      const messageKey = sodium.from_base64(session.skippedMessageKeys[skipId]);
      const plaintext = await decryptWithKey(sodium, messageKey, ciphertextBase64, header);

      const updatedSkipped = { ...session.skippedMessageKeys };
      delete updatedSkipped[skipId];

      return {
        plaintext,
        updatedSession: { ...session, skippedMessageKeys: updatedSkipped },
      };
    }

    let currentSession = { ...session };

    // 2. DH ratchet step if the sender's ratchet key changed
    if (header.ratchetKey !== currentSession.remoteRatchetKey) {
      // Skip any missed messages in the current receiving chain
      currentSession = await skipMessages(
        currentSession,
        header.previousChainLength
      );

      // Perform DH ratchet
      currentSession = await dhRatchetStep(currentSession, header.ratchetKey);
    }

    // 3. Skip any missed messages in the new chain
    currentSession = await skipMessages(currentSession, header.messageNumber);

    // 4. Advance the receiving chain
    if (!currentSession.receivingChainKey) {
      throw new E2EEError(
        E2EEErrorCode.DECRYPTION_FAILED,
        'No receiving chain key available'
      );
    }

    const { newChainKey, messageKey } = await kdfChainKey(
      sodium.from_base64(currentSession.receivingChainKey)
    );

    // 5. Decrypt the message
    const plaintext = await decryptWithKey(sodium, messageKey, ciphertextBase64, header);

    const updatedSession: SessionState = {
      ...currentSession,
      receivingChainKey: sodium.to_base64(newChainKey),
      receiveMessageNumber: currentSession.receiveMessageNumber + 1,
    };

    return { plaintext, updatedSession };
  },

  /**
   * Serialize session state for persistent storage.
   */
  serializeSession(session: SessionState): string {
    return JSON.stringify(session);
  },

  /**
   * Deserialize session state from storage.
   */
  deserializeSession(data: string): SessionState {
    return JSON.parse(data) as SessionState;
  },
};

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Perform a DH ratchet step: Update root key and create new receiving chain.
 */
async function dhRatchetStep(
  session: SessionState,
  newRemoteRatchetKey: string
): Promise<SessionState> {
  const sodium = await getSodium();

  // Save previous sending chain length
  const previousChainLength = session.sendMessageNumber;

  // DH with new remote key using our current key pair
  const dhOutput = await performDH(
    session.localRatchetKeyPair.privateKey,
    newRemoteRatchetKey
  );

  // Derive new root key and receiving chain key
  const { newRootKey, chainKey: receivingChainKey } = await kdfRootKey(
    sodium.from_base64(session.rootKey),
    dhOutput
  );

  // Generate new local ratchet key pair
  const newLocalRatchetKeyPair = await KeyManager._internal.generateX25519KeyPair();

  // DH with new remote key using our NEW key pair
  const dhOutput2 = await performDH(
    newLocalRatchetKeyPair.privateKey,
    newRemoteRatchetKey
  );

  // Derive new root key and sending chain key
  const { newRootKey: finalRootKey, chainKey: sendingChainKey } = await kdfRootKey(
    newRootKey,
    dhOutput2
  );

  return {
    ...session,
    remoteRatchetKey: newRemoteRatchetKey,
    localRatchetKeyPair: newLocalRatchetKeyPair,
    rootKey: sodium.to_base64(finalRootKey),
    sendingChainKey: sodium.to_base64(sendingChainKey),
    receivingChainKey: sodium.to_base64(receivingChainKey),
    sendMessageNumber: 0,
    receiveMessageNumber: 0,
    previousChainLength,
  };
}

/**
 * Skip missed messages by advancing the chain and caching the message keys.
 */
async function skipMessages(
  session: SessionState,
  until: number
): Promise<SessionState> {
  const sodium = await getSodium();

  if (!session.receivingChainKey) return session;

  let currentChainKey = sodium.from_base64(session.receivingChainKey);
  const skipped = { ...session.skippedMessageKeys };
  let currentMsgNum = session.receiveMessageNumber;

  while (currentMsgNum < until) {
    if (Object.keys(skipped).length >= MAX_SKIP) {
      throw new E2EEError(
        E2EEErrorCode.DECRYPTION_FAILED,
        'Too many skipped messages — possible protocol violation'
      );
    }

    const { newChainKey, messageKey } = await kdfChainKey(currentChainKey);
    const skipId = skippedKeyId(session.remoteRatchetKey, currentMsgNum);
    skipped[skipId] = sodium.to_base64(messageKey);

    currentChainKey = newChainKey;
    currentMsgNum++;
  }

  return {
    ...session,
    receivingChainKey: sodium.to_base64(currentChainKey),
    receiveMessageNumber: currentMsgNum,
    skippedMessageKeys: skipped,
  };
}

/**
 * Decrypt ciphertext with a specific message key.
 */
async function decryptWithKey(
  sodium: Awaited<ReturnType<typeof getSodium>>,
  messageKey: Uint8Array,
  ciphertextBase64: string,
  header: MessageHeader
): Promise<string> {
  const combined = sodium.from_base64(ciphertextBase64);
  const nonce = combined.slice(0, NONCE_BYTES);
  const ciphertext = combined.slice(NONCE_BYTES);
  const ad = sodium.from_string(JSON.stringify(header));

  try {
    return await aesDecrypt(messageKey, ciphertext, nonce, ad);
  } catch {
    throw new E2EEError(
      E2EEErrorCode.DECRYPTION_FAILED,
      'Message decryption failed — key mismatch or tampered data'
    );
  }
}
