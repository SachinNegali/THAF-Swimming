// crypto/SignalProtocol.ts
import { decode, encode } from 'base64-arraybuffer';
import * as sodium from 'react-native-libsodium';
import type { EncryptedMessage, KeyPair, RatchetState } from '../types/protocol';
import { SecureKeyStore } from './SecureKeyStore';

export class DoubleRatchet {
  private rootKey: Uint8Array;
  private sendingChainKey: Uint8Array | null = null;
  private receivingChainKey: Uint8Array | null = null;
  private sendingMessageNumber = 0;
  private receivingMessageNumber = 0;
  private skippedMessageKeys: Map<number, Uint8Array> = new Map();
  private sessionId: string;
  private dhKeyPair: KeyPair | null = null;

  constructor(rootKey: Uint8Array, sessionId: string) {
    this.rootKey = rootKey;
    this.sessionId = sessionId;
  }

  // Initialize with X3DH shared secret
  static async initializeSender(sharedSecret: Uint8Array, sessionId: string): Promise<DoubleRatchet> {
    const [rootKey, chainKey] = await this.kdfRK(sharedSecret, new Uint8Array(32));
    const ratchet = new DoubleRatchet(rootKey, sessionId);
    ratchet.sendingChainKey = chainKey;
    
    // Generate initial DH key pair
    ratchet.dhKeyPair = await sodium.crypto_box_keypair();
    
    return ratchet;
  }

  static async initializeReceiver(sharedSecret: Uint8Array, sessionId: string): Promise<DoubleRatchet> {
    return new DoubleRatchet(sharedSecret, sessionId);
  }

  // KDF for Root Key
  private static async kdfRK(rootKey: Uint8Array, input: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
    const prk = await sodium.crypto_generichash(64, input, rootKey);
    return [prk.slice(0, 32), prk.slice(32, 64)];
  }

  // KDF for Message Key
  private static async kdfCK(chainKey: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
    const messageKey = await sodium.crypto_generichash(32, new Uint8Array([0x01]), chainKey);
    const newChainKey = await sodium.crypto_generichash(32, new Uint8Array([0x02]), chainKey);
    return [newChainKey, messageKey];
  }

  // Encrypt message
  async encrypt(plaintext: Uint8Array, associatedData: Uint8Array): Promise<EncryptedMessage> {
    if (!this.sendingChainKey) {
      throw new Error('Sending chain not initialized');
    }

    const [newChainKey, messageKey] = await DoubleRatchet.kdfCK(this.sendingChainKey);
    this.sendingChainKey = newChainKey;
    
    const nonce = sodium.randombytes_buf(12);
    const ciphertext = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      associatedData,
      null,
      nonce,
      messageKey
    );

    const msg: EncryptedMessage = {
      version: 1,
      type: 'text',
      payload: {
        ciphertext: encode(ciphertext),
        nonce: encode(nonce),
        ephemeralKey: this.dhKeyPair ? encode(this.dhKeyPair.publicKey) : undefined,
      },
      senderId: '',
      recipientId: '',
      timestamp: Date.now(),
      messageId: '',
      chainStep: this.sendingMessageNumber++,
      ciphertext: encode(ciphertext),
      nonce: encode(nonce),
      messageNumber: this.sendingMessageNumber - 1,
      senderIdentityKey: '',
      ephemeralKey: this.dhKeyPair ? encode(this.dhKeyPair.publicKey) : undefined,
    };

    await this.persistState();
    return msg;
  }

  // Decrypt message
  async decrypt(msg: EncryptedMessage, associatedData: Uint8Array): Promise<Uint8Array> {
    // Check skipped messages first
    const msgNumber = msg.messageNumber ?? msg.chainStep;
    if (this.skippedMessageKeys.has(msgNumber)) {
      const key = this.skippedMessageKeys.get(msgNumber)!;
      this.skippedMessageKeys.delete(msgNumber);
      return this.decryptWithKey(msg, key, associatedData);
    }

    // Perform DH ratchet if new ephemeral key
    if (msg.ephemeralKey || msg.payload.ephemeralKey) {
      await this.dhRatchetStep(msg.ephemeralKey || msg.payload.ephemeralKey!);
    }

    // Skip messages if needed
    while (this.receivingMessageNumber < msgNumber) {
      if (!this.receivingChainKey) {
        throw new Error('Receiving chain not initialized');
      }
      const [newChainKey, skippedKey] = await DoubleRatchet.kdfCK(this.receivingChainKey);
      this.skippedMessageKeys.set(this.receivingMessageNumber, skippedKey);
      this.receivingChainKey = newChainKey;
      this.receivingMessageNumber++;
    }

    if (!this.receivingChainKey) {
      throw new Error('Receiving chain not initialized');
    }

    const [newChainKey, messageKey] = await DoubleRatchet.kdfCK(this.receivingChainKey);
    this.receivingChainKey = newChainKey;
    this.receivingMessageNumber++;

    await this.persistState();
    return this.decryptWithKey(msg, messageKey, associatedData);
  }

  private async decryptWithKey(
    msg: EncryptedMessage, 
    key: Uint8Array, 
    ad: Uint8Array
  ): Promise<Uint8Array> {
    const ciphertext = msg.ciphertext || msg.payload.ciphertext;
    const nonce = msg.nonce || msg.payload.nonce;
    
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      new Uint8Array(decode(ciphertext)),
      ad,
      new Uint8Array(decode(nonce)),
      key
    );
  }

  private async dhRatchetStep(ephemeralKeyBase64: string): Promise<void> {
    const ephemeralKey = new Uint8Array(decode(ephemeralKeyBase64));
    
    // Generate new DH key pair
    const newDHKeyPair = await sodium.crypto_box_keypair();
    
    // Perform DH
    const dhOutput = await sodium.crypto_scalarmult(
      this.dhKeyPair?.privateKey || newDHKeyPair.privateKey,
      ephemeralKey
    );

    // Update root key and chain keys
    const [newRootKey, newReceivingChainKey] = await DoubleRatchet.kdfRK(this.rootKey, dhOutput);
    this.rootKey = newRootKey;
    this.receivingChainKey = newReceivingChainKey;
    this.receivingMessageNumber = 0;

    // Update sending chain
    const dhOutput2 = await sodium.crypto_scalarmult(newDHKeyPair.privateKey, ephemeralKey);
    const [newRootKey2, newSendingChainKey] = await DoubleRatchet.kdfRK(this.rootKey, dhOutput2);
    this.rootKey = newRootKey2;
    this.sendingChainKey = newSendingChainKey;
    this.sendingMessageNumber = 0;

    this.dhKeyPair = newDHKeyPair;
  }

  private async persistState(): Promise<void> {
    const state: RatchetState = {
      rootKey: this.rootKey,
      chainKey: this.rootKey, // This is a placeholder, adjust as needed
      messageNumber: this.sendingMessageNumber,
      sendingChainKey: this.sendingChainKey,
      receivingChainKey: this.receivingChainKey,
      sendingMessageNumber: this.sendingMessageNumber,
      receivingMessageNumber: this.receivingMessageNumber,
    };
    await SecureKeyStore.setSessionState(this.sessionId, state);
  }
}