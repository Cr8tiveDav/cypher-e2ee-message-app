import { EncryptedPayload } from "./crypto";

export interface UserInfo {
  id: string;
  username: string;
  display_name: string;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  payload: EncryptedPayload;
  created_at: string;
  plaintext?: string;
  isDecrypting?: boolean;
}

export interface Conversation {
  user_id: string;
  username: string;
  display_name: string;
  last_message_at: string;
}
