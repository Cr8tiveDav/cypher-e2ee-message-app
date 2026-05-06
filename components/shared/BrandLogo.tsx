import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  className = "",
}) => {
  return (
    <span
      className={`font-bold tracking-tight text-[#0D9488] ${sizeMap[size]} ${className}`}
    >
      Cypher
    </span>
  );
};
