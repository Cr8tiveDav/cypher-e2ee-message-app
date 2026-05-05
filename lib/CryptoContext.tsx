"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AuthResponse } from "./auth";
import { STORAGE_KEYS } from "./constants";
import { importPublicKey } from "./crypto";

import { savePrivateKey, getPrivateKey, clearKeys } from "./db";

interface CryptoContextType {
  user: UserProfile | null;
  accessToken: string | null;
  privateKey: CryptoKey | null;
  publicKey: CryptoKey | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (auth: AuthResponse, privateKey: CryptoKey) => void;
  logout: () => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAccessToken(storedToken);
          
          // Attempt to restore private key from IndexedDB
          const pk = await getPrivateKey(parsedUser.id);
          if (pk) setPrivateKey(pk);
        } catch (e) {
          console.error("Failed to restore session", e);
        }
      }
      setIsRestoring(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (user?.public_key) {
      importPublicKey(user.public_key).then(setPublicKey);
    }
  }, [user]);

  const login = (auth: AuthResponse, pk: CryptoKey) => {
    setUser(auth.user);
    setAccessToken(auth.access_token);
    setPrivateKey(pk);
    
    // Persist session
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(auth.user));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, auth.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, auth.refresh_token);
    
    // Persist private key in IndexedDB
    savePrivateKey(auth.user.id, pk);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setPrivateKey(null);
    setPublicKey(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    clearKeys();
  };

  return (
    <CryptoContext.Provider
      value={{
        user,
        accessToken,
        privateKey,
        publicKey,
        isAuthenticated: !!user && !!privateKey,
        isRestoring,
        login,
        logout,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}
