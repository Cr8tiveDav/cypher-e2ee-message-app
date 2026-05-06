import React from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface AuthHeaderProps {
  isLogin: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isLogin }) => {
  return (
    <div className="mb-8 text-center">
      <BrandLogo size="md" className="block mb-2" />
      <p className="text-slate-400 text-sm font-medium">
        {isLogin ? "Log in to your secure identity" : "Create your private identity"}
      </p>
    </div>
  );
};
