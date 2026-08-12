"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  count?: number;
  variant?: "grid" | "chip";
}

const categoryColors = [
  "from-green-400 to-[#e11d48]",
  "from-amber-400 to-amber-600",
  "from-blue-400 to-blue-600",
  "from-rose-400 to-rose-600",
  "from-rose-400 to-rose-600",
  "from-teal-400 to-teal-600",
  "from-orange-400 to-orange-600",
  "from-indigo-400 to-indigo-600",
];

export function CategoryCard({ category, count, variant = "grid" }: CategoryCardProps) {
  const colorIndex = (category.category_name?.charCodeAt(0) || 0) % categoryColors.length;
  const gradient = categoryColors[colorIndex];

  if (variant === "chip") {
    return (
      <Link to={`/services?category=${category.id}`}>
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm hover:border-green-300 hover:bg-[#fff1f2] transition-all whitespace-nowrap"
        >
          <span className="text-lg">{category.icon}</span>
          <span className="text-sm font-medium text-gray-700">{category.category_name}</span>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/services?category=${category.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#e11d48]/20 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className={cn(
          "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg",
          gradient
        )}>
          {category.icon}
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-800 leading-tight">{category.category_name}</p>
          {count !== undefined && (
            <p className="text-xs text-gray-400 mt-0.5">{count} services</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
