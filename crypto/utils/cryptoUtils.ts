// crypto/utils/cryptoUtils.ts
// Crypto utility wrapper using tweetnacl and expo-crypto
// This provides a consistent API similar to libsodium for our crypto modules

import * as Crypto from 'expo-crypto';
import 'react-native-get-random-values'; // Must be imported first
import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

// Random bytes generation
export function randombytes_buf(length: number): Uint8Array {
  return nacl.randomBytes(length);
}

// Key pair generation for box (X25519)
export async function crypto_box_keypair(): Promise<KeyPair> {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey,
  };
}

// Key pair generation for signing (Ed25519)
export async function crypto_sign_keypair(): Promise<KeyPair> {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey,
  };
}

// Scalar multiplication (DH)
export async function crypto_scalarmult(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
  return nacl.scalarMult(privateKey, publicKey);
}

// Signing
export async function crypto_sign_detached(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  return nacl.sign.detached(message, privateKey);
}

// Signature verification
export async function crypto_sign_verify_detached(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

// AEAD encryption (using XSalsa20-Poly1305 instead of XChaCha20-Poly1305)
export async function crypto_aead_xchacha20poly1305_ietf_encrypt(
  plaintext: Uint8Array,
  associatedData: Uint8Array | null,
  _secretNonce: null,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> {
  // Note: tweetnacl doesn't support associated data in the same way
  // We'll use secretbox which is XSalsa20-Poly1305
  // For production, consider using a library that supports XChaCha20-Poly1305
  return nacl.secretbox(plaintext, nonce.slice(0, 24), key);
}

// AEAD decryption
export async function crypto_aead_xchacha20poly1305_ietf_decrypt(
  _secretNonce: null,
  ciphertext: Uint8Array,
  associatedData: Uint8Array | null,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> {
  const decrypted = nacl.secretbox.open(ciphertext, nonce.slice(0, 24), key);
  if (!decrypted) {
    throw new Error('Decryption failed');
  }
  return decrypted;
}

// Generic hash using expo-crypto (SHA-256 or SHA-512)
export async function crypto_generichash(
  outputLength: number,
  input: Uint8Array,
  key?: Uint8Array
): Promise<Uint8Array> {
  // Use SHA-256 for 32 bytes, SHA-512 for 64 bytes
  const algorithm = outputLength === 32 ? Crypto.CryptoDigestAlgorithm.SHA256 : Crypto.CryptoDigestAlgorithm.SHA512;
  
  // Convert Uint8Array to base64 for expo-crypto
  const base64Input = encodeBase64(input);
  const hashHex = await Crypto.digestStringAsync(algorithm, base64Input, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  
  // Convert hex to Uint8Array
  const hashArray = decodeBase64(hashHex);
  return hashArray.slice(0, outputLength);
}

// Hash state for streaming (simplified implementation)
export interface HashState {
  chunks: Uint8Array[];
  outputLength: number;
}

export function crypto_generichash_init(_key: null, outputLength: number): HashState {
  return {
    chunks: [],
    outputLength,
  };
}

export function crypto_generichash_update(state: HashState, chunk: Uint8Array): void {
  state.chunks.push(chunk);
}

export async function crypto_generichash_final(state: HashState, outputLength: number): Promise<Uint8Array> {
  // Combine all chunks
  const totalLength = state.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of state.chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Hash the combined data
  return crypto_generichash(outputLength, combined);
}

// Memory comparison (constant time)
export function memcmp(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// Export utility functions
export { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 };

