import React from "react";

interface AuthHeaderProps {
  isLogin: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isLogin }) => {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-3xl font-semibold tracking-tight mb-2 text-white">
        Cypher
      </h2>
      <p className="text-slate-400 text-sm font-medium">
        {isLogin ? "Log in to your secure identity" : "Create your private identity"}
      </p>
    </div>
  );
};
