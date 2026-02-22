/**
 * End-to-End Encryption Type Definitions
 * All types related to E2EE key management, sessions, and encrypted messages.
 */

// ─── Key Types ───────────────────────────────────────────────────────────────

/** A raw key pair (public + private) as base64 strings */
export interface KeyPair {
  publicKey: string;   // base64
  privateKey: string;  // base64
}

/** A signed pre-key with an Ed25519 signature */
export interface SignedPreKey {
  id: number;
  keyPair: KeyPair;
  signature: string;   // base64 Ed25519 signature over publicKey
  createdAt: number;   // unix timestamp ms
}

/** A one-time pre-key (ephemeral, consumed on first use) */
export interface OneTimePreKey {
  id: number;
  keyPair: KeyPair;
}

/** The full local key store for a user */
export interface LocalKeyStore {
  identityKeyPair: KeyPair;           // long-term Ed25519/X25519
  signedPreKey: SignedPreKey;         // medium-term, rotated periodically
  oneTimePreKeys: OneTimePreKey[];    // batch of ephemeral keys
  nextPreKeyId: number;              // counter for next pre-key ID
  nextSignedPreKeyId: number;        // counter for next signed pre-key ID
  deviceId: string;                  // unique device ID (UUID)
}

// ─── Key Bundle (Server-Side Public Keys) ────────────────────────────────────

/** Public key bundle uploaded to / fetched from the server */
export interface PublicKeyBundle {
  userId: string;
  deviceId: string;
  identityKey: string;               // base64 public key
  signedPreKey: {
    id: number;
    key: string;                     // base64 public key
    signature: string;               // base64 signature
  };
  oneTimePreKey?: {
    id: number;
    key: string;                     // base64 public key
  };
}

/** Request to upload a key bundle */
export interface UploadKeyBundleRequest {
  deviceId: string;
  identityKey: string;
  signedPreKey: {
    id: number;
    key: string;
    signature: string;
  };
  oneTimePreKeys: Array<{
    id: number;
    key: string;
  }>;
}

/** Request to replenish one-time pre-keys */
export interface ReplenishPreKeysRequest {
  deviceId: string;
  oneTimePreKeys: Array<{
    id: number;
    key: string;
  }>;
}

// ─── Session State ───────────────────────────────────────────────────────────

/** The state of a Double Ratchet session */
export interface SessionState {
  /** Remote party's current DH ratchet public key */
  remoteRatchetKey: string;          // base64
  /** Our current DH ratchet key pair */
  localRatchetKeyPair: KeyPair;
  /** Root key (base for deriving new chain keys) */
  rootKey: string;                   // base64
  /** Sending chain key */
  sendingChainKey: string | null;    // base64
  /** Receiving chain key */
  receivingChainKey: string | null;  // base64
  /** Number of messages sent in current sending chain */
  sendMessageNumber: number;
  /** Number of messages received in current receiving chain */
  receiveMessageNumber: number;
  /** Length of previous sending chain (for header) */
  previousChainLength: number;
  /** Cache of skipped message keys for out-of-order delivery */
  skippedMessageKeys: Record<string, string>;  // "ratchetKey:msgNum" → messageKey (base64)
  /** Remote user's identity key (for verification) */
  remoteIdentityKey: string;         // base64
  /** Our identity key public part */
  localIdentityPublicKey: string;    // base64
}

/** A message header sent alongside ciphertext */
export interface MessageHeader {
  /** Sender's current DH ratchet public key */
  ratchetKey: string;                // base64
  /** Message number in this sending chain */
  messageNumber: number;
  /** Length of previous sending chain */
  previousChainLength: number;
}

// ─── Encrypted Message ───────────────────────────────────────────────────────

