"use client";

import { useState, useMemo, useCallback, useTransition, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Plus, Minus, Trash2, MessageCircle,
  ShoppingCart, X, CheckCircle, ArrowRight, Sparkles, ArrowLeft
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { LuxuryBanner } from "@/components/layout/LuxuryBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ExternalImg } from "@/components/ui/ExternalImg";
import { ServiceCard } from "@/components/features/ServiceCard";
import { useServices, useCategories } from "@/hooks/useServices";
import { calculateGST, buildWhatsAppMessage } from "@/lib/utils";
import type { Service, CartItem, Category, Hall } from "@/types";
import { DEMO_CATEGORIES } from "@/data/demo";
import { toast } from "sonner";
import { createInquiry, createBookingWithSync } from "@/lib/api";
import { ADMIN_CONFIG } from "@/config/admin";

const ORDER_WHATSAPP_NUMBER = ADMIN_CONFIG.whatsappNumber;

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { services } = useServices();
  const { categories } = useCategories();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventSlot, setEventSlot] = useState("fullday");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [hallStartDate, setHallStartDate] = useState("");
  const [hallEndDate, setHallEndDate] = useState("");
  const [, startTransition] = useTransition();

  const locations = useMemo(() => {
    return Array.from(new Set(services.map((s) => s.location).filter(Boolean)));
  }, [services]);

  useEffect(() => {
    const savedDate = sessionStorage.getItem("vizha_selected_hall_date");
    const savedEndDate = sessionStorage.getItem("vizha_selected_hall_endDate");
    const savedSlot = sessionStorage.getItem("vizha_selected_hall_slot");
    if (savedDate) {
      setHallStartDate(savedDate);
      setEventDate(savedDate);
    }
    if (savedEndDate) {
      setHallEndDate(savedEndDate);
      setEventEndDate(savedEndDate);
    } else if (savedDate) {
      setHallEndDate(savedDate);
      setEventEndDate(savedDate);
    }
    if (savedSlot) {
      setEventSlot(savedSlot);
    }
  }, []);

  const hallToService = useCallback((hall: Hall): Service => ({
    id: `hall:${hall.id}`,
    title: hall.name,
    description: hall.description,
    price: hall.price_per_day || hall.price_morning || hall.price_evening || 0,
    image_url: hall.image_url,
    vendor_name: hall.owner_name,
    vendor_mobile: hall.owner_mobile,
    location: hall.location,
    place_name: hall.place_name,
    availability_status: hall.is_active,
    categories: {
      id: "hall",
      category_name: "Hall",
      icon: "Building2",
    },
  }), []);

  const addToCart = useCallback((service: Service) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.service.id === service.id);
      if (existing) {
        toast.info("Service already in planner!");
        return prev;
      }
      toast.success(`${service.title} added to planner`);
      return [...prev, { service, quantity: 1, selected: true }];
    });
  }, []);

  useEffect(() => {
    const queuedItems: Service[] = [];

    try {
      const rawServiceIds = sessionStorage.getItem("vizha_selected_services");
      const serviceIds = rawServiceIds ? JSON.parse(rawServiceIds) as string[] : [];
      const selectedServices = services.filter((service) => serviceIds.includes(service.id));
      queuedItems.push(...selectedServices);
    } catch {
      sessionStorage.removeItem("vizha_selected_services");
    }

    try {
      const rawHall = sessionStorage.getItem("vizha_selected_hall");
      if (rawHall) {
        queuedItems.push(hallToService(JSON.parse(rawHall) as Hall));
      }
    } catch {
      sessionStorage.removeItem("vizha_selected_hall");
    }

    if (queuedItems.length === 0) return;

    setCart((prev) => {
      const existingIds = new Set(prev.map((item) => item.service.id));
      const freshItems = queuedItems.filter((service) => !existingIds.has(service.id));
      if (freshItems.length === 0) return prev;
      return [
        ...prev,
        ...freshItems.map((service) => ({ service, quantity: 1, selected: true })),
      ];
    });
  }, [hallToService, services]);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const item = prev.find((c) => c.service.id === id);
      if (item) toast.success(`${item.service.title} removed from planner`);
      if (id.startsWith("hall:")) {
        sessionStorage.removeItem("vizha_selected_hall");
        sessionStorage.removeItem("vizha_selected_hall_date");
        sessionStorage.removeItem("vizha_selected_hall_endDate");
        sessionStorage.removeItem("vizha_selected_hall_slot");
        setHallStartDate("");
        setHallEndDate("");
        setEventDate("");
        setEventEndDate("");
      }
      return prev.filter((c) => c.service.id !== id);
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.service.id === id
          ? { ...c, quantity: Math.max(1, c.quantity + delta) }
          : c
      )
    );
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.service.id === id ? { ...c, selected: !c.selected } : c
      )
    );
  }, []);

  const selectedItems = useMemo(() => cart.filter((c) => c.selected), [cart]);
  const subtotal = useMemo(() =>
    selectedItems.reduce((sum, c) => sum + c.service.price * c.quantity, 0),
    [selectedItems]
  );
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  const cartIds = useMemo(() => new Set(cart.map((c) => c.service.id)), [cart]);

  const filterCategories = useMemo(() => {
    return categories.length > 0 ? categories : (DEMO_CATEGORIES as Category[]);
  }, [categories]);

  const categoryCards = useMemo(() => {
    return filterCategories
      .map((category) => ({
        ...category,
        count: services.filter((service) => {
          const sameCategory = service.category_id === category.id;
          const sameLocation = !selectedLocation || service.location === selectedLocation;
          return sameCategory && sameLocation;
        }).length,
      }))
      .filter((category) => category.count > 0 || selectedCategory === category.id);
  }, [filterCategories, services, selectedLocation, selectedCategory]);

  const activeCategory = useMemo(
    () => categoryCards.find((category) => category.id === selectedCategory) || null,
    [categoryCards, selectedCategory]
  );

  const categoryServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter((service) => {
      const sameCategory = service.category_id === selectedCategory;
      const sameLocation = !selectedLocation || service.location === selectedLocation;
      return sameCategory && sameLocation;
    });
  }, [services, selectedCategory, selectedLocation]);

  const pickCategory = useCallback((id: string) => {
    startTransition(() => setSelectedCategory(id));
  }, [startTransition]);

  async function handleSendWhatsApp() {
    if (!customerName.trim()) {
      toast.error("Please fill in Customer Name");
      return;
    }
    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!eventLocation.trim()) {
      toast.error("Please fill in Location");
      return;
    }
    if (!eventType) {
      toast.error("Please select an Event Type");
      return;
    }
    if (!eventSlot) {
      toast.error("Please select an Event Slot");
      return;
    }

    const selectedHallItem = selectedItems.find((c) => c.service.id.startsWith("hall:"));
    const selectedHallId = selectedHallItem ? selectedHallItem.service.id.replace("hall:", "") : undefined;
    const selectedHallName = selectedHallItem ? selectedHallItem.service.title : undefined;

    const items = selectedItems.map((c) => ({
      title: c.service.title,
      price: c.service.price,
      quantity: c.quantity,
    }));
    const message = buildWhatsAppMessage(items, subtotal, gst, {
      customerName: customerName,
      customerPhone: customerMobile,
      eventDate: eventDate,
      eventEndDate: eventEndDate,
      eventLocation: eventLocation,
      eventType: eventType,
      hallName: selectedHallName,
      slot: eventSlot,
    });

    try {
      // Create inquiry (CRM)
      await createInquiry({
        customerName: customerName,
        customerPhone: customerMobile,
        inquirySource: "whatsapp",
        notes: message,
        eventDate: eventDate,
        eventStartDate: eventDate,
        eventEndDate: eventEndDate || eventDate,
        slot: eventSlot || "fullday",
        hallId: selectedHallId,
        hallName: selectedHallName,
      });

      // Create booking
      await createBookingWithSync({
        hallId: selectedHallId || "calculator",
        hallName: selectedHallName || "Event Planner (Calculator)",
        date: eventDate,
        startDate: eventDate,
        endDate: eventEndDate || eventDate,
        slot: (eventSlot || "fullday") as any,
        price: total,
        name: customerName,
        mobile: customerMobile,
        guests: "0",
        message: message,
      });

      toast.success("Opening WhatsApp with your booking request!");
    } catch (err) {
      console.error("Failed to save details:", err);
      toast.error("Failed to save details, opening WhatsApp anyway.");
    } finally {
      const url = `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
      setShowWhatsAppModal(false);
    }
  }

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />

      <LuxuryBanner
        image="/hero/slide-mahal.jpg"
        badge={<><Calculator className="h-4 w-4 text-amber-300" /> Event Cost Calculator</>}
        title="Plan Your Perfect Event"
        subtitle="Select halls and services, review your event plan, and send the booking request via WhatsApp."
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(225,29,72,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_25%),linear-gradient(180deg,_#fff7f8_0%,_#ffffff_18%,_#fffdfd_100%)]" />
        
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-gray-150 text-sm font-semibold text-gray-600 hover:text-gray-950 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 text-gray-500 group-hover:text-gray-800 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
          </div>
          <div className="mb-6 sm:mb-8 rounded-[2rem] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e11d48] mb-3">Plan smarter, book faster</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight max-w-3xl">
                  Build your event plan from curated categories, then drill into the perfect service.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
                  Browse by category, refine by location, and keep your planner visible while you build the final request.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-0 border-t lg:border-t-0 lg:border-l border-white/70 bg-[#fff7f9]">
                {[
                  { label: "Categories", value: String(categoryCards.length), accent: "text-[#e11d48]" },
                  { label: "Visible services", value: String(categoryServices.length || services.length), accent: "text-emerald-600" },
                  { label: "Planner items", value: String(cart.length), accent: "text-sky-600" },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 sm:p-6 text-center flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{stat.label}</p>
                    <p className={`mt-2 text-3xl sm:text-4xl font-black ${stat.accent}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_420px] gap-6 xl:gap-8 items-start">

          {/* ─── LEFT: Services List ─── */}
          <div className="space-y-6">
            {/* Discovery Panel */}
            <div className="rounded-[2rem] border border-gray-100 bg-white/90 backdrop-blur-xl shadow-[0_16px_50px_rgba(15,23,42,0.08)] p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400 mb-2">Filter by Location</p>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full sm:w-72 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#e11d48] shadow-sm"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Plan Mode</p>
                  <p className="text-sm font-semibold text-gray-600">Category-first browsing</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400 mb-3">Browse by category</p>
                {!selectedCategory ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categoryCards.map((cat, index) => {
                      const accent = [
                        "from-rose-500 to-pink-500",
                        "from-amber-500 to-orange-500",
                        "from-emerald-500 to-teal-500",
                        "from-sky-500 to-cyan-500",
                        "from-violet-500 to-fuchsia-500",
                        "from-indigo-500 to-blue-500",
                      ][index % 6];
                      return (
                        <motion.button
                          key={cat.id}
                          onClick={() => pickCategory(cat.id)}
                          whileTap={{ scale: 0.98 }}
                          className="text-left group overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_50px_rgba(225,29,72,0.12)] transition-all"
                        >
                          <div className={`relative h-32 bg-gradient-to-br ${accent} text-white overflow-hidden`}>
                            {cat.category_image ? (
                              <ExternalImg
                                src={cat.category_image}
                                alt={cat.category_name}
                                fill
                                className="transition-transform duration-700 group-hover:scale-105"
                                fallbackClassName={`bg-gradient-to-br ${accent}`}
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                            <div className="relative z-10 h-full p-4 flex flex-col justify-end">
                              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Category</p>
                              <h4 className="text-lg font-extrabold leading-tight line-clamp-1">{cat.category_name}</h4>
                            </div>
                          </div>
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{cat.category_name}</p>
                              <p className="text-xs text-gray-500">{cat.count} service{cat.count === 1 ? "" : "s"}</p>
                            </div>
                            <span className="text-xs font-semibold text-[#e11d48]">Open</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => pickCategory("")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 bg-white text-sm font-semibold text-[#be123c] hover:bg-[#fff1f2] transition-colors shadow-sm"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      Back to Categories
                    </button>

                    <div className="rounded-[1.75rem] bg-gradient-to-br from-[#fff1f2] via-white to-[#f8fafc] border border-rose-100 p-4 sm:p-5 shadow-[0_14px_35px_rgba(225,29,72,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-2xl bg-white shadow-sm overflow-hidden border border-rose-100 flex-shrink-0">
                          {activeCategory?.category_image ? (
                            <ExternalImg
                              src={activeCategory.category_image}
                              alt={activeCategory.category_name}
                              fill
                              className="object-cover"
                              fallbackClassName="bg-gradient-to-br from-[#e11d48] to-[#be123c]"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#e11d48] to-[#be123c]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</p>
                          <h3 className="text-lg font-extrabold text-gray-900">{activeCategory?.category_name || "Services"}</h3>
                          <p className="text-xs text-gray-500">{categoryServices.length} service{categoryServices.length === 1 ? "" : "s"} available</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {categoryServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onAddToCart={addToCart}
                          isInCart={cartIds.has(service.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Event Planner / Cost Summary ─── */}
          <div className="space-y-6 xl:sticky xl:top-24 self-start">
            <div className="card-premium overflow-hidden flex flex-col min-h-[calc(100vh-7rem)]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <ShoppingCart className="h-5 w-5" />
                      <h2 className="font-bold text-lg">Event Planner</h2>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {cart.length} items
                    </span>
                  </div>
                </div>

                {/* Cart items */}
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3">🎊</div>
                      <p className="text-gray-500 text-sm">Add services to build your event plan</p>
                    </div>
                  ) : (
                    cart.map((item) => {
                      const isHallItem = item.service.id.startsWith("hall:");
                      return (
                        <div
                          key={item.service.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors ${
                            item.selected ? "border-[#e11d48]/20 bg-[#fff1f2]" : "border-gray-100 bg-gray-50 opacity-60"
                          }`}
                        >
                        {/* Toggle checkbox */}
                        <button
                          onClick={() => toggleSelect(item.service.id)}
                          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                            item.selected ? "bg-[#e11d48] border-[#e11d48]" : "border-gray-300"
                          }`}
                        >
                          {item.selected && <CheckCircle className="h-3 w-3 text-white fill-white" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
                              {item.service.title}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.service.id)}
                              aria-label={`Remove ${item.service.title} from planner`}
                              title="Remove service"
                              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>

                {/* Cost summary */}
                {cart.length > 0 && (
                  <div className="p-4 border-t border-gray-100">

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => selectedItems.length > 0 ? setShowWhatsAppModal(true) : toast.error("Select at least one service")}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#e11d48] hover:bg-[#e11d48] text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-[#e11d48]/20 active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Send Booking Request
                      </button>
                      <button
                        onClick={() => {
                          sessionStorage.removeItem("vizha_selected_hall");
                          sessionStorage.removeItem("vizha_selected_hall_date");
                          sessionStorage.removeItem("vizha_selected_hall_endDate");
                          sessionStorage.removeItem("vizha_selected_hall_slot");
                          setHallStartDate("");
                          setHallEndDate("");
                          setEventDate("");
                          setEventEndDate("");
                          setCart([]);
                        }}
                        className="w-full py-2.5 border border-red-200 text-red-500 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick tip */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">Pro Tip</p>
                    <p className="text-xs text-amber-700">
                      Toggle services on/off with the circle button. Only selected services are included in your request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── WhatsApp Bill Modal ─── */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowWhatsAppModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[100dvh] sm:max-h-[92dvh] flex flex-col"
            >
              {/* Modal header */}
              <div className="bg-[#e11d48] p-5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <MessageCircle className="h-6 w-6" />
                  <h3 className="font-bold text-lg">Send Booking Request</h3>
                </div>
                <button onClick={() => setShowWhatsAppModal(false)} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Bill preview */}
                <div className="bg-gray-50 rounded-2xl p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-gray-700 mb-2">Selected Items ({selectedItems.length})</p>
                  {selectedItems.map((item) => (
                    <div key={item.service.id} className="py-1 text-xs text-gray-600">
                      <span className="line-clamp-1 flex-1">• {item.service.title} ×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Customer details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Mobile Number *</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-gray-100 rounded-xl border border-gray-200 text-sm text-gray-600">+91</span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Event Date</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                      />
                      {hallStartDate && eventDate && eventDate !== hallStartDate && (
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 p-2 rounded-xl mt-1 leading-tight">
                          ⚠️ Event date mismatch! Your selected hall booking starts on {hallStartDate}.
                        </p>
                      )}
                      {hallEndDate && eventEndDate && eventEndDate !== hallEndDate && (
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 p-2 rounded-xl mt-1 leading-tight">
                          ⚠️ Event end date mismatch! Your selected hall booking ends on {hallEndDate}.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Location *</label>
                      <input
                        type="text"
                        placeholder="Madurai"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Event Type *</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    >
                      <option value="">Select event type</option>
                      {["Wedding / திருமணம்","Engagement / நிச்சயதார்த்தம்","Birthday / பிறந்தநாள்","Baby Shower / வளைகாப்பு","Naming Ceremony / நாமகரணம்","House Warming / கிரஹப்பிரவேசம்","Reception / வரவேற்பு","Corporate Event","Other"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Event Slot *</label>
                    <select
                      value={eventSlot}
                      onChange={(e) => setEventSlot(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    >
                      <option value="morning">🌅 Morning</option>
                      <option value="evening">🌆 Evening</option>
                      <option value="fullday">☀️ Full Day</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Event End Date</label>
                      <input
                        type="date"
                        value={eventEndDate}
                        min={eventDate || hallStartDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEventEndDate(eventDate || hallEndDate || hallStartDate);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-rose-200 text-[#e11d48] text-sm font-semibold hover:bg-rose-50 transition-colors"
                      >
                        Match Hall Range
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-4 text-white rounded-2xl font-bold text-base transition-all shadow-xl active:scale-95"
                  style={{ background: "linear-gradient(135deg,#25d366,#128c7e)" }}
                >
                  <MessageCircle className="h-5 w-5" />
                  Send Booking Request
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteFooter />
      <MobileBottomNav />
      <div className="h-28 md:hidden" />
    </div>
  );
}
