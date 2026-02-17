// crypto/X3DH.ts
import { decode, encode } from 'base64-arraybuffer';
import * as sodium from 'react-native-libsodium';
import type { KeyPair, PreKeyBundle } from '../types/protocol';

export class X3DH {
  private identityKeyPair: KeyPair | null = null;
  private signedPreKey: KeyPair | null = null;
  private oneTimePreKeys: KeyPair[] = [];
  private maxOneTimeKeys = 100;

  async generateKeys() {
    this.identityKeyPair = await sodium.crypto_box_keypair();
    this.signedPreKey = await sodium.crypto_box_keypair();
    
    // Generate batch of one-time prekeys
    for (let i = 0; i < this.maxOneTimeKeys; i++) {
      this.oneTimePreKeys.push(await sodium.crypto_box_keypair());
    }

    if (!this.identityKeyPair || !this.signedPreKey) {
      throw new Error('Failed to generate keys');
    }

    // Sign prekey with identity key
    const signature = await sodium.crypto_sign_detached(
      this.signedPreKey.publicKey,
      this.identityKeyPair.privateKey
    );

    return {
      identityKey: encode(this.identityKeyPair.publicKey),
      signedPreKey: encode(this.signedPreKey.publicKey),
      signature: encode(signature),
      oneTimePreKeys: this.oneTimePreKeys.map(k => encode(k.publicKey)),
    };
  }

  async initiateSession(
    recipientBundle: PreKeyBundle
  ): Promise<{ sessionKey: Uint8Array; ephemeralKey: KeyPair }> {
    if (!this.identityKeyPair) {
      throw new Error('Identity key pair not initialized');
    }

    const ephemeralKey = await sodium.crypto_box_keypair();
    
    // DH calculations
    const dh1 = await sodium.crypto_scalarmult(
      this.identityKeyPair.privateKey,
      new Uint8Array(decode(recipientBundle.signedPreKey))
    );
    const dh2 = await sodium.crypto_scalarmult(
      ephemeralKey.privateKey,
      new Uint8Array(decode(recipientBundle.identityKey))
    );
    const dh3 = await sodium.crypto_scalarmult(
      ephemeralKey.privateKey,
      new Uint8Array(decode(recipientBundle.signedPreKey))
    );
    
    let dh4 = new Uint8Array(0);
    if (recipientBundle.oneTimePreKey) {
      dh4 = await sodium.crypto_scalarmult(
        ephemeralKey.privateKey,
        new Uint8Array(decode(recipientBundle.oneTimePreKey))
      );
    }

    // KDF for shared secret
    const combinedDH = new Uint8Array([...dh1, ...dh2, ...dh3, ...dh4]);
    const sharedSecret = await sodium.crypto_generichash(32, combinedDH);

    return { sessionKey: sharedSecret, ephemeralKey };
  }

  async respondSession(
    ephemeralKey: Uint8Array,
    identityKey: Uint8Array,
    usedOneTimeKeyIndex?: number
  ): Promise<Uint8Array> {
    if (!this.identityKeyPair || !this.signedPreKey) {
      throw new Error('Keys not initialized');
    }

    // DH calculations from recipient side
    const dh1 = await sodium.crypto_scalarmult(
      this.signedPreKey.privateKey,
      identityKey
    );
    const dh2 = await sodium.crypto_scalarmult(
      this.identityKeyPair.privateKey,
      ephemeralKey
    );
    const dh3 = await sodium.crypto_scalarmult(
      this.signedPreKey.privateKey,
      ephemeralKey
    );

    let dh4 = new Uint8Array(0);
    if (usedOneTimeKeyIndex !== undefined && this.oneTimePreKeys[usedOneTimeKeyIndex]) {
      dh4 = await sodium.crypto_scalarmult(
        this.oneTimePreKeys[usedOneTimeKeyIndex].privateKey,
        ephemeralKey
      );
      // Remove used one-time key
      this.oneTimePreKeys.splice(usedOneTimeKeyIndex, 1);
    }

    // KDF for shared secret
    const combinedDH = new Uint8Array([...dh1, ...dh2, ...dh3, ...dh4]);
    const sharedSecret = await sodium.crypto_generichash(32, combinedDH);

    return sharedSecret;
  }
}