/** An encrypted message ready to send to the server */
export interface EncryptedMessagePayload {
  senderDeviceId: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  /** Base64-encoded ciphertext (encrypted MessageHeader + content) */
  ciphertext: string;
  /** Ephemeral public key for X3DH initial message (only on first message) */
  ephemeralKey?: string;
  /** Which one-time pre-key was consumed (only on first message) */
  oneTimePreKeyId?: number;
  /** Message number in current chain */
  messageNumber: number;
  /** Previous chain length */
  previousChainLength: number;
  /** Encrypted attachments (for media messages) */
  attachments: EncryptedAttachment[];
}

/** Decrypted message after E2EE processing */
export interface DecryptedMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  /** Plaintext content */
  content: string;
  /** Decrypted attachments */
  attachments: DecryptedAttachment[];
  createdAt: string;
  isDeleted: boolean;
}

// ─── Media Encryption ────────────────────────────────────────────────────────

/** Metadata for an encrypted media attachment */
export interface EncryptedAttachment {
  /** URL of the encrypted blob on CDN */
  encryptedUrl: string;
  /** MIME type (plaintext for routing) */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** URL of encrypted thumbnail (optional) */
  thumbnailUrl?: string;
}

/** The encryption envelope sent inside the E2EE ciphertext for media */
export interface MediaEncryptionEnvelope {
  /** AES-256-GCM key for the media file */
  aesKey: string;                    // base64
  /** Initialization vector */
  iv: string;                       // base64
  /** SHA-256 hash of the encrypted file (for integrity) */
  sha256Hash: string;               // hex
  /** File URL on CDN */
  url: string;
  /** MIME type */
  mimeType: string;
  /** File size */
  sizeBytes: number;
  /** Optional thumbnail envelope */
  thumbnail?: {
    aesKey: string;
    iv: string;
    sha256Hash: string;
    url: string;
  };
}

/** A decrypted media attachment ready for display */
export interface DecryptedAttachment {
  /** Local file URI after decryption */
  localUri: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Decrypted thumbnail local URI */
  thumbnailUri?: string;
}

// ─── Sender Key (Group E2EE) ─────────────────────────────────────────────────

/** A sender key for group encryption */
export interface SenderKeyState {
  /** Group ID */
  groupId: string;
  /** Key ID / version for rotation tracking */
  version: number;
  /** The symmetric chain key for deriving message keys */
  chainKey: string;                  // base64
  /** Current message number in this chain */
  messageNumber: number;
  /** The sender's signing key pair (for authentication) */
  signingKeyPair: KeyPair;
}

/** A sender key distribution message (encrypted for pairwise delivery) */
export interface SenderKeyDistribution {
  groupId: string;
  senderId: string;
  senderDeviceId: string;
  version: number;
  /** The sender key encrypted for the specific recipient via pairwise E2EE */
  encryptedSenderKey: string;        // base64
}

// ─── Verification ────────────────────────────────────────────────────────────

/** Safety number for verification between two users */
export interface SafetyNumber {
  /** Numeric representation (e.g., "1234 5678 9012 ...") */
  displayNumber: string;
  /** QR code data for scanning */
  qrData: string;
  /** Whether the user has explicitly verified this safety number */
  isVerified: boolean;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

/** E2EE-specific error types */
export enum E2EEErrorCode {
  KEY_NOT_FOUND = 'E2E_KEY_NOT_FOUND',
  SESSION_NOT_FOUND = 'E2E_SESSION_NOT_FOUND',
  DECRYPTION_FAILED = 'E2E_DECRYPTION_FAILED',
  SIGNATURE_INVALID = 'E2E_SIGNATURE_INVALID',
  KEY_BUNDLE_FETCH_FAILED = 'E2E_KEY_BUNDLE_FETCH_FAILED',
  MEDIA_INTEGRITY_FAILED = 'E2E_MEDIA_INTEGRITY_FAILED',
  SENDER_KEY_MISSING = 'E2E_SENDER_KEY_MISSING',
  SODIUM_NOT_READY = 'E2E_SODIUM_NOT_READY',
}

export class E2EEError extends Error {
  code: E2EEErrorCode;

  constructor(code: E2EEErrorCode, message: string) {
    super(message);
    this.name = 'E2EEError';
    this.code = code;
  }
}
