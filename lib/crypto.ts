/**
 * Utilities for Base64 encoding/decoding and ArrayBuffer conversions.
 */

export function bufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes = buffer instanceof ArrayBuffer 
    ? new Uint8Array(buffer) 
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * PBKDF2 Key Derivation
 * Derives a wrapping key from a password and salt.
 */
export async function deriveWrappingKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Identity Key Pair Generation (RSA-OAEP)
 */
export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

/**
 * Private Key Wrapping (AES-GCM)
 * We prepend the IV to the ciphertext to store it in a single field.
 */
export async function wrapPrivateKey(privateKey: CryptoKey, wrappingKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const exportedKey = await crypto.subtle.exportKey("pkcs8", privateKey);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    exportedKey
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return bufferToBase64(combined.buffer);
}

export async function unwrapPrivateKey(wrappedKeyBase64: string, wrappingKey: CryptoKey): Promise<CryptoKey> {
  const combined = new Uint8Array(base64ToBuffer(wrappedKeyBase64));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedKey = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    ciphertext
  );

  return crypto.subtle.importKey(
    "pkcs8",
    decryptedKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt", "unwrapKey"]
  );
}

/**
 * Public Key Export/Import (SPKI)
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return bufferToBase64(exported);
}

export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  const spki = base64ToBuffer(spkiBase64);
  return crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt", "wrapKey"]
  );
}

/**
 * Hybrid Message Encryption (AES-GCM + RSA-OAEP)
 */
export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const encodedPlaintext = enc.encode(plaintext);

  // 1. Generate random AES-GCM key and IV
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt plaintext with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedPlaintext
  );

  // 3. Wrap AES key with recipient's RSA public key
  const encryptedKey = await crypto.subtle.wrapKey(
    "raw",
    aesKey,
    recipientPublicKey,
    "RSA-OAEP"
  );

  // 4. Wrap AES key with sender's own RSA public key (for history)
  const encryptedKeyForSelf = await crypto.subtle.wrapKey(
    "raw",
    aesKey,
    senderPublicKey,
    "RSA-OAEP"
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    encryptedKey: bufferToBase64(encryptedKey),
    encryptedKeyForSelf: bufferToBase64(encryptedKeyForSelf),
  };
}

/**
 * Message Decryption
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  privateKey: CryptoKey,
  isFromMe: boolean = false
): Promise<string> {
  const ciphertext = base64ToBuffer(payload.ciphertext);
  const iv = base64ToBuffer(payload.iv);
  const encryptedKey = base64ToBuffer(isFromMe ? payload.encryptedKeyForSelf : payload.encryptedKey);

  // 1. Unwrap AES-GCM key with RSA private key
  const aesKey = await crypto.subtle.unwrapKey(
    "raw",
    encryptedKey,
    privateKey,
    "RSA-OAEP",
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );

  // 2. Decrypt ciphertext with AES-GCM
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
