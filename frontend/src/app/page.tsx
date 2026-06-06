"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight, Star, CheckCircle, ChevronRight, Sparkles,
  Building2, Shield, Zap, Heart, Search, Calculator, Smartphone
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { TrustBar } from "@/components/layout/TrustBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { HeroCarousel } from "@/components/features/HeroCarousel";
import { ServiceCard } from "@/components/features/ServiceCard";
import { ExternalImg } from "@/components/ui/ExternalImg";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useCategories, useServices } from "@/hooks/useServices";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { Hall } from "@/types";

const PKG_STYLES: Record<string, { gradient: string; bg: string; border: string; badge: string; emoji: string }> = {
  basic:   { gradient: "from-blue-600 to-blue-800",   bg: "bg-white",          border: "border-blue-100",  badge: "bg-blue-600",   emoji: "💙" },
  premium: { gradient: "from-[#e11d48] to-green-800", bg: "bg-white",          border: "border-[#e11d48]/20", badge: "bg-[#e11d48]",  emoji: "💚" },
  vip:     { gradient: "from-amber-500 to-orange-600",bg: "bg-white",          border: "border-amber-200", badge: "bg-amber-500",  emoji: "👑" },
};

import { CAT_IMAGES } from "@/data/categoryImages";

// Rich gradient pairs for each category card (fallback/styling)
const CAT_GRADIENTS = [
  "from-orange-400 to-rose-500",      // Catering
  "from-amber-400 to-orange-500",     // Tea Stall
  "from-sky-400 to-blue-500",         // Ice Cream
  "from-yellow-400 to-amber-500",     // Popcorn
  "from-rose-500 to-rose-600",    // Sandai Melam
  "from-emerald-400 to-[#e11d48]",    // Stage Decoration
  "from-pink-400 to-rose-500",        // Flower Decoration
  "from-slate-600 to-gray-700",       // Photography
  "from-rose-500 to-rose-700",    // DJ Sound
  "from-fuchsia-400 to-pink-600",     // Dancers
  "from-teal-400 to-cyan-600",        // Chairs & Tables

  "from-blue-400 to-indigo-600",      // Balloon Decoration
  "from-green-400 to-emerald-600",    // Return Gifts
  "from-gray-500 to-slate-700",       // Parking
  "from-pink-500 to-rose-700",        // Makeup Artist
  "from-lime-500 to-[#e11d48]",       // Mehendi
  "from-amber-400 to-yellow-500",     // Event Lighting
];

