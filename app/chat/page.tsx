"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function ChatPage() {
  const { user, privateKey, publicKey, accessToken, isAuthenticated, isRestoring, logout } = useCrypto();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isRestoring, router]);

  useEffect(() => {
    let socketCleanup: (() => void) | undefined;
    if (accessToken) {
      loadConversations();
      socketCleanup = setupWebSocket();
    }
    return () => {
      if (socketCleanup) socketCleanup();
    };
  }, [accessToken]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setupWebSocket = () => {
    if (!accessToken) return;

    console.log("🔌 Connecting to WebSocket...");
    const socket = new WebSocket(`${WS_URL}?token=${accessToken}`);

    socket.onopen = () => {
      console.log("✅ WebSocket Connected");
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 WebSocket Message Received:", data);

        if (data.type === "message.receive") {
          const newMessage = data.data as Message;
          if (privateKey) {
            try {
              const plaintext = await decryptMessage(
                newMessage.payload,
                privateKey,
                newMessage.from_user_id === user?.id
              );
              newMessage.plaintext = plaintext;
            } catch (e) {
              console.error("❌ Decryption failed for incoming message", e);
              newMessage.plaintext = "[Decryption Failed]";
            }
          }

          if (selectedUser && (newMessage.from_user_id === selectedUser.id || newMessage.to_user_id === selectedUser.id)) {
            setMessages((prev) => [...prev, newMessage]);
          }
          loadConversations(); // Refresh list
        }
      } catch (err) {
        console.error("❌ Error parsing WS message:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };

    socket.onclose = (event) => {
      console.log(`ℹ️ WebSocket Closed: ${event.reason} (${event.code})`);
    };

    setWs(socket);
    return () => {
      console.log("🔌 Closing WebSocket...");
      socket.close();
    };
  };

  const loadConversations = async () => {
    try {
      const data = await api.get("/conversations", accessToken!);
      setConversations(data);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const data: Message[] = await api.get(`/conversations/${userId}/messages`, accessToken!);
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => {
          if (privateKey) {
            try {
              const plaintext = await decryptMessage(
                msg.payload,
                privateKey,
                msg.from_user_id === user?.id
              );
              return { ...msg, plaintext };
            } catch (e) {
              return { ...msg, plaintext: "[Decryption Failed]" };
            }
          }
          return msg;
        })
      );
      setMessages(decryptedMessages.reverse());
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api.get(`/users/search?q=${q}`, accessToken!);
      setSearchResults(data);
    } catch (e) {
      console.error("Search failed", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || !privateKey || !publicKey) return;

    setSending(true);
    try {
      // 1. Get recipient's public key
      const keyData = await api.get(`/users/${selectedUser.id}/public-key`, accessToken!);
      const recipientPubKey = await importPublicKey(keyData.public_key);

      // 2. Encrypt message
      const payload = await encryptMessage(inputText, recipientPubKey, publicKey);

      // 3. Send via REST (simpler for now than WS frame)
      const newMessage = await api.post("/messages", {
        to: selectedUser.id,
        payload,
      }, accessToken!);

      newMessage.plaintext = inputText;
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      loadConversations();
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated || isRestoring) return null;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden">
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
      />
    </div>
  );
}
