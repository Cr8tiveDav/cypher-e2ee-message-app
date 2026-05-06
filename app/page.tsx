"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCrypto } from "@/lib/CryptoContext";
import { BrandLogo } from "@/components/shared/BrandLogo";

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
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <BrandLogo size="lg" />
        <div className="w-16 h-0.5 bg-[#0D9488]/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#0D9488] animate-[slide_1.2s_ease-in-out_infinite]" style={{ width: "50%" }} />
        </div>
      </div>
    </div>
  );
}