export default function HomePage() {
  const { categories, loading: catLoading } = useCategories();
  const { services, loading: svcLoading } = useServices();
  const featuredServices = services.slice(0, 6);
  const [featuredHalls, setFeaturedHalls] = useState<Hall[]>([]);
  const [packages, setPackages] = useState<{
    id: string; name: string; package_type: string; description: string;
    total_price: number; features: string[]; is_active: boolean;
  }[]>([]);

  useEffect(() => {
    const hallsRaw = localStorage.getItem("vizha_admin_halls");
    const halls: Hall[] = hallsRaw ? JSON.parse(hallsRaw) : [];
    setFeaturedHalls(halls.slice(0, 3));

    const pkgsRaw = localStorage.getItem("vizha_admin_packages");
    setPackages(pkgsRaw ? JSON.parse(pkgsRaw) : []);
  }, []);

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      <HeroCarousel />
      <TrustBar />
      {/* CATEGORIES */}
      <section className="py-10 sm:py-14 luxury-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
          <ScrollReveal direction="left">
            <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#e11d48] text-xs font-bold uppercase tracking-[0.2em] mb-2">What We Offer</p>
              <h2 className="luxury-heading-accent text-3xl sm:text-4xl font-display font-semibold text-[#9f1239] leading-tight">
                Browse by Category
              </h2>
              <p className="text-gray-500 mt-2 text-base">{categories.length} service types for every aspect of your event</p>
            </div>
            <Link to="/categories"
              className="hidden sm:flex items-center gap-1.5 text-[#e11d48] text-sm font-bold hover:gap-3 transition-all group">
              See all categories
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          </ScrollReveal>
 
          <ScrollReveal direction="bottom" delay={0.1}>
          {catLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
              {Array(Math.max(6, categories.length)).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/services?category=${cat.id}`}
                  className="group flex flex-col items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md ring-2 ring-transparent group-hover:ring-[#e11d48]/25 transition-all">
                    <ExternalImg
                      src={cat.category_image || CAT_IMAGES[i % CAT_IMAGES.length]}
                      alt={cat.category_name}
                      fill
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#e11d48] text-center leading-tight group-hover:text-[#be123c] transition-colors">
                    {cat.category_name}
                  </p>
                </Link>
              ))}
            </div>
          )}
 
          <div className="flex justify-center mt-7 sm:hidden">
            <Link to="/categories"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-rose-600 text-sm font-bold shadow-sm hover:shadow-md transition-all">
              See all {categories.length} categories →
            </Link>
          </div>
          </ScrollReveal>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════
          MARRIAGE HALLS SPOTLIGHT
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 luxury-section-alt">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
          <ScrollReveal direction="left">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-rose-600 text-sm font-bold uppercase tracking-widest mb-2">Top Venues</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Marriage Halls</h2>
              <p className="text-gray-500 mt-2">Check availability, book slots, contact owners directly</p>
            </div>
            <Link to="/halls" className="hidden sm:flex items-center gap-1.5 text-rose-600 text-sm font-bold group hover:gap-3 transition-all">
              View all halls <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          </ScrollReveal>

          <ScrollReveal direction="bottom" delay={0.12}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHalls.map((hall, i) => (
              <motion.div
                key={hall.id}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-rose-100 transition-all"
              >
                <div className="relative h-52 overflow-hidden">
                  <ExternalImg
                    src={hall.image_url || "/hero/slide-1.jpg"}
                    alt={hall.name}
                    fill
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="inline-block bg-white/90 backdrop-blur-sm text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {hall.location}
                      </span>
                    </div>
                  </div>
                  {hall.has_ac && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">❄ AC</div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-base mb-1">{hall.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    📍 {hall.address}
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full font-medium">
                      👥 {hall.capacity} guests
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full font-medium">
                      🅿 {hall.parking_capacity && hall.parking_capacity > 0 ? `${hall.parking_capacity} cars` : (hall.has_parking ? "Available" : "N/A")}
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link to={`/halls/${hall.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl text-xs font-bold hover:from-rose-700 hover:to-rose-800 transition-colors">
                      View & Book <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-8 sm:hidden">
            <Link to="/halls" className="flex items-center gap-1.5 text-rose-600 text-sm font-bold">
              View all halls <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          </ScrollReveal>
        </div>
      </section>


      {/* FEATURED SERVICES */}
      <section className="py-16 sm:py-20 luxury-section-alt">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
          <ScrollReveal direction="right">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-rose-600 text-sm font-bold uppercase tracking-widest mb-2">Top Vendors</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Featured Services</h2>
              <p className="text-gray-500 mt-2">Hand-picked, highly rated vendors across Tamil Nadu</p>
            </div>
            <Link to="/services" className="hidden sm:flex items-center gap-1.5 text-rose-600 text-sm font-bold group hover:gap-3 transition-all">
              View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.1}>
          {svcLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/services"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-rose-600 text-rose-700 rounded-2xl font-bold text-sm hover:bg-rose-600 hover:text-white transition-all">
              Explore All 20+ Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          </ScrollReveal>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════
          EVENT PACKAGES
      ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 luxury-section-alt">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
          <ScrollReveal direction="bottom">
          <div className="text-center mb-12">
            <p className="text-rose-500 text-sm font-bold uppercase tracking-widest mb-2">All-Inclusive</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Event Packages</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Complete arrangements for every budget — nothing left to plan, nothing left to worry.</p>
          </div>
          </ScrollReveal>

          <ScrollReveal direction="bottom" delay={0.12}>
          {packages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold text-gray-600">Curated packages coming soon</p>
              <p className="text-sm mt-1">You can still plan your event with halls and verified services.</p>
              <Link to="/calculator"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-[#e11d48] text-white rounded-2xl font-bold text-sm hover:bg-[#be123c] transition-all">
                Plan Event <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {packages.map((pkg, i) => {
              const style = PKG_STYLES[pkg.package_type] || PKG_STYLES.basic;
              const isPremium = pkg.package_type === "premium";
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className={`relative flex flex-col rounded-3xl overflow-hidden border-2 ${style.border} ${isPremium ? "shadow-2xl shadow-rose-100 -translate-y-2" : "shadow-md"} ${style.bg} transition-all`}
                >
                  {isPremium && (
                    <div className="absolute -top-0 left-0 right-0 flex justify-center">
                      <span className="bg-rose-600 text-white text-xs font-bold px-5 py-1.5 rounded-b-2xl shadow-md">
                        ⭐ Most Popular
                      </span>
                    </div>
                  )}

                  {/* Gradient header */}
                  <div className={`bg-gradient-to-r ${style.gradient} px-6 pt-8 pb-6 ${isPremium ? "mt-6" : "mt-0"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{style.emoji}</span>
                      <span className="text-white font-extrabold text-xl">{pkg.name}</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{pkg.description}</p>
                  </div>

                  {/* Price + features */}
                  <div className="flex-1 px-6 py-5">
                    <ul className="space-y-2.5 mb-6">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-6 pb-6">
                    <Link to={`/packages/${pkg.id}`}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 text-white bg-gradient-to-r ${style.gradient} hover:opacity-90 shadow-lg`}>
                      Book This Package <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
          )}
          </ScrollReveal>
        </div>
      </section>


      {/* HOW IT WORKS — light luxury */}
      <section className="py-16 sm:py-20 luxury-section-alt overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12">
          <ScrollReveal direction="bottom">
          <div className="text-center mb-12">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[#e11d48] text-xs font-bold uppercase tracking-[0.2em] mb-2">Simple Process</motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl font-semibold text-[#9f1239] mb-3">How VizhaOne Works</motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-500">Book your dream event in 3 easy steps</motion.p>
          </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 relative">
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden md:block absolute top-16 left-[calc(16.6%+1px)] right-[calc(16.6%+1px)] h-px bg-gradient-to-r from-transparent via-[#e11d48] to-transparent" 
            />
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="md:hidden absolute left-9 top-16 bottom-16 w-px origin-top bg-gradient-to-b from-[#e11d48] via-rose-300 to-transparent"
            />

            {[
              { n: "1", icon: Search, title: "Browse & Select", desc: "Explore verified halls and vendors. Compare prices, photos, capacity and availability at a glance.", dir: "left" as const, accent: "from-rose-500 to-pink-500" },
              { n: "2", icon: Calculator, title: "Plan & Calculate", desc: "Add halls and services to your planner. VizhaOne keeps the event estimate clear before you confirm.", dir: "bottom" as const, accent: "from-amber-500 to-orange-500" },
              { n: "3", icon: Smartphone, title: "Send Request on WhatsApp", desc: "Send the complete booking request in one tap and continue with the vendor directly on WhatsApp.", dir: "right" as const, accent: "from-emerald-500 to-teal-600" },
            ].map((step, i) => (
              <ScrollReveal key={step.n} direction={step.dir} delay={i * 0.1}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                whileHover={{ y: -8, boxShadow: "0 18px 38px rgba(225,29,72,0.16)" }}
                className="relative bg-white border border-[#e11d48]/10 rounded-3xl p-5 sm:p-7 text-left md:text-center shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden group"
              >
                {/* Background gradient on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-[#fff1f2]/50 to-transparent pointer-events-none"
                />
                <motion.div
                  animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.35 }}
                  className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${step.accent}`}
                />
                
                {/* Content */}
                <div className="relative z-10 flex gap-4 md:block">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                    className="relative inline-block mb-0 md:mb-5 flex-shrink-0"
                  >
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-16 w-16 bg-gradient-to-br from-[#fff1f2] to-pink-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-rose-100"
                    >
                      <step.icon className="h-7 w-7 text-[#e11d48]" strokeWidth={1.8} />
                    </motion.div>
                    <motion.span 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.15, type: "spring" }}
                      className="absolute -top-2 -right-2 h-7 w-7 bg-gradient-to-br from-[#e11d48] to-[#be123c] rounded-full text-xs font-bold text-white flex items-center justify-center shadow-lg"
                    >
                      {step.n}
                    </motion.span>
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-[#9f1239] mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  
                  {/* Animated arrow indicator */}
                  {i < 2 && (
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      className="hidden md:flex absolute right-0 top-1/2 transform translate-x-6 -translate-y-1/2 text-[#e11d48]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>




      {/* CTA — trust card (soft pink, quote style) */}
      <section className="py-14 px-6 sm:px-8">
        <ScrollReveal direction="left">
        <motion.div
          whileHover={{ y: -2 }}
          className="max-w-2xl mx-auto relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#fff1f2] via-rose-50/80 to-white border border-rose-200/70 px-8 sm:px-10 py-11 text-center shadow-[0_8px_40px_rgba(225,29,72,0.08)]"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#e11d48] to-transparent" aria-hidden />
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white shadow-md border border-rose-100 mb-5">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e11d48]/70 mb-3">
            Loved by families
          </p>
          <p className="font-display text-xl sm:text-2xl text-[#9f1239] italic leading-snug mb-2 max-w-lg mx-auto">
            50+ families across Tamil Nadu trust VizhaOne for their celebrations.
          </p>
          <p className="text-gray-400 text-xs mb-8">Verified vendors · Best prices · WhatsApp booking</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/calculator"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#e11d48] text-white rounded-full font-bold text-sm hover:bg-[#be123c] transition-all shadow-lg shadow-rose-200 active:scale-95">
              Start Planning Free <Sparkles className="h-4 w-4" />
            </Link>
            <Link to="/halls"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/90 border-2 border-[#e11d48]/30 text-[#e11d48] rounded-full font-bold text-sm hover:border-[#e11d48] hover:bg-white transition-all active:scale-95">
              Browse Halls <Building2 className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
        </ScrollReveal>
      </section>


      <SiteFooter />

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
