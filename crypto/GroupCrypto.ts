// crypto/GroupCrypto.ts
import { decode, encode } from 'base64-arraybuffer';
import * as sodium from 'react-native-libsodium';
import type { GroupEncryptedMessage, KeyPair, MemberKeyState } from '../types/protocol';

interface GroupState {
  groupId: string;
  senderKey: Uint8Array;      // Chain key for this user
  senderSigningKey: KeyPair;  // Ed25519 for authenticity
  memberKeys: Map<string, MemberKeyState>;
  keyId: number;
}

export class GroupEncryption {
  private groups: Map<string, GroupState> = new Map();
  private userId: string = '';

  constructor(userId: string) {
    this.userId = userId;
  }

  async createGroup(groupId: string, members: string[]): Promise<void> {
    // Generate sender key
    const senderKey = sodium.randombytes_buf(32);
    const signingKeyPair = await sodium.crypto_sign_keypair();

    const state: GroupState = {
      groupId,
      senderKey,
      senderSigningKey: signingKeyPair,
      memberKeys: new Map(),
      keyId: 0,
    };

    // Encrypt sender key for each member using their 1:1 session
    for (const memberId of members) {
      const encryptedKey = await this.encryptSenderKeyForMember(
        memberId,
        senderKey,
        signingKeyPair.publicKey,
        groupId
      );
      
      // Send encryptedKey to server for member pickup
      await this.sendGroupKeyDistribution(memberId, encryptedKey);
    }

    this.groups.set(groupId, state);
  }

  async encryptGroupMessage(
    groupId: string, 
    plaintext: Uint8Array
  ): Promise<GroupEncryptedMessage> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error('Not in group');

    // Ratchet sender key forward
    const [newSenderKey, messageKey] = await this.kdfGroupCK(group.senderKey);
    group.senderKey = newSenderKey;
    group.keyId++;

    // Encrypt
    const nonce = sodium.randombytes_buf(12);
    const ciphertext = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      new TextEncoder().encode(groupId),
      null,
      nonce,
      messageKey
    );

    // Sign
    const signature = await sodium.crypto_sign_detached(
      ciphertext,
      group.senderSigningKey.privateKey
    );

    return {
      ciphertext: encode(ciphertext),
      nonce: encode(nonce),
      senderId: this.userId,
      signature: encode(signature),
      senderKeyId: group.keyId,
    };
  }

  async decryptGroupMessage(
    groupId: string,
    msg: GroupEncryptedMessage
  ): Promise<Uint8Array> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error('Not in group');

    // Verify sender signature
    const senderState = group.memberKeys.get(msg.senderId);
    if (!senderState) throw new Error('Unknown sender');

    const signatureBuffer = decode(msg.signature);
    const ciphertextBuffer = decode(msg.ciphertext);
    const valid = await sodium.crypto_sign_verify_detached(
      new Uint8Array(signatureBuffer),
      new Uint8Array(ciphertextBuffer),
      senderState.signingKey
    );
    if (!valid) throw new Error('Invalid signature');

    // Derive message key from sender's chain
    const messageKey = await this.deriveMessageKey(senderState, msg.senderKeyId);
    
    const msgCiphertextBuffer = decode(msg.ciphertext);
    const msgNonceBuffer = decode(msg.nonce);
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      new Uint8Array(msgCiphertextBuffer),
      new TextEncoder().encode(groupId),
      new Uint8Array(msgNonceBuffer),
      messageKey
    );
  }

  async addMember(groupId: string, memberId: string, memberState: MemberKeyState): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) throw new Error('Not in group');

    group.memberKeys.set(memberId, memberState);
  }

  private async kdfGroupCK(chainKey: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
    const prk = await sodium.crypto_generichash(64, new Uint8Array([0x01]), chainKey);
    return [prk.slice(0, 32), prk.slice(32, 64)];
  }

  private getCurrentKeyId(groupId: string): number {
    const group = this.groups.get(groupId);
    return group?.keyId || 0;
  }

  private async deriveMessageKey(senderState: MemberKeyState, targetKeyId: number): Promise<Uint8Array> {
    let currentKey = senderState.senderKey;
    
    // Ratchet forward to target key ID
    for (let i = senderState.chainIndex; i < targetKeyId; i++) {
      const [newKey] = await this.kdfGroupCK(currentKey);
      currentKey = newKey;
    }

    // Derive message key
    const [, messageKey] = await this.kdfGroupCK(currentKey);
    
    // Update sender state
    senderState.senderKey = currentKey;
    senderState.chainIndex = targetKeyId;

    return messageKey;
  }

  private async encryptSenderKeyForMember(
    memberId: string,
    senderKey: Uint8Array,
    signingKey: Uint8Array,
    groupId: string
  ): Promise<string> {
    // This would use the 1:1 session with the member
    // For now, we'll return a placeholder
    // In a real implementation, you'd fetch the session and encrypt
    const payload = JSON.stringify({
      senderKey: encode(senderKey),
      signingKey: encode(signingKey),
    });
    
    // Encrypt with member's session key (placeholder)
    const nonce = sodium.randombytes_buf(12);
    const tempKey = sodium.randombytes_buf(32); // This should be the session key
    
    const encrypted = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      new TextEncoder().encode(payload),
      new TextEncoder().encode(groupId),
      null,
      nonce,
      tempKey
    );

    return JSON.stringify({
      ciphertext: encode(encrypted.buffer),
      nonce: encode(nonce.buffer),
    });
  }

  private async sendGroupKeyDistribution(memberId: string, encryptedKey: string): Promise<void> {
    // This would send the encrypted key to the server
    // The server would then forward it to the member
    // For now, this is a placeholder
    console.log(`Sending group key to ${memberId}:`, encryptedKey);
  }
}