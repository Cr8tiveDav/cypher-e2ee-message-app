import { api } from "./api";
import {
  generateIdentityKeyPair,
  deriveWrappingKey,
  wrapPrivateKey,
  unwrapPrivateKey,
  exportPublicKey,
  bufferToBase64,
  base64ToBuffer,
} from "./crypto";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  public_key: string;
  wrapped_private_key: string;
  pbkdf2_salt: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export const authService = {
  async register(username: string, displayName: string, password: string): Promise<AuthResponse & { privateKey: CryptoKey }> {
    // Generate Identity Key Pair
    const keyPair = await generateIdentityKeyPair();

    // Generate Salt for PBKDF2
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive Wrapping Key from Password
    const wrappingKey = await deriveWrappingKey(password, salt.buffer);

    // Wrap Private Key
    const wrappedPrivateKey = await wrapPrivateKey(keyPair.privateKey, wrappingKey);

    // Export Public Key
    const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);

    // Register with Backend
    const response = await api.post("/auth/register", {
      username,
      display_name: displayName,
      password,
      public_key: publicKeyBase64,
      wrapped_private_key: wrappedPrivateKey,
      pbkdf2_salt: bufferToBase64(salt.buffer),
    });

    return { ...response, privateKey: keyPair.privateKey };
  },

  async login(username: string, password: string): Promise<AuthResponse & { privateKey: CryptoKey }> {
    const response: AuthResponse = await api.post("/auth/login", {
      username,
      password,
    });

    const { user } = response;

    // Derive the wrapping key and unwrap the private key immediately
    const salt = base64ToBuffer(user.pbkdf2_salt);
    const wrappingKey = await deriveWrappingKey(password, salt);
    const privateKey = await unwrapPrivateKey(user.wrapped_private_key, wrappingKey);

    return { ...response, privateKey };
  },
};
