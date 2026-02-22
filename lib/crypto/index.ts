/**
 * E2EE Crypto Module — Barrel Export
 *
 * Single entry point for all E2EE functionality.
 *
 * Usage:
 *   import { CryptoService, KeyManager } from '@/lib/crypto';
 */

export { CryptoService } from './CryptoService';
export { DoubleRatchet } from './DoubleRatchet';
export { KeyManager } from './KeyManager';
export { MediaEncryption } from './MediaEncryption';
export { SenderKeyProtocol } from './SenderKeyProtocol';
export { SessionStore } from './SessionStore';
export { X3DHProtocol } from './X3DHProtocol';

// Re-export key types consumers will need
export type {
    DecryptResult,
    EncryptedMediaResult, EncryptResult
} from './CryptoService';

export type {
    X3DHInitialMessage, X3DHResult
} from './X3DHProtocol';

