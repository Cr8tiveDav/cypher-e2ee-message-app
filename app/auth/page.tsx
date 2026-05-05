"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { useCrypto } from "@/lib/CryptoContext";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { FormInput } from "@/components/auth/FormInput";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    password: "",
  });

  const router = useRouter();
  const { login } = useCrypto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const result = await authService.login(
          formData.username,
          formData.password
        );
        login(result, result.privateKey);
      } else {
        const result = await authService.register(
          formData.username,
          formData.displayName,
          formData.password
        );
        login(result, result.privateKey);
      }
      router.push("/chat");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-[#0f172a] p-8 rounded-[20px] shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-300">
        <AuthHeader isLogin={isLogin} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-sm mb-6 text-center font-medium">
              {error}
            </div>
          )}

          <FormInput
            id="username"
            label="Username"
            type="text"
            required
            placeholder="your_handle"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <FormInput
                id="displayName"
                label="Display Name"
                type="text"
                required
                placeholder="Full Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
          )}

          <FormInput
            id="password"
            label="Password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#0D9488] text-white text-lg font-medium rounded-xl hover:bg-[#0D9488]/90 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? "Log In" : "Sign Up"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-100 font-bold cursor-pointer hover:underline underline-offset-4"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </article>
  );
}
