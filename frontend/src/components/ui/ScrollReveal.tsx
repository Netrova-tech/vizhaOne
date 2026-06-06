"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollDirection = "left" | "right" | "bottom";

const OFFSET: Record<ScrollDirection, { x: number; y: number }> = {
  left: { x: -56, y: 0 },
  right: { x: 56, y: 0 },
  bottom: { x: 0, y: 48 },
};

interface ScrollRevealProps {
  children: ReactNode;
  direction?: ScrollDirection;
  delay?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = "bottom",
  delay = 0,
  className,
}: ScrollRevealProps) {
  const offset = OFFSET[direction];

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
