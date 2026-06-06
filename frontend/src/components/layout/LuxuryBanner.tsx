import type { ReactNode } from "react";

interface LuxuryBannerProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  image?: string;
  compact?: boolean;
}

export function LuxuryBanner({
  title,
  subtitle,
  badge,
  image = "/hero/slide-mahal.jpg",
  compact = false,
}: LuxuryBannerProps) {
  return (
    <section className={`relative overflow-hidden ${compact ? "py-14" : "py-16 sm:py-20"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#9f1239]/88 via-[#be123c]/78 to-[#e11d48]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.25)_100%)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center text-white">
        {badge && (
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 rounded-full text-sm mb-5">
            {badge}
          </div>
        )}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-semibold leading-tight mb-4 drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
