"use client";

import { useState, useMemo, Suspense, useTransition, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckSquare, Square,
  ShoppingCart, MessageCircle, ArrowRight, Sparkles, Search, Scale
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LuxuryBanner } from "@/components/layout/LuxuryBanner";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { VendorPromoPoster } from "@/components/app/VendorPromoPoster";
import { useServices, useCategories } from "@/hooks/useServices";
import { DEMO_SERVICES } from "@/data/demo";
import { buildWhatsAppMessage, formatServicePrice, hasVisiblePrice } from "@/lib/utils";
import type { Service } from "@/types";

import { toast } from "sonner";
import { CategoryIcon } from "@/lib/iconMap";
import { ServiceImageCarousel } from "@/components/features/ServiceImageCarousel";
import { getCompareIds, toggleCompare } from "@/lib/compare";

type FoodPreference = "all" | "pure-veg" | "veg-non-veg" | "non-veg";
const FOOD_FILTERS: Array<{ id: FoodPreference; label: string }> = [
  { id: "all", label: "All Food" }, { id: "pure-veg", label: "Pure Veg Only" },
  { id: "veg-non-veg", label: "Veg & Non-Veg" }, { id: "non-veg", label: "Non-Veg Only" },
];
function matchesFoodPreference(service: Service, preference: FoodPreference, categoryName = "") {
  if (preference === "all") return true;
  if (service.food_preference) return service.food_preference === preference;
  const text = [service.title, service.description, categoryName].filter(Boolean).join(" ").toLowerCase().replace(/[–—]/g, "-");
  const nonVeg = /non[\s-]?veg|chicken|mutton|fish|seafood|meat|biryani/.test(text);
  const veg = /pure[\s-]?veg|vegetarian|\bveg\b/.test(text);
  if (preference === "pure-veg") return veg && !nonVeg;
  if (preference === "non-veg") return nonVeg && !/(veg\s*(and|&|\/|\+)\s*non|both veg)/.test(text);
  return veg && nonVeg;
}

function ServicesContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [foodPreference, setFoodPreference] = useState<FoodPreference>("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [budgetFilterActive, setBudgetFilterActive] = useState(false);
  const [priceSort, setPriceSort] = useState<"default" | "low-high" | "high-low">("default");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>(() => typeof window === "undefined" ? [] : getCompareIds());
  const [, startTransition] = useTransition();

  const { services, loading } = useServices();
  const { categories } = useCategories();
  const categoryNames = useMemo(() => new Map(categories.map((category) => [category.id, category.category_name])), [categories]);

  const LOCATIONS = useMemo(() => {
    const locationsSet = new Set<string>();

    try {
      const rawHalls = localStorage.getItem("vizha_admin_halls");
      if (rawHalls) {
        const hallsList = JSON.parse(rawHalls);
        if (Array.isArray(hallsList)) {
          hallsList.forEach((h: any) => {
            if (h.location) {
              const loc = h.location.trim();
              if (loc) {
                const normalized = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
                locationsSet.add(normalized);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Error loading halls locations for services page:", e);
    }

    try {
      const rawServices = localStorage.getItem("vizha_admin_services");
      if (rawServices) {
        const servicesList = JSON.parse(rawServices);
        if (Array.isArray(servicesList)) {
          servicesList.forEach((s: any) => {
            if (s.location) {
              const loc = s.location.trim();
              if (loc) {
                const normalized = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
                locationsSet.add(normalized);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Error loading services locations for services page:", e);
    }

    services.forEach((s: any) => {
      if (s.location) {
        const loc = s.location.trim();
        if (loc) {
          const normalized = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
          locationsSet.add(normalized);
        }
      }
    });

    return ["All Locations", ...Array.from(locationsSet).sort()];
  }, [services]);

  const pickCategory = useCallback((id: string) => {
    startTransition(() => setSelectedCategory(id));
  }, [startTransition]);

  const filtered = useMemo(() => {
    const base = services.length ? services : (DEMO_SERVICES as Service[]);
    const results = base.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          s.title.toLowerCase().includes(q) ||
          (s.location && s.location.toLowerCase().includes(q)) ||
          (s.vendor_name && s.vendor_name.toLowerCase().includes(q)) ||
          (s.place_name && s.place_name.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (selectedCategory && s.category_id !== selectedCategory) return false;
      if (!matchesFoodPreference(s, foodPreference, categoryNames.get(s.category_id || "") || "")) return false;
      if (selectedLocation !== "All Locations" && !s.location?.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      const price = Number(s.price_min ?? s.price ?? 0);
      if (budgetFilterActive && (price <= 0 || price > maxPrice)) return false;
      return true;
    });
    if (priceSort !== "default") {
      results.sort((a, b) => {
        const priceA = Number(a.price_min ?? a.price ?? 0);
        const priceB = Number(b.price_min ?? b.price ?? 0);
        return priceSort === "low-high" ? priceA - priceB : priceB - priceA;
      });
    }
    return results;
  }, [services, searchQuery, selectedCategory, selectedLocation, maxPrice, budgetFilterActive, priceSort, foodPreference, categoryNames]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((s) => s.id)));
  }

  const selectedServices = filtered.filter((s) => selected.has(s.id));

  function handlePlanSelected() {
    // Store selected service IDs in sessionStorage then go to calculator
    sessionStorage.setItem("vizha_selected_services", JSON.stringify([...selected]));
    toast.success(`${selected.size} services added to planner!`);
    navigate("/calculator");
  }

  function handleAddServiceToPlan(service: Service) {
    sessionStorage.setItem("vizha_selected_services", JSON.stringify([service.id]));
    toast.success(`${service.title} added to planner!`);
    navigate("/calculator");
  }

  function handleWhatsAppSelected() {
    const serviceNames = selectedServices.map((s) => `• ${s.title}`).join("\n");
    const msg = encodeURIComponent(
      `Vanakkam! Naan intha services book panna enquiry pannanum:\n\n${serviceNames}\n\nPlease confirm availability. Nandri!`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      <VendorPromoPoster />

      <LuxuryBanner
        image="/hero/slide-2.jpg"
        badge={<><Sparkles className="h-4 w-4 text-amber-300" /> Verified Vendors</>}
        title="Browse All Services"
        subtitle={`${DEMO_SERVICES.length}+ verified vendors across Tamil Nadu for every celebration`}
        compact
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 pb-40">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button onClick={() => pickCategory("")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              !selectedCategory ? "bg-[#e11d48] text-white border-[#e11d48]" : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            }`}>All</button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => pickCategory(selectedCategory === cat.id ? "" : cat.id)}
              className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                selectedCategory === cat.id ? "bg-[#e11d48] text-white border-[#e11d48]" : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              }`}>
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative w-full mb-4 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="h-4 w-4 text-[#e11d48]" />
          </div>
          <input
            type="text"
            placeholder="Search by service name, vendor or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3.5 bg-gradient-to-r from-rose-50/50 to-white border-2 border-rose-100 rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#e11d48] focus:from-white focus:to-white transition-all shadow-sm"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-rose-100 hover:text-[#e11d48] text-gray-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              name / vendor / location
            </span>
          )}
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Food preference</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FOOD_FILTERS.map((option) => <button key={option.id} type="button" onClick={() => setFoodPreference(option.id)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all ${foodPreference === option.id ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-emerald-100 bg-white text-emerald-800 hover:border-emerald-400"}`}>{option.id === "pure-veg" ? "● " : ""}{option.label}</button>)}
          </div>
        </div>

        {/* Price filter and sorting */}
        <div className="mb-5 grid gap-4 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px] sm:items-end">
          <label className="block">
            <span className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-600">
              Maximum price <strong className="text-[#e11d48]">₹{maxPrice.toLocaleString("en-IN")}</strong>
            </span>
            <input type="range" min="0" max="1000000" step="10000" value={maxPrice} onChange={(e) => { setMaxPrice(Number(e.target.value)); setBudgetFilterActive(true); }} className="w-full accent-[#e11d48]" />
            <span className="mt-1 flex justify-between text-[10px] font-bold text-gray-400"><span>₹0</span><span>₹10 Lakhs</span></span>
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-600">Sort by price
            <select value={priceSort} onChange={(e) => setPriceSort(e.target.value as typeof priceSort)} className="mt-2 w-full rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-3 text-sm font-bold normal-case tracking-normal text-gray-700 outline-none focus:border-[#e11d48]">
              <option value="default">Recommended</option><option value="low-high">Price: Low to High</option><option value="high-low">Price: High to Low</option>
            </select>
          </label>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative">
            <input
              type="text"
              list="services-locations"
              value={selectedLocation === "All Locations" ? "" : selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value || "All Locations")}
              placeholder="Enter your location..."
              className="px-4 py-2.5 w-56 bg-white border border-rose-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#e11d48] shadow-sm cursor-text placeholder:font-normal placeholder:text-gray-400"
            />
            <datalist id="services-locations">
              {LOCATIONS.filter(loc => loc !== "All Locations").map((loc) => <option key={loc} value={loc} />)}
            </datalist>
          </div>

          {/* Multi-select toggle */}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
              selectMode ? "bg-[#e11d48] text-white border-[#e11d48]" : "bg-white text-gray-700 border-rose-100 hover:bg-rose-50/40"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            {selectMode ? `Select Mode ON (${selected.size})` : "Select & Book"}
          </button>

          {selectMode && filtered.length > 0 && (
            <button onClick={selectAll}
              className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm font-bold hover:bg-amber-100 transition-colors cursor-pointer">
              Select All ({filtered.length})
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500 font-semibold">{filtered.length} found</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No services found</h3>
            <button onClick={() => { setSearchQuery(""); setSelectedCategory(""); setSelectedLocation("All Locations"); setMaxPrice(1000000); setBudgetFilterActive(false); setPriceSort("default"); }}
              className="mt-4 px-6 py-2.5 bg-[#e11d48] text-white rounded-xl text-sm font-semibold hover:bg-[#be123c] cursor-pointer">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((service) => {
                const isChecked = selected.has(service.id);
                const serviceImages = [service.image_url, ...(service.gallery_urls || [])];
                return (
                  <div
                    key={service.id}
                    className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-shadow duration-200 hover:shadow-lg ${
                      selectMode && isChecked
                        ? "border-[#e11d48] shadow-[#fff1f2]"
                        : "border-transparent hover:border-gray-100"
                    }`}
                  >
                    {/* Checkbox overlay (select mode) */}
                    {selectMode && (
                      <button
                        onClick={() => toggleSelect(service.id)}
                        className="absolute top-3 left-3 z-20 transition-transform active:scale-90"
                      >
                        {isChecked
                          ? <CheckSquare className="h-7 w-7 text-[#e11d48] drop-shadow-md" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }} />
                          : <Square className="h-7 w-7 text-white drop-shadow-md" style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.4))" }} />
                        }
                      </button>
                    )}

                    {/* Selected overlay */}
                    {selectMode && isChecked && (
                      <div className="absolute inset-0 bg-[#e11d48]/8 z-10 pointer-events-none rounded-2xl" />
                    )}

                    {/* Image */}
                    <div
                      className="relative h-44 bg-gradient-to-br from-[#fff1f2] to-emerald-50 cursor-pointer"
                      onClick={() => selectMode ? toggleSelect(service.id) : navigate(`/services/${service.id}`)}
                    >
                      {serviceImages.some(Boolean) ? (
                        <ServiceImageCarousel images={serviceImages} title={service.title} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#e11d48]">
                          {service.categories?.icon ? (
                            <CategoryIcon icon={service.categories.icon} className="h-12 w-12" />
                          ) : (
                            <span className="text-5xl">🎊</span>
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${service.availability_status ? "bg-[#e11d48] text-white" : "bg-red-500 text-white"}`}>
                          {service.availability_status ? "Available" : "Booked"}
                        </span>
                      </div>
                      {service.categories && (
                        <div className="absolute bottom-3 left-3">
                          <span className="text-xs bg-black/50 text-white px-2 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                            {service.categories.icon ? (
                              <CategoryIcon icon={service.categories.icon} className="h-3 w-3 text-white" />
                            ) : (
                              "🎊"
                            )}
                            {service.categories.category_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="block w-full text-left font-bold text-gray-900 text-sm mb-0.5 line-clamp-1 hover:text-[#e11d48] transition-colors"
                      >
                        {service.title}
                      </button>
                      <p className="text-xs text-gray-500 mb-1 line-clamp-1 flex items-center gap-1">
                        {service.vendor_name}{service.location ? ` • ${service.location}` : ""}
                      </p>
                      {service.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{service.description}</p>
                      )}

                      <div className="mb-3 rounded-2xl border border-rose-100 bg-[#fff7f9] px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Price</p>
                        <p className={`text-sm font-extrabold ${
                          hasVisiblePrice(service.price) || hasVisiblePrice(service.price_min) || hasVisiblePrice(service.price_max)
                            ? "text-[#be123c]"
                            : "text-gray-500"
                        }`}>
                          {formatServicePrice(service)}
                        </p>
                        {(hasVisiblePrice(service.price) || hasVisiblePrice(service.price_min) || hasVisiblePrice(service.price_max)) && (
                          <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                            {service.price_unit || "per event"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end mb-3">
                        {!selectMode ? (
                          <button
                            onClick={() => { setSelectMode(true); toggleSelect(service.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#e11d48] text-white rounded-xl text-xs font-bold hover:bg-[#be123c] transition-colors"
                          >
                            <ShoppingCart className="h-3 w-3" /> Select
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleSelect(service.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isChecked
                                ? "bg-[#e11d48] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-[#fff1f2] hover:text-[#be123c]"
                            }`}
                          >
                            {isChecked ? "✓ Selected" : "+ Select"}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={()=>{const r=toggleCompare(service);setCompareIds(r.ids);r.error?toast.error(r.error):toast.success(r.ids.includes(service.id)?'Added to compare':'Removed from compare');}} className={`flex items-center justify-center rounded-xl px-3 ${compareIds.includes(service.id)?'bg-amber-100 text-amber-800':'bg-gray-100 text-gray-700'}`} title="Add to compare"><Scale className="h-4 w-4"/></button>
                        <button
                          onClick={() => handleAddServiceToPlan(service)}
                          disabled={!service.availability_status}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="h-3 w-3" /> Add to Plan
                        </button>
                        {service.vendor_mobile && (
                          <a href={`https://wa.me/91${service.vendor_mobile}?text=${encodeURIComponent(`Vanakkam! "${service.title}" service pathi kekanum. Please confirm availability.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#e11d48] hover:bg-[#e11d48] text-white rounded-xl text-xs font-medium transition-colors">
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </>
        )}
        {compareIds.length > 0 && <button onClick={()=>navigate('/compare')} className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-950 px-6 py-3 font-black text-white shadow-2xl"><Scale className="h-4 w-4"/> Compare Now ({compareIds.length}/3)</button>}
      </div>

      {/* Floating Book Bar — appears when services selected */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 max-w-2xl mx-auto"
          >
            <div className="bg-gray-900 text-white rounded-3xl p-4 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-sm">{selected.size} service{selected.size > 1 ? "s" : ""} selected</p>
                </div>
                <button onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Selected tags */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                {selectedServices.map((s) => (
                  <span key={s.id} className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 text-white text-xs px-2.5 py-1 rounded-full">
                    {s.categories?.icon || "🎊"} {s.title}
                    <button onClick={() => toggleSelect(s.id)} className="text-white/60 hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleWhatsAppSelected}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#25d366,#128c7e)" }}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
                </button>
                <button onClick={handlePlanSelected}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#e11d48,#15803d)" }}>
                  <Sparkles className="h-4 w-4" /> Plan & Calculate <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteFooter />
      <MobileBottomNav />
      <div className="h-24 md:hidden" />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin" />
    </div>}>
      <ServicesContent />
    </Suspense>
  );
}
