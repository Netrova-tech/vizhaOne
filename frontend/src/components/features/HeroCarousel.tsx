"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { NAVBAR_HEIGHT } from "@/components/layout/Navbar";

const SLIDES = [
  {
    id: "venues",
    image: "/hero/slide-1.jpg",
    label: "Premium Events",
    title: "One Platform for Every Celebration",
    subtitle:
      "Book marriage halls, catering, decoration and 19+ services stress-free. Check availability and send your booking request via WhatsApp.",
    primary: { href: "/halls", label: "Browse Halls", icon: true },
    secondary: { href: "/calculator", label: "Plan Event" },
  },
  {
    id: "mahal",
    image: "/hero/slide-mahal.jpg",
    label: "Marriage Mahal",
    title: "Grand Mandap & Hall Bookings",
    subtitle: "Premium marriage halls across Tamil Nadu — check availability & book directly",
    primary: { href: "/halls", label: "Browse Halls", icon: true },
    secondary: { href: "/calculator", label: "Plan Event" },
  },
  {
    id: "decor",
    image: "/hero/slide-2.jpg",
    label: "Dream Decor",
    title: "Make Your Special Day Unforgettable",
    subtitle: "Flower decoration, lighting, mandap setup — verified vendors at best prices",
    primary: { href: "/services", label: "Browse Decor", icon: false },
    secondary: { href: "/calculator", label: "Plan & Calculate" },
  },
  {
    id: "feast",
    image: "/hero/slide-3.jpg",
    label: "Celebration Feast",
    title: "Catering & Complete Event Packages",
    subtitle: "From traditional feasts to live counters — plan your full event budget easily",
    primary: { href: "/calculator", label: "Start Planning", icon: false },
    secondary: { href: "/halls", label: "Browse Halls" },
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];
  const heroHeight = `calc(100dvh - ${NAVBAR_HEIGHT}px)`;

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden bg-[#9f1239]"
      style={{ height: heroHeight, minHeight: "420px" }}
    >
      <div className="absolute inset-0 z-0">
        {SLIDES.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.id}
            src={s.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={i === 0 ? "high" : "low"}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#9f1239]/60 via-[#be123c]/45 to-[#e11d48]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.35)_100%)]" />
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/20 hidden lg:block" aria-hidden />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/20 hidden lg:block" aria-hidden />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/20 hidden lg:block" aria-hidden />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/20 hidden lg:block" aria-hidden />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-5 sm:px-8 text-center text-white">
        {/* VizhaOne Logo + label badge */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="relative">
            <img
              src="/logo.jpeg"
              alt="VizhaOne"
              className="relative h-36 w-36 sm:h-44 sm:w-44 object-contain select-none"
              style={{ mixBlendMode: "screen", filter: "brightness(1.25) contrast(1.1)" }}
              draggable={false}
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-pulse" />
            <p className="text-rose-100 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em]">
              {slide.label}
            </p>
          </div>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold leading-[1.1] tracking-tight mb-4 drop-shadow-md">
          {slide.title}
        </h1>
        <p className="text-white/92 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
          {slide.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={slide.primary.href}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#e11d48] rounded-full font-bold text-sm hover:bg-rose-50 transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            {slide.primary.icon && <Building2 className="h-4 w-4" />}
            {slide.primary.label}
          </Link>
          <Link
            to={slide.secondary.href}
            className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/80 text-white rounded-full font-bold text-sm hover:bg-white/15 backdrop-blur-sm transition-all active:scale-95"
          >
            {slide.secondary.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mt-10">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === index ? "w-8 h-1.5 bg-white" : "w-4 h-1.5 bg-white/35 hover:bg-white/55"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
