"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExternalImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean;
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

/** Native img — reliable with static export; optional gradient fallback on error */
export function ExternalImg({
  fill,
  src,
  alt,
  className,
  priority,
  fallbackClassName,
  onError,
  ...props
}: ExternalImgProps) {
  const [failed, setFailed] = useState(false);
  const loading = priority ? "eager" : "lazy";

  if (failed) {
    return (
      <div
        className={cn(
          fill ? "absolute inset-0" : "w-full h-full min-h-[8rem]",
          "bg-gradient-to-br from-[#e11d48] via-[#db2777] to-[#9f1239]",
          fallbackClassName
        )}
        aria-hidden={alt === ""}
      />
    );
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        loading={loading}
        decoding="async"
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...props}
    />
  );
}
