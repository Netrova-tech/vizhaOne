"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary: "bg-[#e11d48] hover:bg-[#be123c] text-white shadow-lg shadow-rose-200/80 active:scale-95",
  secondary: "bg-white text-[#e11d48] border-2 border-[#e11d48] hover:bg-[#fff1f2] active:scale-95",
  ghost: "bg-transparent text-[#e11d48] hover:bg-[#fff1f2] active:scale-95",
  gold: "bg-[#e11d48] hover:bg-[#be123c] text-white shadow-lg shadow-rose-200/80 active:scale-95",
  outline: "bg-transparent border border-rose-200 text-gray-700 hover:bg-rose-50 active:scale-95",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 active:scale-95",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-full",
  md: "px-5 py-2.5 text-sm rounded-full",
  lg: "px-6 py-3 text-base rounded-full",
  xl: "px-8 py-4 text-lg rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
