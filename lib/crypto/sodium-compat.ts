/**
 * sodium-compat — libsodium-compatible API backed by @noble libraries
 *
 * Replaces libsodium-wrappers-sumo (WASM, broken in React Native / Hermes)
 * with pure-TypeScript @noble implementations that work everywhere.
 *
 * Only exposes the subset of the libsodium API used by this codebase.
 */

// @noble/curves v2: ed25519 and x25519 are both in the ed25519 module
import { ed25519, x25519 } from '@noble/curves/ed25519';
// @noble/hashes v2: blake2b lives in blake2.js
import { blake2b } from '@noble/hashes/blake2.js';
// @noble/ciphers v2: xchacha20poly1305 lives in chacha.js
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

// ─── Random bytes ─────────────────────────────────────────────────────────────

function randombytes_buf(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  // crypto.getRandomValues is available in React Native 0.73+ (Hermes) and Expo
  crypto.getRandomValues(buf);
  return buf;
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

const _encoder = new TextEncoder();
const _decoder = new TextDecoder();

function to_base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function from_base64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function from_string(str: string): Uint8Array {
  return _encoder.encode(str);
}

function to_string(bytes: Uint8Array): string {
  return _decoder.decode(bytes);
}

// ─── Key generation ───────────────────────────────────────────────────────────

function crypto_sign_keypair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  // @noble/curves v2: randomSecretKey() returns a 32-byte seed
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

function crypto_kx_keypair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

// ─── Ed25519 signing ─────────────────────────────────────────────────────────

function crypto_sign_detached(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  // Handle both 32-byte seed (our format) and libsodium 64-byte (seed||pub)
  const seed = privateKey.length === 64 ? privateKey.slice(0, 32) : privateKey;
  return ed25519.sign(message, seed);
}

function crypto_sign_verify_detached(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

// ─── Ed25519 → Curve25519 conversion ─────────────────────────────────────────
// Used in X3DH: identity key is Ed25519 but DH uses Curve25519 (X25519).

function crypto_sign_ed25519_pk_to_curve25519(ed25519Pub: Uint8Array): Uint8Array {
  // @noble/curves v2: ed25519.utils.toMontgomery converts Ed25519 pub → X25519
  return ed25519.utils.toMontgomery(ed25519Pub);
}

function crypto_sign_ed25519_sk_to_curve25519(ed25519Priv: Uint8Array): Uint8Array {
  // Handle libsodium 64-byte format (seed||pub) — extract seed
  const seed = ed25519Priv.length === 64 ? ed25519Priv.slice(0, 32) : ed25519Priv;
  // @noble/curves v2: toMontgomerySecret converts Ed25519 seed → X25519 scalar
  return ed25519.utils.toMontgomerySecret(seed);
}

// ─── X25519 Diffie-Hellman ────────────────────────────────────────────────────

function crypto_scalarmult(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.getSharedSecret(privateKey, publicKey);
}

// ─── BLAKE2b (generic hash) ───────────────────────────────────────────────────

function crypto_generichash(
  outLen: number,
  input: Uint8Array,
  key: Uint8Array | null
): Uint8Array {
  const opts: { dkLen: number; key?: Uint8Array } = { dkLen: outLen };
  if (key && key.length > 0) opts.key = key;
  return blake2b(input, opts);
}

// ─── XChaCha20-Poly1305 ───────────────────────────────────────────────────────
// libsodium appends the 16-byte Poly1305 tag at the END of ciphertext.
// @noble xchacha20poly1305.encrypt() does the same — byte-for-byte compatible.

function crypto_aead_xchacha20poly1305_ietf_encrypt(
  message: Uint8Array,
  additionalData: Uint8Array | null,
  _nsec: null,
  nonce: Uint8Array,
  key: Uint8Array
): Uint8Array {
  const aead = xchacha20poly1305(key, nonce, additionalData ?? undefined);
  return aead.encrypt(message); // ciphertext + 16-byte tag
}

function crypto_aead_xchacha20poly1305_ietf_decrypt(
  ciphertextWithTag: Uint8Array,
  additionalData: Uint8Array | null,
  _nsec: null,
  nonce: Uint8Array,
  key: Uint8Array
): Uint8Array {
  const aead = xchacha20poly1305(key, nonce, additionalData ?? undefined);
  return aead.decrypt(ciphertextWithTag); // verifies tag, returns plaintext
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const SodiumCompat = {
  randombytes_buf,
  to_base64,
  from_base64,
  from_string,
  to_string,
  crypto_sign_keypair,
  crypto_kx_keypair,
  crypto_sign_detached,
  crypto_sign_verify_detached,
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_sign_ed25519_sk_to_curve25519,
  crypto_scalarmult,
  crypto_generichash,
  crypto_aead_xchacha20poly1305_ietf_encrypt,
  crypto_aead_xchacha20poly1305_ietf_decrypt,
};

export type SodiumCompatType = typeof SodiumCompat;
