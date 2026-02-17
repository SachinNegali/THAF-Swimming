// crypto/SecureKeyStore.ts
import { decode, encode } from 'base64-arraybuffer';
import * as SecureStore from 'expo-secure-store';
import * as sodium from 'react-native-libsodium';
import type { KeyPair, RatchetState } from '../types/protocol';

export class SecureKeyStore {
  private static DEVICE_KEY_ALIAS = 'com.yourapp.device_key';
  private static IDENTITY_KEY_ALIAS = 'com.yourapp.identity_key';

  // Store identity key in secure storage
  static async storeIdentityKey(keyPair: KeyPair): Promise<void> {
    const serialized = JSON.stringify({
      publicKey: encode(keyPair.publicKey),
      privateKey: encode(keyPair.privateKey),
    });

    await SecureStore.setItemAsync(this.IDENTITY_KEY_ALIAS, serialized, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  // Retrieve identity key
  static async getIdentityKey(requireAuth: boolean = false): Promise<KeyPair | null> {
    const options: SecureStore.SecureStoreOptions = {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };

    if (requireAuth) {
      options.requireAuthentication = true;
      options.authenticationPrompt = 'Access your encryption keys';
    }

    const serialized = await SecureStore.getItemAsync(this.IDENTITY_KEY_ALIAS, options);
    if (!serialized) return null;

    const parsed = JSON.parse(serialized);
    const publicKeyBuffer = decode(parsed.publicKey);
    const privateKeyBuffer = decode(parsed.privateKey);
    return {
      publicKey: new Uint8Array(publicKeyBuffer),
      privateKey: new Uint8Array(privateKeyBuffer),
    };
  }

  // Store ratchet states in encrypted storage
  static async setSessionState(sessionId: string, state: RatchetState): Promise<void> {
    // Encrypt with device key before storing
    const deviceKey = await this.getOrCreateDeviceKey();
    const plaintext = new TextEncoder().encode(JSON.stringify({
      rootKey: encode(state.rootKey),
      chainKey: encode(state.chainKey),
      messageNumber: state.messageNumber,
      sendingChainKey: state.sendingChainKey ? encode(state.sendingChainKey) : null,
      receivingChainKey: state.receivingChainKey ? encode(state.receivingChainKey) : null,
      sendingMessageNumber: state.sendingMessageNumber,
      receivingMessageNumber: state.receivingMessageNumber,
    }));
    const nonce = sodium.randombytes_buf(12);
    
    const encrypted = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      new TextEncoder().encode(sessionId),
      null,
      nonce,
      deviceKey
    );

    await SecureStore.setItemAsync(
      `session_${sessionId}`,
      JSON.stringify({
        ciphertext: encode(encrypted),
        nonce: encode(nonce),
      }),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }
    );
  }

  // Get session state
  static async getSessionState(sessionId: string): Promise<RatchetState | null> {
    const serialized = await SecureStore.getItemAsync(`session_${sessionId}`);
    if (!serialized) return null;

    const { ciphertext, nonce } = JSON.parse(serialized);
    const deviceKey = await this.getOrCreateDeviceKey();

    const ciphertextBuffer = decode(ciphertext);
    const nonceBuffer = decode(nonce);
    const decrypted = await sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      new Uint8Array(ciphertextBuffer),
      new TextEncoder().encode(sessionId),
      new Uint8Array(nonceBuffer),
      deviceKey
    );

    const parsed = JSON.parse(new TextDecoder().decode(decrypted));
    return {
      rootKey: new Uint8Array(decode(parsed.rootKey)),
      chainKey: new Uint8Array(decode(parsed.chainKey)),
      messageNumber: parsed.messageNumber,
      sendingChainKey: parsed.sendingChainKey ? new Uint8Array(decode(parsed.sendingChainKey)) : null,
      receivingChainKey: parsed.receivingChainKey ? new Uint8Array(decode(parsed.receivingChainKey)) : null,
      sendingMessageNumber: parsed.sendingMessageNumber,
      receivingMessageNumber: parsed.receivingMessageNumber,
    };
  }

  // Store item in secure storage
  static async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  // Get item from secure storage
  static async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }

  private static async getOrCreateDeviceKey(): Promise<Uint8Array> {
    let keyString = await SecureStore.getItemAsync(this.DEVICE_KEY_ALIAS);
    
    if (!keyString) {
      const newKey = sodium.randombytes_buf(32);
      await SecureStore.setItemAsync(
        this.DEVICE_KEY_ALIAS,
        encode(newKey.buffer),
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );
      return newKey;
    }
    
    const keyBuffer = decode(keyString);
    return new Uint8Array(keyBuffer);
  }
}