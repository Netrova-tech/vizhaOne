import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "gold" | "red" | "blue" | "gray" | "rose";
  className?: string;
}

const variants = {
  green: "bg-[#fff1f2] text-green-800 border border-[#e11d48]/20",
  gold: "bg-amber-100 text-amber-800 border border-amber-200",
  red: "bg-red-100 text-red-800 border border-red-200",
  blue: "bg-blue-100 text-blue-800 border border-blue-200",
  gray: "bg-gray-100 text-gray-700 border border-gray-200",
  rose: "bg-rose-100 text-rose-800 border border-rose-200",
};

export function Badge({ children, variant = "green", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
