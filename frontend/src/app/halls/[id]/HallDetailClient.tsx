"use client";

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, Car, BedDouble,
  MessageCircle, Phone, ArrowLeft, Calendar, CheckCircle, X, Loader2,
  CheckSquare, Square, Share2
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { HallGallery } from "@/components/features/HallGallery";
import { AvailabilityCalendar } from "@/components/features/AvailabilityCalendar";
import { generateDemoSlots, HALL_AMENITIES } from "@/data/halls";
import { useLang } from "@/context/LanguageContext";
import type { SlotType, SlotStatus, Service, Hall } from "@/types";
import { toast } from "sonner";
import { createBookingWithSync, createInquiry, getBookingsWithFallback, type Booking } from "@/lib/api";
import { CategoryIcon } from "@/lib/iconMap";

type Tab = "overview" | "availability" | "services" | "gallery";
const RESERVED_BOOKING_STATUSES = new Set(["approved", "in_progress", "completed"]);

function isReservedBooking(booking: Booking) {
  return RESERVED_BOOKING_STATUSES.has(booking.status);
}

function bookingCoversDate(booking: Booking, date: string) {
  const bookingStart = booking.startDate || booking.date;
  const bookingEnd = booking.endDate || bookingStart;
  return bookingStart <= date && date <= bookingEnd;
}

function slotsOverlap(bookingSlot: SlotType | "fullday" | string, selectedSlot: SlotType) {
  return bookingSlot === selectedSlot || bookingSlot === "fullday" || selectedSlot === "fullday";
}

