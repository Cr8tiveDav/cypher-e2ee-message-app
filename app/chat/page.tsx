"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCrypto } from "@/lib/CryptoContext";
import { api } from "@/lib/api";
import {
  encryptMessage,
  decryptMessage,
  importPublicKey,
} from "@/lib/crypto";
import { WS_URL } from "@/lib/constants";
import { Message, Conversation, UserInfo } from "@/lib/types";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { refreshAccessToken } from "@/utils/tokenManager";

export default function ChatPage() {
  const {
    user,
    privateKey,
    publicKey,
    accessToken,
    isAuthenticated,
    isRestoring,
    logout,
  } = useCrypto();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // liveToken: local copy of the access token so we can refresh it without
  // touching CryptoContext. Initialized from context once session restores.
  const [liveToken, setLiveToken] = useState<string | null>(null);

  // Refs — always current without stale-closure issues in async callbacks
  const selectedUserRef = useRef<UserInfo | null>(null);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const userRef = useRef<any>(null);
  const liveTokenRef = useRef<string | null>(null);

  // Message cache: userId -> decrypted messages
  const messageCache = useRef<Record<string, Message[]>>({});
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Keep refs current on every render
  selectedUserRef.current = selectedUser;
  privateKeyRef.current = privateKey;
  userRef.current = user;
  liveTokenRef.current = liveToken;

  // Sync liveToken when the context token arrives (first load / login)
  useEffect(() => {
    if (accessToken && !liveToken) {
      setLiveToken(accessToken);
    }
  }, [accessToken]);

  // Redirect if session is gone (only checked after restoration)
  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isRestoring, router]);

  // Load data + open WebSocket only when we have a valid live token
  useEffect(() => {
    if (!isAuthenticated || !liveToken) return;

    loadConversations();
    const cleanup = setupWebSocket();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, liveToken]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedUser) return;
    if (messageCache.current[selectedUser.id]) {
      setMessages(messageCache.current[selectedUser.id]);
    } else {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Wraps any API call. On 401, attempts a token refresh and retries once.
   * If refresh fails it calls logout so the user can re-authenticate.
   */
  const callWithRefresh = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T | null> => {
      const token = liveTokenRef.current;
      if (!token) return null;
      try {
        return await fn(token);
      } catch (err: any) {
        if (err?.status !== 401) return null;

        // Token expired — attempt refresh
        const newToken = await refreshAccessToken();
        if (!newToken) {
          logout();
          return null;
        }
        setLiveToken(newToken);
        liveTokenRef.current = newToken;

        try {
          return await fn(newToken);
        } catch {
          return null;
        }
      }
    },
    [logout]
  );

  const setupWebSocket = () => {
    const token = liveTokenRef.current;
    if (!token) return;

    const socket = new WebSocket(`${WS_URL}?token=${token}`);

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message.receive") {
          const newMessage = data.data as Message;

          const pk = privateKeyRef.current;
          const currentUser = userRef.current;
          if (pk) {
            try {
              const plaintext = await decryptMessage(
                newMessage.payload,
                pk,
                newMessage.from_user_id === currentUser?.id
              );
              newMessage.plaintext = plaintext;
            } catch {
              newMessage.plaintext = "[Decryption Failed]";
            }
          }

          const peerId =
            newMessage.from_user_id === currentUser?.id
              ? newMessage.to_user_id
              : newMessage.from_user_id;

          // Update cache for that peer
          if (messageCache.current[peerId]) {
            messageCache.current[peerId] = [
              ...messageCache.current[peerId],
              newMessage,
            ];
          }

          // Append to current view — reads ref, not stale closure
          const active = selectedUserRef.current;
          if (
            active &&
            (newMessage.from_user_id === active.id ||
              newMessage.to_user_id === active.id)
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }

          // Refresh conversation list
          const tok = liveTokenRef.current;
          if (tok) {
            api.get("/conversations", tok).then(setConversations).catch(() => {});
          }
        }
      } catch {
        // silently ignore parse errors
      }
    };

    socket.onerror = () => {};

    // Reconnect automatically on unexpected close (not on intentional cleanup)
    let intentionalClose = false;
    socket.onclose = () => {
      if (intentionalClose) return;
      // Reconnect after 3 s with the latest live token
      setTimeout(() => {
        const newSocket = setupWebSocket();
        // capture the cleanup so the outer return still works
        void newSocket;
      }, 3000);
    };

    return () => {
      intentionalClose = true;
      socket.close();
    };
  };

  const loadConversations = async () => {
    await callWithRefresh(async (tok) => {
      const data = await api.get("/conversations", tok);
      setConversations(data);
    });
  };

  const loadMessages = async (userId: string) => {
    await callWithRefresh(async (tok) => {
      const data: Message[] = await api.get(
        `/conversations/${userId}/messages`,
        tok
      );
      const pk = privateKeyRef.current;
      const currentUser = userRef.current;
      const decrypted = await Promise.all(
        data.map(async (msg) => {
          if (pk) {
            try {
              const plaintext = await decryptMessage(
                msg.payload,
                pk,
                msg.from_user_id === currentUser?.id
              );
              return { ...msg, plaintext };
            } catch {
              return { ...msg, plaintext: "[Decryption Failed]" };
            }
          }
          return msg;
        })
      );
      const sorted = decrypted.reverse();
      messageCache.current[userId] = sorted;
      setMessages(sorted);
    });
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    await callWithRefresh(async (tok) => {
      const data = await api.get(`/users/search?q=${q}`, tok);
      setSearchResults(data);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || !privateKey || !publicKey) return;

    setSending(true);
    await callWithRefresh(async (tok) => {
      const keyData = await api.get(
        `/users/${selectedUser.id}/public-key`,
        tok
      );
      const recipientPubKey = await importPublicKey(keyData.public_key);
      const payload = await encryptMessage(inputText, recipientPubKey, publicKey);

      const newMessage = await api.post(
        "/messages",
        { to: selectedUser.id, payload },
        tok
      );
      newMessage.plaintext = inputText;

      if (messageCache.current[selectedUser.id]) {
        messageCache.current[selectedUser.id] = [
          ...messageCache.current[selectedUser.id],
          newMessage,
        ];
      }
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      loadConversations();
    });
    setSending(false);
  };

  if (!isAuthenticated || isRestoring) return null;

  return (
    <div className="flex h-dvh bg-[#020617] text-slate-100 font-sans overflow-hidden relative">
      <Sidebar
        user={user}
        conversations={conversations}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        handleSearch={handleSearch}
        logout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ChatWindow
        selectedUser={selectedUser}
        messages={messages}
        user={user}
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        sending={sending}
        messageEndRef={messageEndRef}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}
