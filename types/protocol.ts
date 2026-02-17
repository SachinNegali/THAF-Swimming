// types/protocol.ts

// Key pair for cryptographic operations
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

// Pre-key bundle for X3DH key exchange
export interface PreKeyBundle {
  identityKey: string;       // Base64
  signedPreKey: string;      // Base64
  signature: string;         // Base64
  oneTimePreKey?: string;    // Base64 (optional)
}

// Ratchet state for Double Ratchet algorithm
export interface RatchetState {
  rootKey: Uint8Array;
  chainKey: Uint8Array;
  messageNumber: number;
  sendingChainKey?: Uint8Array | null;
  receivingChainKey?: Uint8Array | null;
  sendingMessageNumber?: number;
  receivingMessageNumber?: number;
  skippedMessageKeys?: Map<number, Uint8Array>;
}

// Member key state for group encryption
export interface MemberKeyState {
  senderKey: Uint8Array;
  signingKey: Uint8Array;
  chainIndex: number;
}

// Group encrypted message
export interface GroupEncryptedMessage {
  ciphertext: string;        // Base64
  nonce: string;             // Base64
  senderId: string;
  signature: string;         // Base64
  senderKeyId: number;
}

// Message content types
export interface MessageContent {
  type: 'text' | 'media';
  text?: string;
  filePath?: string;
  thumbnail?: string;
}

export interface EncryptedMessage {
  version: 1;
  type: 'text' | 'media' | 'control';
  
  // Encryption metadata
  payload: {
    ciphertext: string;      // Base64
    nonce: string;           // Base64
    ephemeralKey?: string;   // For DH ratchet (Base64)
    
    // For groups
    senderKeyId?: number;
    signature?: string;      // Ed25519 signature (Base64)
  };
  
  // Media specific
  mediaHeader?: MediaHeader;
  
  // Metadata (unencrypted for routing)
  senderId: string;
  recipientId: string;       // Or groupId
  timestamp: number;
  messageId: string;
  
  // Ratchet state
  chainStep: number;
  previousChainLength?: number;
  ciphertext?: string;
  nonce?: string;
  messageNumber?: number;
  senderIdentityKey?: string;
  ephemeralKey?: string;
}

export interface MediaHeader {
  encryptedKey: string;      // File encryption key (encrypted with session)
  keyNonce: string;
  fileHash: string;          // SHA-256 of plaintext
  chunkSize: number;
  totalChunks: number;
  mimeType: string;
  fileName: string;
  thumbnail?: string;        // Encrypted thumbnail data
  fileKeyEnc?: string;
  nonce?: string;
}