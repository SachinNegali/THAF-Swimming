/**
 * MediaEncryption — AES-256-GCM Encryption for Media Files
 *
 * Encrypts images, videos, and other files before upload.
 * The encryption key, IV, and file hash are sent inside the
 * E2EE message envelope (not on the server).
 *
 * Uses expo-file-system v19 File/Directory/Paths API.
 *
 * Flow:
 * 1. Sender: Generate random AES key + IV → encrypt file → upload blob → send envelope
 * 2. Receiver: Download blob → verify hash → decrypt with key + IV from envelope
 */

import type { MediaEncryptionEnvelope } from '@/types/e2ee';
import { E2EEError, E2EEErrorCode } from '@/types/e2ee';
import * as Crypto from 'expo-crypto';
import { Directory, File as FSFile, Paths } from 'expo-file-system';
import { KeyManager } from './KeyManager';

// ─── Constants ───────────────────────────────────────────────────────────────

const AES_KEY_BYTES = 32;  // 256 bits
const NONCE_BYTES = 24;    // XChaCha20-Poly1305

// ─── Sodium Accessor ─────────────────────────────────────────────────────────

async function getSodium() {
  return KeyManager._internal.getSodium();
}

// ─── Directory Setup ─────────────────────────────────────────────────────────

function getEncryptedDir(): Directory {
  const dir = new Directory(Paths.cache, 'e2ee_encrypted');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

function getDecryptedDir(): Directory {
  const dir = new Directory(Paths.cache, 'e2ee_decrypted');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const MediaEncryption = {
  /**
   * Encrypt a local media file for upload.
   *
   * Reads the file, encrypts it with a random AES-256 key,
   * writes the encrypted version to a temp file, and returns
   * the encryption envelope to include in the E2EE message.
   *
   * @param localUri - Local file URI (e.g., from image picker)
   * @param mimeType - MIME type of the file
   * @returns Encrypted file path and encryption envelope
   */
  async encryptFile(
    localUri: string,
    mimeType: string
  ): Promise<{
    encryptedFilePath: string;
    envelope: Omit<MediaEncryptionEnvelope, 'url'>;
  }> {
    const sodium = await getSodium();

    // 1. Read the file as bytes
    const sourceFile = new FSFile(localUri);
    if (!sourceFile.exists) {
      throw new E2EEError(
        E2EEErrorCode.MEDIA_INTEGRITY_FAILED,
        `File not found: ${localUri}`
      );
    }

    const fileBytes = await sourceFile.bytes();

    // 2. Generate random AES key and nonce
    const aesKey = sodium.randombytes_buf(AES_KEY_BYTES);
    const nonce = sodium.randombytes_buf(NONCE_BYTES);

    // 3. Encrypt with XChaCha20-Poly1305
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      new Uint8Array(fileBytes),
      null, // no additional data for file encryption
      null,
      nonce,
      aesKey
    );

    // 4. Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce, 0);
    combined.set(ciphertext, nonce.length);

    // 5. Compute SHA-256 hash of the encrypted data (for integrity)
    const combinedBase64 = sodium.to_base64(combined);
    const hashHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combinedBase64,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    // 6. Write encrypted data to a temp file
    const encDir = getEncryptedDir();
    const encFile = new FSFile(encDir, `${Date.now()}_enc.bin`);
    encFile.create();
    encFile.write(combined);

    // 7. Return the envelope (without URL — that comes after upload)
    return {
      encryptedFilePath: encFile.uri,
      envelope: {
        aesKey: sodium.to_base64(aesKey),
        iv: sodium.to_base64(nonce),
        sha256Hash: hashHex,
        mimeType,
        sizeBytes: fileBytes.length,
      },
    };
  },

  /**
   * Decrypt a downloaded encrypted media file.
   *
   * @param encryptedFilePath - Path to the downloaded encrypted file
   * @param envelope - The encryption envelope from the E2EE message
   * @returns Local URI of the decrypted file
   */
  async decryptFile(
    encryptedFilePath: string,
    envelope: MediaEncryptionEnvelope
  ): Promise<string> {
    const sodium = await getSodium();

    // 1. Read the encrypted file
    const encFile = new FSFile(encryptedFilePath);
    const encBase64 = await encFile.base64();

    // 2. Verify SHA-256 hash
    const actualHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      encBase64,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    if (actualHash !== envelope.sha256Hash) {
      throw new E2EEError(
        E2EEErrorCode.MEDIA_INTEGRITY_FAILED,
        'Media file integrity check failed — SHA-256 hash mismatch'
      );
    }

    // 3. Parse nonce + ciphertext
    const combined = sodium.from_base64(encBase64);
    const nonce = combined.slice(0, NONCE_BYTES);
    const ciphertext = combined.slice(NONCE_BYTES);

    // 4. Decrypt with AES key from envelope
    const aesKey = sodium.from_base64(envelope.aesKey);

    let plaintext: Uint8Array;
    try {
      plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        ciphertext,
        null,
        nonce,
        aesKey
      );
    } catch {
      throw new E2EEError(
        E2EEErrorCode.DECRYPTION_FAILED,
        'Media file decryption failed — key mismatch or tampered data'
      );
    }

    // 5. Write decrypted file to cache
    const decDir = getDecryptedDir();
    const ext = mimeTypeToExtension(envelope.mimeType);
    const decFile = new FSFile(decDir, `${Date.now()}_dec${ext}`);
    decFile.create();
    decFile.write(plaintext);

    return decFile.uri;
  },

  /**
   * Encrypt a thumbnail image.
   * Returns a separate envelope for the thumbnail.
   */
  async encryptThumbnail(
    thumbnailUri: string
  ): Promise<{
    encryptedFilePath: string;
    thumbnailEnvelope: NonNullable<MediaEncryptionEnvelope['thumbnail']>;
  }> {
    const { encryptedFilePath, envelope } = await this.encryptFile(
      thumbnailUri,
      'image/jpeg'
    );

    return {
      encryptedFilePath,
      thumbnailEnvelope: {
        aesKey: envelope.aesKey,
        iv: envelope.iv,
        sha256Hash: envelope.sha256Hash,
        url: '', // Filled after upload
      },
    };
  },

  /**
   * Clean up decrypted files from cache.
   * Should be called periodically or on app background.
   */
  cleanupDecryptedCache(): void {
    const decDir = new Directory(Paths.cache, 'e2ee_decrypted');
    if (decDir.exists) {
      decDir.delete();
    }
  },

  /**
   * Clean up encrypted files from cache (after upload).
   */
  cleanupEncryptedCache(): void {
    const encDir = new Directory(Paths.cache, 'e2ee_encrypted');
    if (encDir.exists) {
      encDir.delete();
    }
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/aac': '.aac',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
  };
  return map[mimeType] || '.bin';
}
