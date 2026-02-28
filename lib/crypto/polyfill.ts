/**
 * Crypto polyfill for React Native (Hermes).
 *
 * Hermes doesn't provide `globalThis.crypto` or `crypto.getRandomValues()`,
 * which libsodium-wrappers-sumo requires. This polyfill uses expo-crypto
 * to provide a compliant implementation.
 *
 * MUST be imported before any crypto library (libsodium, etc.).
 */
import * as ExpoCrypto from 'expo-crypto';

if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore – polyfilling the global
  globalThis.crypto = {};
}

if (typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto.getRandomValues = <T extends ArrayBufferView>(array: T): T => {
    const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
    const target = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    target.set(bytes);
    return array;
  };
}
