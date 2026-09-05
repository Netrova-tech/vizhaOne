"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Snowflake, Car, Building2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LuxuryBanner } from "@/components/layout/LuxuryBanner";
import { HallCard } from "@/components/features/HallCard";
import { useLang } from "@/context/LanguageContext";
import { useCatalog } from "@/hooks/useCatalog";

export default function HallsPage() {
  const { t, lang } = useLang();
  const { halls: allHalls, loading } = useCatalog();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("All");
  const [onlyAC, setOnlyAC] = useState(false);
  const [onlyParking, setOnlyParking] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [priceSort, setPriceSort] = useState<"default" | "low-high" | "high-low">("default");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const LOCATIONS = useMemo(() => {
    const locationsSet = new Set<string>();

    allHalls.forEach((h: any) => {
      if (h.location) {
        const loc = h.location.trim();
        if (loc) {
          const normalized = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
          locationsSet.add(normalized);
        }
      }
    });

    return ["All", ...Array.from(locationsSet).sort()];
  }, [allHalls]);

  const filtered = useMemo(() => {
    let halls = [...allHalls];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      halls = halls.filter((h) =>
        h.name.toLowerCase().includes(q) ||
        (h.location && h.location.toLowerCase().includes(q)) ||
        (h.address && h.address.toLowerCase().includes(q))
      );
    }
    if (location !== "All") {
      halls = halls.filter((h) =>
        h.location?.toLowerCase().includes(location.toLowerCase()) ||
        h.address?.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (onlyAC) halls = halls.filter((h) => h.has_ac);
    if (onlyParking) halls = halls.filter((h) => h.has_parking);
    halls = halls.filter((h) => Number(h.price_per_day || 0) <= maxPrice);
    if (priceSort !== "default") {
      halls.sort((a, b) => priceSort === "low-high" ? Number(a.price_per_day || 0) - Number(b.price_per_day || 0) : Number(b.price_per_day || 0) - Number(a.price_per_day || 0));
    }
    return halls;
  }, [allHalls, searchQuery, location, onlyAC, onlyParking, maxPrice, priceSort]);

  const hallsPerPage = isMobile ? 5 : 6;
  const totalPages = Math.ceil(filtered.length / hallsPerPage);
  const paginatedHalls = filtered.slice((currentPage - 1) * hallsPerPage, currentPage * hallsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, location, onlyAC, onlyParking, maxPrice, priceSort]);

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />

      <LuxuryBanner
        image="/hero/slide-mahal.jpg"
        badge={<><Building2 className="h-4 w-4 text-amber-300" /> Top Venues</>}
        title={lang === "ta" ? "திருமண மண்டபங்கள்" : "Marriage Halls & Mahals"}
        subtitle={`${allHalls.length}+ premium halls across India — connect directly with owners`}
        compact
      />

      {/* Floating Filter Card */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 -mt-10 relative z-10 mb-8">
        <div className="bg-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(225,29,72,0.06)] border border-rose-100/80 space-y-4">

          {/* Search bar */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <Search className="h-4 w-4 text-[#e11d48]" />
            </div>
            <input
              type="text"
              placeholder={lang === "ta" ? "மண்டபம் அல்லது இடம் தேடுங்கள்..." : "Search by hall name or location..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3.5 bg-gradient-to-r from-rose-50/50 to-white border-2 border-rose-100 rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#e11d48] focus:from-white focus:to-white transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-rose-100 hover:text-[#e11d48] text-gray-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {!searchQuery && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                name / location
              </span>
            )}
          </div>

          <div className="grid gap-4 rounded-2xl border border-rose-100 bg-rose-50/20 p-4 sm:grid-cols-[1fr_220px] sm:items-end">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-600">Maximum price <strong className="text-[#e11d48]">₹{maxPrice.toLocaleString("en-IN")}</strong></span>
              <input type="range" min="0" max="1000000" step="10000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#e11d48]" />
              <span className="mt-1 flex justify-between text-[10px] font-bold text-gray-400"><span>₹0</span><span>₹10 Lakhs</span></span>
            </label>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-600">Sort by price
              <select value={priceSort} onChange={(e) => setPriceSort(e.target.value as typeof priceSort)} className="mt-2 w-full rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm font-bold normal-case tracking-normal text-gray-700 outline-none focus:border-[#e11d48]"><option value="default">Recommended</option><option value="low-high">Price: Low to High</option><option value="high-low">Price: High to Low</option></select>
            </label>
          </div>

          {/* Location input */}
          <div className="relative z-20">
            <p className="text-[10px] font-extrabold text-rose-800 uppercase tracking-widest mb-2.5">Enter Your Location</p>
            <input
              type="text"
              list="halls-locations"
              value={location === "All" ? "" : location}
              onChange={(e) => setLocation(e.target.value || "All")}
              placeholder="e.g. Salem, Madurai..."
              className="w-full px-4 py-3.5 bg-rose-50/30 border border-rose-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#e11d48] shadow-sm placeholder:font-normal placeholder:text-gray-400"
            />
            <datalist id="halls-locations">
              {LOCATIONS.filter(loc => loc !== "All").map((loc) => <option key={loc} value={loc} />)}
            </datalist>
          </div>

          {/* Filters toggle */}
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${showFilters
                  ? "bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white border-transparent shadow-md shadow-[#e11d48]/10"
                  : "bg-white text-gray-700 border-rose-100 hover:border-rose-200 hover:bg-rose-50/40"
                }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Additional Filters
            </button>
          </div>

          {/* Advanced filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-4 border-t border-rose-100/50 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden"
              >
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/20 border border-rose-100/30 cursor-pointer hover:bg-rose-50/50 transition-colors">
                  <input type="checkbox" checked={onlyAC} onChange={(e) => setOnlyAC(e.target.checked)} className="h-4 w-4 accent-[#e11d48]" />
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-gray-700">AC Hall Only</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/20 border border-rose-100/30 cursor-pointer hover:bg-rose-50/50 transition-colors">
                  <input type="checkbox" checked={onlyParking} onChange={(e) => setOnlyParking(e.target.checked)} className="h-4 w-4 accent-[#e11d48]" />
                  <Car className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-700">With Parking</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Halls Grid Area */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-16">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs font-bold text-[#881337] uppercase tracking-wider">{filtered.length} halls found</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-96 rounded-3xl shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No halls found</h3>
            <button onClick={() => { setSearchQuery(""); setLocation("All"); setOnlyAC(false); setOnlyParking(false); setMaxPrice(1000000); setPriceSort("default"); }}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity shadow-lg shadow-[#e11d48]/10 cursor-pointer">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHalls.map((hall) => (
                <HallCard
                  key={hall.id}
                  hall={hall}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-2xl border border-rose-100 bg-white text-sm font-bold text-gray-700 hover:bg-rose-50/40 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm font-bold text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 rounded-2xl border border-rose-100 bg-white text-sm font-bold text-gray-700 hover:bg-rose-50/40 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter />
      <MobileBottomNav />
      <div className="h-24 md:hidden" />
    </div>
  );
}
