"use client";

import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Share2,
  UsersRound,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { toast } from "sonner";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import { createBookingWithSync, type Booking } from "@/lib/api";
import { formatServicePrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { shareContent } from "@/lib/nativeShare";
import { ServiceDetailGallery } from "@/components/features/ServiceDetailGallery";

export default function ServiceDetailClient({ id }: { id: string }) {
  const navigate = useNavigate();
  const { services, categories, loading } = useCatalog();
  const { isFavorite, toggle } = useFavorites();
  const { items: cartItems, add: addToCart } = useCart();
  const [bookingOpen, setBookingOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("book") === "1",
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Booking | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    date: "",
    guests: "",
    eventType: "",
    location: "",
    message: "",
  });
  const resolvedId =
    id === "_" && typeof window !== "undefined"
      ? window.location.pathname
          .replace(/\/$/, "")
          .split("/")
          .filter(Boolean)
          .pop() || id
      : id;
  const foundService = services.find((s) => s.id === resolvedId) || null;
  const service = foundService
    ? {
        ...foundService,
        categories: categories.find((c) => c.id === foundService.category_id),
      }
    : null;
  const serviceImages = service
    ? [
        ...new Set(
          [service.image_url, ...(service.gallery_urls || [])].filter(
            Boolean,
          ) as string[],
        ),
      ]
    : [];

  async function handleShare() {
    if (!service) return;
    try {
      const result = await shareContent({
        title: service.title,
        text: `Check out ${service.title} on VizhaOne!`,
        url: `${process.env.NEXT_PUBLIC_WEB_URL || "https://www.vizhaone.com"}/services/${service.id}`,
      });
      if (result === "copied") toast.success("Link copied to clipboard!");
    } catch (error) {
      if ((error as Error)?.message !== "Share canceled")
        toast.error("Unable to share right now");
    }
  }

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!service) return;
    if (
      !form.name.trim() ||
      !/^\d{10}$/.test(form.mobile.trim()) ||
      !form.date ||
      !form.guests ||
      !form.eventType.trim() ||
      !form.location.trim()
    )
      return toast.error("Please complete all required details");
    if (!acceptedTerms)
      return toast.error("Please accept the Terms and Privacy Policy");
    setSubmitting(true);
    try {
      const result = await createBookingWithSync({
        serviceId: service.id,
        serviceName: service.title,
        hallName: service.title,
        date: form.date,
        startDate: form.date,
        endDate: form.date,
        slot: "fullday",
        price: Number(service.price_min || service.price || 0),
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        guests: form.guests,
        message: `Event: ${form.eventType.trim()}\nLocation: ${form.location.trim()}\n${form.message.trim()}`,
      });
      setConfirmation(result.booking);
      toast.success("Booking request sent to VizhaOne");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Booking request failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Service not found</p>
          <Link to="/services" className="text-[#e11d48] underline mt-2 block">
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              {serviceImages.length > 0 && (
                <div className="relative">
                  <ServiceDetailGallery
                    images={serviceImages}
                    title={service.title}
                  />
                  <button
                    onClick={() =>
                      toggle({
                        id: service.id,
                        type: "service",
                        title: service.title,
                        price: Number(service.price_min || service.price || 0),
                        image_url: service.image_url,
                        location: service.location,
                      })
                    }
                    className={`absolute right-16 top-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/70 shadow-md backdrop-blur ${isFavorite(service.id) ? "bg-rose-600 text-white" : "bg-white/95 text-rose-600"}`}
                    aria-label="Save service"
                  >
                    <Heart
                      className={`h-5 w-5 ${isFavorite(service.id) ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
              )}
              {/* Image */}
              <div className="hidden">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-7xl">🎉</span>
                )}
                {service.categories && (
                  <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold">
                    {service.categories.category_name}
                  </span>
                )}
                <button
                  onClick={() =>
                    toggle({
                      id: service.id,
                      type: "service",
                      title: service.title,
                      price: Number(service.price_min || service.price || 0),
                      image_url: service.image_url,
                      location: service.location,
                    })
                  }
                  className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/70 shadow-md backdrop-blur ${isFavorite(service.id) ? "bg-rose-600 text-white" : "bg-white/95 text-rose-600"}`}
                  aria-label="Save service"
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite(service.id) ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              {/* Title & Desc */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                    {service.title}
                  </h1>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={handleShare}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#e11d48] transition-colors"
                      aria-label="Share Service"
                      title="Share this Service"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${service.availability_status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {service.availability_status ? "Available" : "Booked"}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-gray-500 mb-4">
                  {service.vendor_name}
                </p>
                {service.verified && (
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    VizhaOne Verified Partner
                  </div>
                )}

                {service.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-6">
                    <MapPin className="h-4 w-4 text-[#e11d48]" />
                    <span>
                      {service.location}{" "}
                      {service.place_name ? `• ${service.place_name}` : ""}
                    </span>
                  </div>
                )}

                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {service.description || "No description provided."}
                </p>
                <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Service price
                  </p>
                  <p className="mt-1 text-xl font-black text-rose-700">
                    {formatServicePrice(service)}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Final price depends on event requirements and selected
                    package.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={cartItems.some((item) => item.id === service.id)}
                  onClick={() => {
                    addToCart({
                      id: service.id,
                      title: service.title,
                      price: Number(service.price_min || service.price || 0),
                      image_url: service.image_url,
                      location: service.location,
                    });
                    toast.success("Added to cart");
                  }}
                  className="rounded-2xl bg-gray-950 py-4 text-sm font-black text-white disabled:bg-emerald-600"
                >
                  {cartItems.some((item) => item.id === service.id)
                    ? "Added ✓"
                    : "Add to Cart"}
                </button>
                <button
                  onClick={() => setBookingOpen(true)}
                  disabled={!service.availability_status}
                  className="rounded-2xl bg-[#e11d48] py-4 text-sm font-black text-white shadow-lg shadow-rose-100 disabled:opacity-50"
                >
                  Book Now
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] rounded-3xl p-6 text-white shadow-sm">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-300" />
                VizhaOne Guarantee
              </h3>
              <p className="text-white/80 text-xs leading-relaxed">
                {service.verified
                  ? "This partner's business, phone, location and portfolio were reviewed by VizhaOne."
                  : "Send your booking request through VizhaOne so our team can help confirm availability and service details."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-24 md:hidden" />
      {bookingOpen && (
        <div className="fixed inset-0 z-[120] flex items-end bg-black/55 p-3 backdrop-blur-sm">
          <section className="max-h-[92dvh] w-full overflow-y-auto rounded-[30px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                  Book with VizhaOne
                </p>
                <h2 className="mt-1 text-xl font-black">{service.title}</h2>
              </div>
              <button
                onClick={() => {
                  setBookingOpen(false);
                  setConfirmation(null);
                }}
                className="grid h-10 w-10 place-items-center rounded-full bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {confirmation ? (
              <div className="py-8 text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-3xl">
                  ✓
                </span>
                <h3 className="mt-5 text-xl font-black">
                  Booking request received
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Your request is saved in My Bookings. Track its live status
                  there.
                </p>
                {confirmation.vendorMobile && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                      Service provider contact
                    </p>
                    <h4 className="mt-1 text-sm font-black">
                      {confirmation.vendorName ||
                        service.vendor_name ||
                        service.title}
                    </h4>
                    <p className="mt-1 text-xs font-bold text-gray-600">
                      {confirmation.vendorMobile}
                    </p>
                    <a
                      href={`tel:${String(confirmation.vendorMobile).replace(/[^+\d]/g, "")}`}
                      className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white"
                    >
                      Call Service Provider
                    </a>
                  </div>
                )}
                <p className="mt-4 rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-600">
                  Request ID: {confirmation.id}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/bookings")}
                  className="mt-3 min-h-12 w-full rounded-xl bg-rose-600 text-xs font-black text-white"
                >
                  View My Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="mt-5 space-y-3">
                {[
                  ["Full name", "name", "text"],
                  ["Phone number", "mobile", "tel"],
                  ["Event date", "date", "date"],
                  ["Guest count", "guests", "number"],
                  ["Event type", "eventType", "text"],
                  ["Event location", "location", "text"],
                ].map(([label, key, type]) => (
                  <label
                    key={key}
                    className="block text-[11px] font-bold text-gray-600"
                  >
                    {label} *
                    <input
                      required
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className="mt-1 min-h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-rose-500"
                    />
                  </label>
                ))}
                <label className="block text-[11px] font-bold text-gray-600">
                  Additional requirements
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className="mt-1 min-h-20 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-rose-500"
                  />
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-[10px] leading-5 text-gray-600">
                  <input
                    required
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-rose-600"
                  />
                  <span>
                    I agree to the VizhaOne{" "}
                    <Link to="/terms" className="font-black text-rose-700">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-black text-rose-700">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <button
                  disabled={submitting || !acceptedTerms}
                  className="min-h-14 w-full rounded-2xl bg-rose-600 text-sm font-black text-white disabled:opacity-50"
                >
                  {submitting
                    ? "Sending request..."
                    : "Confirm Booking Request"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
