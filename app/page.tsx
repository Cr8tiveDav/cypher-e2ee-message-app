"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCrypto } from "@/lib/CryptoContext";

export default function LandingPage() {
  const { isAuthenticated, isRestoring } = useCrypto();
  const router = useRouter();

  useEffect(() => {
    if (isRestoring) return;

    if (isAuthenticated) {
      router.push("/chat");
    } else {
      router.push("/auth");
    }
  }, [isAuthenticated, isRestoring, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
          WhisperBox
        </h1>
        <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-primary animate-[loading_1s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}
