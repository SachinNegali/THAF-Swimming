// crypto/MediaEncryption.ts
import { decode, encode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as sodium from 'react-native-libsodium';
import type { MediaHeader } from '../types/protocol';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const FILE_KEY_SIZE = 32;

export class MediaEncryption {
  // Encrypt large file with chunking
  async encryptFile(
    inputPath: string,
    outputPath: string,
    sessionKey: Uint8Array
  ): Promise<MediaHeader> {
    // Generate unique file key
    const fileKey = sodium.randombytes_buf(FILE_KEY_SIZE);
    const fileNonce = sodium.randombytes_buf(12);

    // Encrypt file key with session key
    const fileKeyEnc = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      fileKey,
      new TextEncoder().encode('media-key'),
      null,
      fileNonce,
      sessionKey
    );

    const fileInfo = await FileSystem.getInfoAsync(inputPath);
    if (!fileInfo.exists || !fileInfo.size) {
      throw new Error('File does not exist or is empty');
    }

    const totalChunks = Math.ceil(fileInfo.size / CHUNK_SIZE);
    const hashState = sodium.crypto_generichash_init(null, 32);

    // Read and encrypt file in chunks
    let chunkIndex = 0;
    let offset = 0;
    const encryptedChunks: string[] = [];

    while (offset < fileInfo.size) {
      const length = Math.min(CHUNK_SIZE, fileInfo.size - offset);
      
      // Read chunk using expo-file-system
      const chunkBase64 = await FileSystem.readAsStringAsync(inputPath, {
        encoding: 'base64',
        position: offset,
        length: length,
      });

      // Convert base64 to Uint8Array
      const chunkBuffer = decode(chunkBase64);
      const chunk = new Uint8Array(chunkBuffer);

      // Derive chunk key: HKDF(fileKey, chunkIndex)
      const chunkKey = await this.deriveChunkKey(fileKey, chunkIndex);
      const nonce = await this.deriveChunkNonce(fileKey, chunkIndex);
      
      // Encrypt chunk
      const encryptedChunk = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        chunk,
        new TextEncoder().encode(`chunk-${chunkIndex}`),
        null,
        nonce,
        chunkKey
      );

      // Update hash of plaintext
      sodium.crypto_generichash_update(hashState, chunk);
      
      // Store encrypted chunk as base64
      encryptedChunks.push(encode(encryptedChunk));
      
      offset += length;
      chunkIndex++;
    }

    // Write all encrypted chunks to output file
    const encryptedData = encryptedChunks.join('');
    await FileSystem.writeAsStringAsync(outputPath, encryptedData, {
      encoding: 'base64',
    });

    const fileHash = sodium.crypto_generichash_final(hashState, 32);

    return {
      fileKeyEnc: encode(fileKeyEnc),
      nonce: encode(fileNonce),
      chunkSize: CHUNK_SIZE,
      totalChunks,
      fileHash: encode(fileHash),
      encryptedKey: encode(fileKeyEnc),
      keyNonce: encode(fileNonce),
      mimeType: '',
      fileName: inputPath.split('/').pop() || 'unknown',
    };
  }

  async decryptFile(
    inputPath: string,
    outputPath: string,
    header: MediaHeader,
    sessionKey: Uint8Array
  ): Promise<void> {
    // Decrypt file key
    const fileKey = await sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      new Uint8Array(decode(header.fileKeyEnc || header.encryptedKey)),
      new TextEncoder().encode('media-key'),
      new Uint8Array(decode(header.nonce || header.keyNonce)),
      sessionKey
    );

    // Read entire encrypted file
    const encryptedData = await FileSystem.readAsStringAsync(inputPath, {
      encoding: 'base64',
    });

    const hashState = sodium.crypto_generichash_init(null, 32);
    const decryptedChunks: Uint8Array[] = [];

    // Chunk size + overhead (16 bytes Poly1305 tag)
    const encryptedChunkSize = header.chunkSize + 16;
    const encryptedDataBuffer = decode(encryptedData);
    const encryptedBuffer = new Uint8Array(encryptedDataBuffer);

    let chunkIndex = 0;
    let offset = 0;

    while (offset < encryptedBuffer.length && chunkIndex < header.totalChunks) {
      const chunkLength = Math.min(encryptedChunkSize, encryptedBuffer.length - offset);
      const encryptedChunk = encryptedBuffer.slice(offset, offset + chunkLength);

      const chunkKey = await this.deriveChunkKey(fileKey, chunkIndex);
      const nonce = await this.deriveChunkNonce(fileKey, chunkIndex);

      const plaintext = await sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        encryptedChunk,
        new TextEncoder().encode(`chunk-${chunkIndex}`),
        nonce,
        chunkKey
      );

      sodium.crypto_generichash_update(hashState, plaintext);
      decryptedChunks.push(plaintext);
      
      offset += chunkLength;
      chunkIndex++;
    }

    // Verify final hash
    const computedHash = sodium.crypto_generichash_final(hashState, 32);
    const expectedHashBuffer = decode(header.fileHash);
    const expectedHash = new Uint8Array(expectedHashBuffer);
    if (!sodium.memcmp(computedHash, expectedHash)) {
      throw new Error('File integrity check failed');
    }

    // Combine all decrypted chunks
    const totalLength = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decryptedData = new Uint8Array(totalLength);
    let writeOffset = 0;
    for (const chunk of decryptedChunks) {
      decryptedData.set(chunk, writeOffset);
      writeOffset += chunk.length;
    }

    // Write decrypted data to output file
    const decryptedBase64 = encode(decryptedData.buffer);
    await FileSystem.writeAsStringAsync(outputPath, decryptedBase64, {
      encoding: 'base64',
    });
  }

  private async deriveChunkKey(fileKey: Uint8Array, index: number): Promise<Uint8Array> {
    const info = new TextEncoder().encode(`chunk-key-${index}`);
    return sodium.crypto_generichash(32, info, fileKey);
  }

  private async deriveChunkNonce(fileKey: Uint8Array, index: number): Promise<Uint8Array> {
    const info = new TextEncoder().encode(`chunk-nonce-${index}`);
    return sodium.crypto_generichash(12, info, fileKey); // 12 bytes for XChaCha20
  }
}