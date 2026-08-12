"use client";

export const BRAND_COLOR = "#e11d48";
export const BRAND_VIZHA = "#db2777";
export const BRAND_ONE_DARK = "#881337";

interface VizhaLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  showTagline?: boolean;
  light?: boolean;
  className?: string;
}

const sizes = {
  xs: { title: "text-[1.45rem]", tagline: "text-[0.45rem]", gap: "mt-0.5" },
  sm: { title: "text-[1.75rem]", tagline: "text-[0.5rem]",  gap: "mt-0.5" },
  md: { title: "text-[2.1rem]",  tagline: "text-[0.55rem]", gap: "mt-0.5" },
  lg: { title: "text-[2.65rem]", tagline: "text-[0.6rem]",  gap: "mt-1" },
};

export function VizhaLogo({
  size = "sm",
  showText = true,
  showTagline = true,
  light = false,
  className = "",
}: VizhaLogoProps) {
  const s = sizes[size];
  const oneColor = light ? "#ffffff" : BRAND_ONE_DARK;
  const vizhaColor = light ? "rgba(255,255,255,0.95)" : BRAND_COLOR;
  const taglineColor = light ? "rgba(255,255,255,0.82)" : BRAND_COLOR;

  return (
    <div className={`inline-block select-none leading-none ${className}`}>
      {showText && (
        <>
          <span className={`font-script ${s.title} block whitespace-nowrap`}>
            <span style={{ color: vizhaColor }}>Vizha</span>
            <span style={{ color: oneColor }}>One</span>
          </span>
          {showTagline && (
            <span
              className={`font-display ${s.tagline} block lowercase tracking-[0.26em] font-normal ${s.gap}`}
              style={{ color: taglineColor }}
            >
              events &amp; occasions
            </span>
          )}
        </>
      )}
    </div>
  );
}
