/**
 * CryptoService — High-Level E2EE API
 *
 * This is the primary interface that the rest of the app uses.
 * It orchestrates key management, session establishment, and
 * message encryption/decryption without exposing protocol details.
 *
 * Usage:
 *   await CryptoService.initialize()
 *   const encrypted = await CryptoService.encryptMessage(recipientId, deviceId, "Hello!")
 *   const decrypted = await CryptoService.decryptMessage(senderId, deviceId, encrypted)
 */

import type {
    EncryptedMessagePayload,
    LocalKeyStore,
    MediaEncryptionEnvelope,
    PublicKeyBundle,
    SenderKeyState,
    UploadKeyBundleRequest
} from '@/types/e2ee';
import { E2EEError, E2EEErrorCode } from '@/types/e2ee';
import { DoubleRatchet } from './DoubleRatchet';
import { KeyManager } from './KeyManager';
import { MediaEncryption } from './MediaEncryption';
import { SenderKeyProtocol } from './SenderKeyProtocol';
import { SessionStore } from './SessionStore';
import type { X3DHInitialMessage } from './X3DHProtocol';
import { X3DHProtocol } from './X3DHProtocol';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EncryptResult {
  /** The encrypted payload ready to send to the server */
  payload: EncryptedMessagePayload;
  /** Whether this was the first message (X3DH initial) */
  isInitialMessage: boolean;
}

export interface DecryptResult {
  /** The decrypted plaintext content */
  plaintext: string;
  /** Whether a new session was established (first message from this user) */
  isNewSession: boolean;
}

export interface EncryptedMediaResult {
  /** Path to the encrypted file (for upload) */
  encryptedFilePath: string;
  /** Encryption envelope to include in the E2EE message */
  envelope: Omit<MediaEncryptionEnvelope, 'url'>;
}

// ─── Initialization State ────────────────────────────────────────────────────

let _initialized = false;
let _localKeyStore: LocalKeyStore | null = null;

// ─── Public API ──────────────────────────────────────────────────────────────