function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HallDetailClient({ id }: { id: string }) {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<SlotType | "">("");
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [activeDetailService, setActiveDetailService] = useState<Service | null>(null);

  function toggleVendor(vid: string) {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) next.delete(vid); else next.add(vid);
      return next;
    });
  }

  function handleShare() {
    if (!hall) return;
    if (navigator.share) {
      navigator.share({
        title: hall.name,
        text: `Check out ${hall.name} on VizhaOne!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({ guests: "", message: "" });
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    bookingId: string; name: string; mobile: string;
    startDate: string; endDate: string; slot: string; hallName: string;
  } | null>(null);

  const [hall, setHall] = useState<Hall | null>(null);
  const [vendors, setVendors] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const resolvedId = (id === "_" && typeof window !== "undefined")
      ? window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop() || id
      : id;

    const hallsRaw = localStorage.getItem("vizha_admin_halls");
    const halls: Hall[] = hallsRaw ? JSON.parse(hallsRaw) : [];
    setHall(halls.find((h) => h.id === resolvedId) || null);

    async function loadLinkedServices() {
      try {
        const res = await fetch(`/api/catalog/hall-services/${resolvedId}`);
        const linkedIds: string[] = await res.json();
        const allServicesRaw = localStorage.getItem("vizha_admin_services");
        const allServices: Service[] = allServicesRaw ? JSON.parse(allServicesRaw) : [];
        const categoriesRaw = localStorage.getItem("vizha_admin_categories");
        const allCategories: any[] = categoriesRaw ? JSON.parse(categoriesRaw) : [];
        const filteredServices = allServices.filter((s) => linkedIds.includes(s.id)).map((s) => {
          const cat = allCategories.find((c) => c.id === s.category_id);
          return { ...s, categories: cat };
        });
        setVendors(filteredServices);
        // Keep localStorage up to date
        localStorage.setItem(`vizha_hall_services_${resolvedId}`, JSON.stringify(linkedIds));
        return;
      } catch (err) {
        console.warn("Failed to load linked services from DB, falling back to local storage", err);
      }
      try {
        const linkedIds: string[] = JSON.parse(localStorage.getItem(`vizha_hall_services_${resolvedId}`) || "[]");
        const allServices: Service[] = JSON.parse(localStorage.getItem("vizha_admin_services") || "[]");
        const categoriesRaw = localStorage.getItem("vizha_admin_categories");
        const allCategories: any[] = categoriesRaw ? JSON.parse(categoriesRaw) : [];
        const filteredServices = allServices.filter((s) => linkedIds.includes(s.id)).map((s) => {
          const cat = allCategories.find((c) => c.id === s.category_id);
          return { ...s, categories: cat };
        });
        setVendors(filteredServices);
      } catch {
        setVendors([]);
      }
    }
    loadLinkedServices();

    let isMounted = true;

    async function loadBookings() {
      try {
        const { bookings: allBookings } = await getBookingsWithFallback();
        const hallBookings = allBookings.filter(
          (b) => b.hallId === resolvedId && isReservedBooking(b)
        );
        if (!isMounted) return;
        setBookings(hallBookings);
      } catch (err) {
        console.error("Failed to load bookings:", err);
      }
    }

    const refreshBookings = () => {
      void loadBookings();
    };

    loadBookings();
    window.addEventListener("focus", refreshBookings);
    window.addEventListener("storage", refreshBookings);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshBookings();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", refreshBookings);
      window.removeEventListener("storage", refreshBookings);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  const slots = useMemo(() => {
    if (!hall) return [];
    const baseSlots = generateDemoSlots(hall.id);
    return baseSlots.map((slot) => {
      const isBooked = bookings.some(
        (b) =>
          bookingCoversDate(b, slot.date) &&
          slotsOverlap(b.slot, slot.slot)
      );
      return {
        ...slot,
        status: (isBooked ? "booked" : "available") as SlotStatus,
      };
    });
  }, [hall?.id, bookings]);

  if (!hall) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-2">Hall not found</p>
        <button onClick={() => navigate(-1)} className="text-[#e11d48] underline">Go Back</button>
      </div>
    </div>
  );

  const safeHall = hall;

  // vendors state already contains the linked services (full objects) loaded in useEffect
  const linkedServices = vendors;

  function handleDateSelect(date: string, slot: SlotType) {
    setSelectedDate(date);
    setSelectedEndDate(date);
    setSelectedSlot(slot);
  }

  const slotLabels: Record<SlotType, string> = {
    morning: "Morning",
    evening: "Evening",
    fullday: "Full Day",
  };

  function isSlotBookedForRange(slot: SlotType, startDate: string, endDate: string) {
    if (!startDate || !endDate) return false;
    return bookings.some((bookingItem) => {
      const bookingStart = bookingItem.startDate || bookingItem.date;
      const bookingEnd = bookingItem.endDate || bookingStart;
      const rangesOverlap = bookingStart <= endDate && startDate <= bookingEnd;
      return rangesOverlap && slotsOverlap(bookingItem.slot, slot);
    });
  }

  function unavailableSlotsForRange(startDate: string, endDate: string) {
    return (["morning", "evening", "fullday"] as SlotType[]).filter((slot) =>
      isSlotBookedForRange(slot, startDate, endDate)
    );
  }

  function hasAvailableSlotForRange(startDate: string, endDate: string) {
    return unavailableSlotsForRange(startDate, endDate).length < 3;
  }

  function handleStartDateChange(date: string) {
    const endDate = !selectedEndDate || selectedEndDate < date ? date : selectedEndDate;
    if (!hasAvailableSlotForRange(date, endDate)) {
      toast.error("All slots are already booked for this date.");
      return;
    }
    setSelectedDate(date);
    setSelectedEndDate(endDate);
    if (selectedSlot && isSlotBookedForRange(selectedSlot, date, endDate)) {
      setSelectedSlot("");
      toast.info("Selected slot is already booked for this date. Please choose another slot.");
    }
  }

  function handleEndDateChange(date: string) {
    if (selectedDate && date < selectedDate) {
      toast.error("End date cannot be before start date.");
      return;
    }
    setSelectedEndDate(date);
    if (selectedDate && selectedSlot && isSlotBookedForRange(selectedSlot, selectedDate, date)) {
      setSelectedSlot("");
      toast.info("Selected slot is already booked for this date. Please choose another slot.");
    }
  }

  function handleSlotChange(slot: SlotType | "") {
    if (slot && selectedDate && selectedEndDate && isSlotBookedForRange(slot, selectedDate, selectedEndDate)) {
      toast.error(`${slotLabels[slot]} slot is already booked for the selected date.`);
      return;
    }
    setSelectedSlot(slot);
  }

  function handleAddHallToPlan() {
    if (!selectedDate || !selectedEndDate || !selectedSlot) {
      toast.error("Please select start date, end date, and slot");
      return;
    }
    if (isSlotBookedForRange(selectedSlot, selectedDate, selectedEndDate)) {
      toast.error("This slot is already booked for the selected date range.");
      return;
    }
    sessionStorage.setItem("vizha_selected_hall", JSON.stringify(safeHall));
    sessionStorage.setItem("vizha_selected_hall_date", selectedDate);
    sessionStorage.setItem("vizha_selected_hall_endDate", selectedEndDate);
    sessionStorage.setItem("vizha_selected_hall_slot", selectedSlot);
    const selectedServiceIds = vendors.filter((vendor) => selectedVendors.has(vendor.id)).map((vendor) => vendor.id);
    if (selectedServiceIds.length > 0) {
      sessionStorage.setItem("vizha_selected_services", JSON.stringify(selectedServiceIds));
    } else {
      sessionStorage.removeItem("vizha_selected_services");
    }
    toast.success(
      selectedServiceIds.length > 0
        ? `${safeHall.name} and ${selectedServiceIds.length} service${selectedServiceIds.length > 1 ? "s" : ""} added to planner!`
        : `${safeHall.name} added to planner!`
    );
    setShowBookModal(false);
    navigate("/calculator");
  }

  async function handleBookingSubmit() {
    if (!selectedDate || !selectedEndDate || !selectedSlot) {
      toast.error("Please select start date, end date, and slot"); return;
    }

    if (selectedDate < tomorrowStr) {
      toast.error("Please select a future date (tomorrow onwards)");
      return;
    }

    if (selectedEndDate < selectedDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    const isAlreadyBooked = bookings.some(
      (b) => {
        const bookingDate = b.startDate || b.date;
        const slotsOverlap = b.slot === selectedSlot || b.slot === "fullday" || selectedSlot === "fullday";
        return bookingDate === selectedDate && slotsOverlap;
      }
    );

    if (isAlreadyBooked) {
      toast.error("This slot is already booked for the selected date range.");
      return;
    }

    setBooking(true);

    const price = 0; // Price not defined yet
    const fallbackName = "Guest";
    const fallbackMobile = "0000000000";

    try {
      await createInquiry({
        customerName: fallbackName,
        customerPhone: fallbackMobile,
        hallId: safeHall.id,
        hallName: safeHall.name,
        inquirySource: "whatsapp",
        notes: bookForm.message,
        eventDate: selectedDate,
        eventStartDate: selectedDate,
        eventEndDate: selectedEndDate,
        slot: selectedSlot,
        expectedGuests: bookForm.guests,
      });

      const result = await createBookingWithSync({
        hallId: safeHall.id,
        hallName: safeHall.name,
        date: selectedDate,
        startDate: selectedDate,
        endDate: selectedEndDate,
        slot: selectedSlot as "morning" | "evening" | "fullday",
        price,
        name: fallbackName,
        mobile: fallbackMobile,
        guests: bookForm.guests,
        message: bookForm.message,
      });

      if (result.success) {
        const statusMsg = result.synced ? "Booking saved to database" : "Booking saved locally (offline mode)";
        toast.success(statusMsg);
        setBooking(false);
        setShowBookModal(false);
        setConfirmed({
          bookingId: result.booking.id,
          name: fallbackName,
          mobile: fallbackMobile,
          startDate: selectedDate,
          endDate: selectedEndDate,
          slot: selectedSlot as string,
          hallName: safeHall.name,
        });
        if (isReservedBooking(result.booking)) {
          setBookings((prev) => [result.booking, ...prev]);
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create booking. Please try again.");
      setBooking(false);
    }
  }

  const amenitiesCheck = HALL_AMENITIES.map((a) => ({
    ...a,
    value: hall[a.key as keyof typeof hall] as boolean,
  }));

  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#be123c] transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Halls
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 mb-6">
        <HallGallery images={hall.gallery_urls || (hall.image_url ? [hall.image_url] : [])} hallName={hall.name} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <div className="card-premium p-5 mb-4">
              <div className="flex items-start justify-between mb-2 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{hall.name}</h1>
                <button
                  onClick={handleShare}
                  className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#e11d48] transition-colors"
                  aria-label="Share Hall"
                  title="Share this Hall"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                <MapPin className="h-4 w-4 text-[#e11d48]" />
                {hall.address}, {hall.location}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users, label: t("capacity"), value: `${hall.capacity} ${t("guests")}`, color: "green" },
                  {
                    icon: Users,
                    label: t("catering"),
                    value: hall.dining_capacity && hall.dining_capacity > 0
                      ? `${hall.dining_capacity} ${t("guests")}`
                      : (hall.has_catering ? t("available") : "N/A"),
                    color: "blue"
                  },
                  {
                    icon: Car,
                    label: t("parking"),
                    value: hall.parking_capacity && hall.parking_capacity > 0
                      ? `${hall.parking_capacity} cars`
                      : (hall.has_parking ? t("available") : "N/A"),
                    color: "gray"
                  },
                  {
                    icon: BedDouble,
                    label: t("rooms"),
                    value: hall.rooms && hall.rooms > 0
                      ? `${hall.rooms}`
                      : "N/A",
                    color: "rose"
                  },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-${stat.color}-50 rounded-2xl p-3 text-center`}>
                    <stat.icon className={`h-5 w-5 text-${stat.color}-600 mx-auto mb-1`} />
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-4">
              {(["overview", "availability", "services", "gallery"] as Tab[]).map((tb) => (
                <button key={tb} onClick={() => setTab(tb)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    tab === tb ? "bg-[#e11d48] text-white shadow" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {tb === "overview" ? "📋 Overview" :
                   tb === "availability" ? "📅 Calendar" :
                   tb === "services" ? "🛠️ Services" : "🖼️ Gallery"}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-4">
                <div className="card-premium p-5">
                  <h3 className="font-bold text-gray-900 mb-3">About This Hall</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{hall.description}</p>
                </div>
                <div className="card-premium p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Amenities & Facilities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {amenitiesCheck.map((a) => (
                      <div key={a.key} className={`flex items-center gap-3 p-3 rounded-xl ${a.value ? "bg-[#fff1f2] border border-[#fff1f2]" : "bg-gray-50 border border-gray-100 opacity-60"}`}>
                        <span className="text-xl">{a.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{lang === "ta" ? a.labelTa : a.label}</p>
                          <p className={`text-xs ${a.value ? "text-[#e11d48]" : "text-gray-400"}`}>
                            {a.value ? "✓ Available" : "✗ Not available"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Pricing block removed per user request */}
              </div>
            )}

            {tab === "availability" && (
              <div className="space-y-4">
                <AvailabilityCalendar
                  slots={slots}
                  onSelectDate={handleDateSelect}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot as SlotType}
                />
                {selectedDate && selectedSlot && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="card-premium p-4 border-2 border-[#e11d48]/20 bg-[#fff1f2]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Selected</p>
                        <p className="font-bold text-gray-900">
                          {selectedEndDate && selectedEndDate !== selectedDate
                            ? `${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} to ${new Date(selectedEndDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                            : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-sm text-[#be123c] font-semibold">
                          {selectedSlot === "morning" ? "🌅 Morning Slot" : "🌆 Evening Slot"}
                        </p>
                      </div>
                      <button onClick={() => setShowBookModal(true)}
                        className="px-5 py-3 bg-[#e11d48] text-white rounded-2xl font-bold text-sm hover:bg-[#be123c] transition-colors shadow-lg">
                        Add to Plan
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {tab === "services" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    🛠️ Services Available ({vendors.length})
                  </p>
                  {selectedVendors.size > 0 && (
                    <button onClick={() => setSelectedVendors(new Set())}
                      className="text-xs text-red-500 font-semibold hover:underline">
                      Clear ({selectedVendors.size})
                    </button>
                  )}
                </div>

                {vendors.length === 0 ? (
                  <div className="card-premium p-8 text-center text-gray-500">
                    <p className="text-4xl mb-3">🛠️</p>
                    <p>No services listed for this hall yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vendors.map((vendor) => {
                      const isSelected = selectedVendors.has(vendor.id);
                      const available = vendor.availability_status;
                      const catName = vendor.categories?.category_name || "";
                      const categoryImage = vendor.categories?.category_image;
                      const categoryIcon = vendor.categories?.icon;
                      
                      return (
                        <div key={vendor.id}
                          className={`card-premium overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                            isSelected ? "ring-2 ring-[#e11d48] bg-[#fff1f2]/40"
                              : available ? "hover:ring-2 hover:ring-[#e11d48]/20"
                              : "opacity-60"
                          }`}>
                          
                          {/* Image or fallback */}
                          <div className="relative h-40 w-full bg-gradient-to-br from-[#fff1f2] to-[#fff1f2] flex items-center justify-center overflow-hidden">
                            {vendor.image_url ? (
                              <img src={vendor.image_url} alt={vendor.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[#e11d48]">
                                {categoryIcon ? (
                                  <CategoryIcon icon={categoryIcon} image={categoryImage} className="h-12 w-12" />
                                ) : (
                                  <span className="text-4xl">🛠️</span>
                                )}
                              </div>
                            )}
                            
                            {/* Checkbox overlay */}
                            <div 
                              onClick={() => available && toggleVendor(vendor.id)}
                              className="absolute top-3 left-3 p-1 rounded-full bg-white/95 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all">
                              {isSelected ? (
                                <CheckSquare className="h-6 w-6 text-[#e11d48]" />
                              ) : (
                                <Square className="h-6 w-6 text-gray-300" />
                              )}
                            </div>
                            
                            {/* Category Badge */}
                            {catName && (
                              <div className="absolute bottom-3 left-3">
                                <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                  {catName}
                                </span>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${available ? "bg-[#fff1f2] text-[#be123c]" : "bg-red-100 text-red-600"}`}>
                                {available ? "Available" : "Booked"}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div className="mb-3">
                              <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{vendor.title}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2">{vendor.description || "No description provided."}</p>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                              <span className="text-xs font-bold text-gray-500 uppercase">{catName || "Service"}</span>
                              <button
                                onClick={() => setActiveDetailService(vendor)}
                                className="px-3 py-1.5 bg-[#e11d48]/10 hover:bg-[#e11d48] text-[#be123c] hover:text-white rounded-xl text-xs font-semibold transition-all">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "gallery" && (
              <HallGallery images={hall.gallery_urls || (hall.image_url ? [hall.image_url] : [])} hallName={hall.name} />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="card-premium overflow-hidden">
                <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-4">
                  <h3 className="font-bold text-white text-lg">{t("bookHall")}</h3>
                  <p className="text-[#e11d48]/20 text-xs">{hall.location} • {t("capacity")}: {hall.capacity}</p>
                </div>
                <div className="p-4">
                  {/* Booking sidebar price table removed per user request */}
                  {selectedDate && selectedSlot && (
                    <div className="mb-4 p-3 bg-[#fff1f2] rounded-xl border border-[#e11d48]/20">
                      <p className="text-xs text-[#be123c] font-semibold">✓ {selectedDate} — {selectedSlot}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <button onClick={() => { setTab("availability"); window.scrollTo({ top: 300, behavior: "smooth" }); }}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#e11d48] text-[#be123c] rounded-2xl text-sm font-bold hover:bg-[#fff1f2] transition-colors">
                      <Calendar className="h-4 w-4" /> {t("checkAvailability")}
                    </button>
                    <button onClick={() => setShowBookModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#e11d48] text-white rounded-2xl text-sm font-bold hover:bg-[#be123c] transition-colors shadow-lg">
                      Add to Plan
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-premium p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Hall Owner</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#fff1f2] flex items-center justify-center font-bold text-[#be123c]">
                    {(hall.owner_name || "O").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{hall.owner_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => e.target === e.currentTarget && setShowBookModal(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[100dvh] sm:max-h-[92dvh] flex flex-col">
              <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-white text-lg">Booking Request</h3>
                <button onClick={() => setShowBookModal(false)} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-28 sm:pb-6">
                <div className="p-3 bg-[#fff1f2] border border-[#e11d48]/20 rounded-xl space-y-1">
                  <p className="text-xs text-[#e11d48] font-bold">{hall.name}</p>
                  {hall.description && (
                    <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-3">
                      {hall.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Event Date * (Future dates only)</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={tomorrowStr}
                      onChange={(e) => {
                        handleStartDateChange(e.target.value);
                      }}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">End Date (for multi-day events)</label>
                    <input
                      type="date"
                      value={selectedEndDate}
                      min={selectedDate || tomorrowStr}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Event Slot *</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => handleSlotChange(e.target.value as SlotType | "")}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    >
                      <option value="">Select a Slot</option>
                      <option value="morning" disabled={Boolean(selectedDate && selectedEndDate && isSlotBookedForRange("morning", selectedDate, selectedEndDate))}>
                        🌅 Morning{selectedDate && selectedEndDate && isSlotBookedForRange("morning", selectedDate, selectedEndDate) ? " - Booked" : ""}
                      </option>
                      <option value="evening" disabled={Boolean(selectedDate && selectedEndDate && isSlotBookedForRange("evening", selectedDate, selectedEndDate))}>
                        🌆 Evening{selectedDate && selectedEndDate && isSlotBookedForRange("evening", selectedDate, selectedEndDate) ? " - Booked" : ""}
                      </option>
                      <option value="fullday" disabled={Boolean(selectedDate && selectedEndDate && isSlotBookedForRange("fullday", selectedDate, selectedEndDate))}>
                        ☀️ Full Day{selectedDate && selectedEndDate && isSlotBookedForRange("fullday", selectedDate, selectedEndDate) ? " - Booked" : ""}
                      </option>
                    </select>
                    {selectedDate && selectedEndDate && unavailableSlotsForRange(selectedDate, selectedEndDate).length > 0 && (
                      <p className="mt-1 text-xs text-[#be123c]">
                        Booked: {unavailableSlotsForRange(selectedDate, selectedEndDate).map((slot) => slotLabels[slot]).join(", ")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Expected Guests</label>
                    <input type="number" value={bookForm.guests}
                      onChange={(e) => setBookForm({ ...bookForm, guests: e.target.value })}
                      placeholder={`Up to ${hall.capacity}`} max={hall.capacity}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Linked Services</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBookModal(false);
                          setTab("services");
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
                        className="text-xs font-semibold text-[#be123c] hover:underline"
                      >
                        {selectedVendors.size > 0 ? "Edit" : "Choose"}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      {selectedVendors.size === 0 ? (
                        <p className="text-xs text-gray-500">No linked services selected.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {vendors.filter((vendor) => selectedVendors.has(vendor.id)).map((vendor) => (
                            <span
                              key={vendor.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200"
                            >
                              {vendor.categories?.category_name || "Service"}: {vendor.title}
                              <button
                                type="button"
                                onClick={() => toggleVendor(vendor.id)}
                                className="text-gray-400 hover:text-[#be123c]"
                                aria-label={`Remove ${vendor.title}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">{t("specialRequests")}</label>
                    <textarea value={bookForm.message} rows={2}
                      onChange={(e) => setBookForm({ ...bookForm, message: e.target.value })}
                      placeholder="Any special requirements..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48] resize-none" />
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
                <button onClick={handleAddHallToPlan} disabled={booking}
                  className="min-h-14 w-full flex items-center justify-center gap-2 py-4 bg-[#e11d48] text-white rounded-2xl font-bold text-base hover:bg-[#be123c] transition-colors shadow-lg disabled:opacity-50">
                  {booking ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  {booking ? "Submitting..." : "Continue to Planner"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation */}
      <AnimatePresence>
        {confirmed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", bounce: 0.25 }}
              className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[100dvh] sm:max-h-[92dvh] flex flex-col">
              <div className="bg-gradient-to-br from-[#e11d48] to-emerald-600 px-5 sm:px-6 pt-7 sm:pt-8 pb-9 sm:pb-10 text-center relative overflow-hidden flex-shrink-0">
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="relative z-10 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white mx-auto flex items-center justify-center mb-4 shadow-xl">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-[#e11d48]" />
                </motion.div>
                <h2 className="relative z-10 text-xl sm:text-2xl font-extrabold text-white mb-1">Booking Request Sent</h2>
                <p className="relative z-10 text-[#fff1f2] text-sm">Send it on WhatsApp so the vendor can confirm availability</p>
              </div>
              <div className="mx-4 sm:mx-6 -mt-5 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center justify-between relative z-10 flex-shrink-0">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Booking ID</p>
                  <p className="font-extrabold text-gray-900 text-base sm:text-lg tracking-wider break-all">{confirmed.bookingId}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="text-xl">🎊</span>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-3 overflow-y-auto flex-1">
                {[
                  { icon: "🏛️", label: "Hall",   value: confirmed.hallName },
                  { icon: "👤", label: "Name",   value: confirmed.name },
                  { icon: "📱", label: "Mobile", value: `+91 ${confirmed.mobile}` },
                  { icon: "📅", label: "Date Range", value: confirmed.startDate === confirmed.endDate
                    ? new Date(confirmed.startDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                    : `${new Date(confirmed.startDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} to ${new Date(confirmed.endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` },
                  { icon: confirmed.slot === "morning" ? "🌅" : confirmed.slot === "evening" ? "🌆" : "☀️", label: "Slot", value: confirmed.slot === "morning" ? "Morning Slot" : confirmed.slot === "evening" ? "Evening Slot" : "Full Day" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{row.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900 break-words">{row.value}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
                  <p className="text-xs text-amber-700 font-semibold">⏳ Status: Pending Confirmation</p>
                  <p className="text-xs text-amber-600 mt-0.5">Vendor will confirm within 2 hours</p>
                </div>
              </div>
              <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 sm:px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
                <a href={`https://wa.me/91${hall.owner_mobile}?text=${encodeURIComponent(
                    `🎊 *VizhaOne Booking Request*\n\nBooking ID: ${confirmed.bookingId}\nHall: ${confirmed.hallName}\nDate: ${confirmed.startDate}${confirmed.endDate !== confirmed.startDate ? ` to ${confirmed.endDate}` : ""}\nSlot: ${confirmed.slot}\nGuests: ~${bookForm.guests || "?"}\n\nCustomer: ${confirmed.name}\nMobile: +91${confirmed.mobile}\n\nPlease confirm availability.`
                  )}`}
                  target="_blank" rel="noopener noreferrer"
                  className="min-h-12 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg"
                  style={{ background: "linear-gradient(135deg,#25d366,#128c7e)" }}>
                  <MessageCircle className="h-5 w-5" /> Send Request on WhatsApp
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate("/bookings")}
                    className="py-3 bg-[#fff1f2] text-[#be123c] rounded-2xl font-semibold text-sm hover:bg-[#fff1f2] transition-colors border border-[#e11d48]/20">
                    My Bookings
                  </button>
                  <button onClick={() => { setConfirmed(null); setSelectedDate(""); setSelectedEndDate(""); setSelectedSlot(""); setBookForm({ guests: "", message: "" }); }}
                    className="py-3 bg-gray-50 text-gray-600 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition-colors border border-gray-200">
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {activeDetailService && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setActiveDetailService(null)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-5 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{activeDetailService.title}</h3>
                  <p className="text-xs opacity-90">{activeDetailService.categories?.category_name || "Service"}</p>
                </div>
                <button onClick={() => setActiveDetailService(null)} className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Service Image / Fallback */}
                <div className="relative h-56 w-full rounded-2xl bg-gray-100 overflow-hidden">
                  {activeDetailService.image_url ? (
                    <img src={activeDetailService.image_url} alt={activeDetailService.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#e11d48] bg-[#fff1f2]">
                      {activeDetailService.categories?.icon ? (
                        <CategoryIcon icon={activeDetailService.categories.icon} className="h-16 w-16" />
                      ) : (
                        <span className="text-5xl">🛠️</span>
                      )}
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-md ${activeDetailService.availability_status ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                      {activeDetailService.availability_status ? "Available" : "Booked"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">About This Service</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {activeDetailService.description || "No description provided."}
                  </p>
                </div>

                <div className="py-3 border-y border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">Location</span>
                    <span className="text-sm font-semibold text-gray-800 truncate block">{activeDetailService.location || "Tamil Nadu"}</span>
                  </div>
                </div>

                {activeDetailService.vendor_name && (
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Provided By</span>
                      <span className="font-bold text-gray-800 text-sm">{activeDetailService.vendor_name}</span>
                    </div>
                    {activeDetailService.vendor_mobile && (
                      <div className="flex gap-2">
                        <a href={`tel:${activeDetailService.vendor_mobile}`}
                          className="p-2.5 bg-white text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shadow-sm">
                          <Phone className="h-4 w-4" />
                        </a>
                        <a href={`https://wa.me/91${activeDetailService.vendor_mobile}?text=${encodeURIComponent(`Vanakkam! Naan "${activeDetailService.title}" service pathi kekanum. Please confirm availability.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-2.5 bg-[#e11d48] text-white hover:bg-[#be123c] rounded-xl transition-colors shadow-sm">
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (activeDetailService.availability_status) {
                        toggleVendor(activeDetailService.id);
                      }
                      setActiveDetailService(null);
                    }}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md ${
                      !activeDetailService.availability_status
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : selectedVendors.has(activeDetailService.id)
                        ? "bg-gray-800 hover:bg-gray-900 text-white"
                        : "bg-[#e11d48] hover:bg-[#be123c] text-white"
                    }`}>
                    {selectedVendors.has(activeDetailService.id) ? "Remove Service" : "Add Service"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileBottomNav />
    </div>
  );
}
