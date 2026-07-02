"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useCategories, useServices } from "@/hooks/useServices";
import { ArrowRight } from "lucide-react";
import { ExternalImg } from "@/components/ui/ExternalImg";
import { CAT_IMAGES } from "@/data/categoryImages";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();
  const { services } = useServices();

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />

      <section className="luxury-section pt-8 pb-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <p className="text-[#e11d48] text-xs font-bold uppercase tracking-[0.2em] mb-2">What We Offer</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#9f1239] mb-2">All Categories</h1>
            <p className="text-gray-500">Explore all 19 service categories for your event</p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(19).fill(0).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((cat, i) => {
                const count = services.filter((s) => s.category_id === cat.id).length;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      to={`/services?category=${cat.id}`}
                      className="group flex flex-col items-center p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#e11d48]/15 transition-all"
                    >
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-md mb-3 ring-2 ring-transparent group-hover:ring-[#e11d48]/25 transition-all">
                        <ExternalImg
                          src={cat.category_image || CAT_IMAGES[i % CAT_IMAGES.length]}
                          alt={cat.category_name}
                          fill
                          className="group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-[#e11d48] text-center mb-1 group-hover:text-[#be123c] transition-colors">
                        {cat.category_name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-gray-500 text-center line-clamp-2 mb-2">{cat.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-[#e11d48]/80 font-semibold mt-1">
                        {count} {count === 1 ? "service" : "services"} <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
      <div className="h-24 md:hidden" />
    </div>
  );
}