export const CryptoService = {
  /**
   * Initialize the E2EE system.
   * Loads or generates keys, returns upload request if new keys were created.
   *
   * Call this once on app startup after authentication.
   */
  async initialize(): Promise<{
    uploadRequest: UploadKeyBundleRequest | null;
    isNew: boolean;
    deviceId: string;
  }> {
    const { keyStore, uploadRequest, isNew } =
      await KeyManager.getOrInitialize();

    _localKeyStore = keyStore;
    _initialized = true;

    return {
      uploadRequest,
      isNew,
      deviceId: keyStore.deviceId,
    };
  },

  /**
   * Check if the crypto system is initialized.
   */
  isInitialized(): boolean {
    return _initialized && _localKeyStore !== null;
  },

  /**
   * Ensure the system is initialized before any operation.
   */
  _ensureInitialized(): LocalKeyStore {
    if (!_initialized || !_localKeyStore) {
      throw new E2EEError(
        E2EEErrorCode.SODIUM_NOT_READY,
        'CryptoService not initialized. Call initialize() first.'
      );
    }
    return _localKeyStore;
  },

  // ─── 1:1 DM Encryption ──────────────────────────────────────────────────

  /**
   * Encrypt a text message for a 1:1 DM.
   *
   * If no session exists with the recipient, performs X3DH key exchange first.
   * Requires the recipient's key bundle (fetched from server).
   *
   * @param recipientId - Recipient's user ID
   * @param recipientDeviceId - Recipient's device ID
   * @param plaintext - The plaintext message
   * @param recipientBundle - Recipient's public key bundle (required for first message)
   */
  async encryptDirectMessage(
    recipientId: string,
    recipientDeviceId: string,
    plaintext: string,
    recipientBundle?: PublicKeyBundle
  ): Promise<EncryptResult> {
    const keyStore = this._ensureInitialized();

    // Check for existing session
    let session = await SessionStore.loadSession(
      recipientId,
      recipientDeviceId
    );
    let isInitialMessage = false;
    let ephemeralKey: string | undefined;
    let oneTimePreKeyId: number | undefined;

    if (!session) {
      // No session → need X3DH key exchange
      if (!recipientBundle) {
        throw new E2EEError(
          E2EEErrorCode.KEY_BUNDLE_FETCH_FAILED,
          'No existing session and no key bundle provided. Fetch recipient key bundle first.'
        );
      }

      // Perform X3DH
      const x3dhResult = await X3DHProtocol.initiatorAgree(
        keyStore,
        recipientBundle
      );

      // Initialize Double Ratchet as sender
      session = await DoubleRatchet.initSender(
        x3dhResult.sharedSecret,
        recipientBundle.signedPreKey.key,
        x3dhResult.remoteIdentityKey,
        keyStore.identityKeyPair.publicKey
      );

      ephemeralKey = x3dhResult.ephemeralKeyPair.publicKey;
      oneTimePreKeyId = x3dhResult.oneTimePreKeyId;
      isInitialMessage = true;
    }

    // Encrypt with Double Ratchet
    const { header, ciphertext, updatedSession } =
      await DoubleRatchet.encrypt(session, plaintext);

    // Persist updated session
    await SessionStore.saveSession(
      recipientId,
      recipientDeviceId,
      updatedSession
    );

    const payload: EncryptedMessagePayload = {
      senderDeviceId: keyStore.deviceId,
      type: 'text',
      ciphertext,
      ephemeralKey,
      oneTimePreKeyId,
      messageNumber: header.messageNumber,
      previousChainLength: header.previousChainLength,
      attachments: [],
    };

    return { payload, isInitialMessage };
  },

  /**
   * Decrypt a received 1:1 DM.
   *
   * @param senderId - Sender's user ID
   * @param senderDeviceId - Sender's device ID
   * @param payload - The encrypted message payload from the server
   * @param senderIdentityKey - Sender's identity key (for X3DH if initial message)
   */
  async decryptDirectMessage(
    senderId: string,
    senderDeviceId: string,
    payload: EncryptedMessagePayload,
    senderIdentityKey?: string
  ): Promise<DecryptResult> {
    const keyStore = this._ensureInitialized();

    let session = await SessionStore.loadSession(senderId, senderDeviceId);
    let isNewSession = false;

    if (!session && payload.ephemeralKey) {
      // This is an initial X3DH message
      if (!senderIdentityKey) {
        throw new E2EEError(
          E2EEErrorCode.KEY_BUNDLE_FETCH_FAILED,
          'Initial message received but sender identity key not provided'
        );
      }

      const x3dhInitial: X3DHInitialMessage = {
        identityKey: senderIdentityKey,
        ephemeralKey: payload.ephemeralKey,
        oneTimePreKeyId: payload.oneTimePreKeyId,
      };

      // Perform responder-side X3DH
      const x3dhResult = await X3DHProtocol.responderAgree(
        keyStore,
        x3dhInitial
      );

      // Initialize Double Ratchet as receiver
      session = await DoubleRatchet.initReceiver(
        x3dhResult.sharedSecret,
        keyStore.signedPreKey.keyPair,
        x3dhResult.remoteIdentityKey,
        keyStore.identityKeyPair.publicKey
      );

      isNewSession = true;
    }

    if (!session) {
      throw new E2EEError(
        E2EEErrorCode.SESSION_NOT_FOUND,
        `No session found for user ${senderId} device ${senderDeviceId}`
      );
    }

    // Reconstruct the header from payload fields
    // The ratchet key is embedded in the ciphertext's associated data
    // For decryption, we need to figure out the ratchet key from the message
    // In practice, the header is sent alongside the ciphertext
    const header = {
      ratchetKey: '', // Will be parsed from the ciphertext structure
      messageNumber: payload.messageNumber,
      previousChainLength: payload.previousChainLength,
    };

    // The ciphertext already contains the header info as associated data
    const { plaintext, updatedSession } = await DoubleRatchet.decrypt(
      session,
      header,
      payload.ciphertext
    );

    // Persist updated session
    await SessionStore.saveSession(senderId, senderDeviceId, updatedSession);

    return { plaintext, isNewSession };
  },

  // ─── Group Encryption ────────────────────────────────────────────────────

  /**
   * Generate a Sender Key for a group and prepare distributions.
   *
   * @param groupId - The group chat ID
   * @returns The sender key state (store locally) and serialized key for distribution
   */
  async createGroupSenderKey(groupId: string): Promise<{
    senderKey: SenderKeyState;
    serializedForDistribution: string;
  }> {
    this._ensureInitialized();

    const senderKey = await SenderKeyProtocol.generateSenderKey(groupId);
    const serialized =
      SenderKeyProtocol.serializeForDistribution(senderKey);

    // Store our own sender key
    const keyStore = this._ensureInitialized();
    await SessionStore.saveSenderKey(
      groupId,
      'self',
      keyStore.deviceId,
      senderKey
    );

    return { senderKey, serializedForDistribution: serialized };
  },

  /**
   * Encrypt a group message.
   */
  async encryptGroupMessage(
    groupId: string,
    plaintext: string
  ): Promise<{ ciphertext: string }> {
    const keyStore = this._ensureInitialized();

    const senderKey = await SessionStore.loadSenderKey(
      groupId,
      'self',
      keyStore.deviceId
    );

    if (!senderKey) {
      throw new E2EEError(
        E2EEErrorCode.SENDER_KEY_MISSING,
        `No sender key found for group ${groupId}. Create one first.`
      );
    }

    const { ciphertext, updatedSenderKey } =
      await SenderKeyProtocol.encryptGroupMessage(senderKey, plaintext);

    // Persist updated sender key
    await SessionStore.saveSenderKey(
      groupId,
      'self',
      keyStore.deviceId,
      updatedSenderKey
    );

    return { ciphertext };
  },

  /**
   * Decrypt a group message from another member.
   */
  async decryptGroupMessage(
    groupId: string,
    senderId: string,
    senderDeviceId: string,
    ciphertext: string,
    signingPublicKey: string
  ): Promise<string> {
    this._ensureInitialized();

    const senderKey = await SessionStore.loadSenderKey(
      groupId,
      senderId,
      senderDeviceId
    );

    if (!senderKey) {
      throw new E2EEError(
        E2EEErrorCode.SENDER_KEY_MISSING,
        `No sender key from ${senderId} for group ${groupId}`
      );
    }

    const { plaintext, updatedSenderKey } =
      await SenderKeyProtocol.decryptGroupMessage(
        senderKey,
        ciphertext,
        signingPublicKey
      );

    // Persist updated sender key
    await SessionStore.saveSenderKey(
      groupId,
      senderId,
      senderDeviceId,
      updatedSenderKey
    );

    return plaintext;
  },

  /**
   * Rotate sender key for a group (e.g., after a member is removed).
   */
  async rotateGroupSenderKey(groupId: string): Promise<{
    senderKey: SenderKeyState;
    serializedForDistribution: string;
  }> {
    const keyStore = this._ensureInitialized();

    const currentKey = await SessionStore.loadSenderKey(
      groupId,
      'self',
      keyStore.deviceId
    );

    if (!currentKey) {
      // No existing key, generate fresh
      return this.createGroupSenderKey(groupId);
    }

    const newKey = await SenderKeyProtocol.rotateSenderKey(currentKey);
    await SessionStore.saveSenderKey(
      groupId,
      'self',
      keyStore.deviceId,
      newKey
    );

    return {
      senderKey: newKey,
      serializedForDistribution:
        SenderKeyProtocol.serializeForDistribution(newKey),
    };
  },

  // ─── Media Encryption ────────────────────────────────────────────────────

  /**
   * Encrypt a media file for upload.
   */
  async encryptMedia(
    localUri: string,
    mimeType: string
  ): Promise<EncryptedMediaResult> {
    this._ensureInitialized();
    return MediaEncryption.encryptFile(localUri, mimeType);
  },

  /**
   * Decrypt a downloaded media file.
   */
  async decryptMedia(
    encryptedFilePath: string,
    envelope: MediaEncryptionEnvelope
  ): Promise<string> {
    this._ensureInitialized();
    return MediaEncryption.decryptFile(encryptedFilePath, envelope);
  },

  // ─── Key Management ──────────────────────────────────────────────────────

  /**
   * Check if signed pre-key needs rotation and return upload request if so.
   */
  async checkKeyRotation(): Promise<UploadKeyBundleRequest | null> {
    return KeyManager.rotateSignedPreKeyIfNeeded();
  },

  /**
   * Check if one-time pre-keys need replenishment.
   */
  async checkPreKeyReplenishment(): Promise<{
    needed: boolean;
    newKeys?: Array<{ id: number; key: string }>;
    deviceId?: string;
  }> {
    const needed = await KeyManager.needsReplenishment();
    if (!needed) return { needed: false };

    const { deviceId, newKeys } = await KeyManager.replenishOneTimePreKeys();
    return { needed: true, newKeys, deviceId };
  },

  /**
   * Get the local identity public key (for safety number display).
   */
  async getIdentityPublicKey(): Promise<string | null> {
    return KeyManager.getIdentityPublicKey();
  },

  /**
   * Generate a safety number for verification with a remote user.
   */
  async generateSafetyNumber(
    remoteIdentityKey: string
  ): Promise<string> {
    const localKey = await this.getIdentityPublicKey();
    if (!localKey) {
      throw new E2EEError(
        E2EEErrorCode.KEY_NOT_FOUND,
        'Local identity key not available'
      );
    }

    const sodium = await KeyManager._internal.getSodium();

    // Combine both identity keys and hash them
    const combined = new Uint8Array(
      sodium.from_base64(localKey).length +
      sodium.from_base64(remoteIdentityKey).length
    );

    // Sort keys to ensure both parties compute the same number
    const localBytes = sodium.from_base64(localKey);
    const remoteBytes = sodium.from_base64(remoteIdentityKey);

    if (localKey < remoteIdentityKey) {
      combined.set(localBytes, 0);
      combined.set(remoteBytes, localBytes.length);
    } else {
      combined.set(remoteBytes, 0);
      combined.set(localBytes, remoteBytes.length);
    }

    // Hash to 30 bytes and format as 12 groups of 5 digits
    const hash = sodium.crypto_generichash(30, combined, null);
    const digits = Array.from(hash)
      .map((b: number) => String(b % 100000).padStart(5, '0'))
      .slice(0, 12);

    return digits.join(' ');
  },

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  /**
   * Wipe ALL E2EE state. Used on logout or account deletion.
   * WARNING: This is irreversible.
   */
  async wipeAll(): Promise<void> {
    await SessionStore.wipeAll();
    await KeyManager.wipeKeys();
    MediaEncryption.cleanupDecryptedCache();
    MediaEncryption.cleanupEncryptedCache();
    _initialized = false;
    _localKeyStore = null;
  },

  /**
   * Clean up temporary media files.
   */
  cleanupMediaCache(): void {
    MediaEncryption.cleanupDecryptedCache();
    MediaEncryption.cleanupEncryptedCache();
  },
};
