"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  PartyPopper,
  PhoneCall,
  RefreshCw,
} from "lucide-react";
import {
  getBookingsWithFallback,
  getLocalBookings,
  type Booking,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { quotes, type QuoteRequest } from "@/lib/celebration";
import { toast } from "sonner";

const tones: Record<Booking["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-violet-50 text-violet-700",
  cancelled: "bg-gray-100 text-gray-600",
};
const statusHelp: Record<Booking["status"], string> = {
  pending: "Request received. VizhaOne team will review it.",
  approved: "Booking approved by the VizhaOne team.",
  in_progress: "Your celebration booking is in progress.",
  completed: "This booking has been completed.",
  cancelled: "This booking was not confirmed.",
};
const normalizeMobile = (value?: string) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
const safeStatus = (value: unknown): Booking["status"] =>
  ["pending", "approved", "in_progress", "completed", "cancelled"].includes(
    String(value),
  )
    ? (value as Booking["status"])
    : "pending";

export default function MobileBookingsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const mobile = user?.mobile;
    try {
      if (!mobile) {
        setItems(getLocalBookings());
        setOffline(true);
        return;
      }
      const result = await getBookingsWithFallback(mobile);
      const local = getLocalBookings().filter(
        (booking) =>
          !mobile ||
          normalizeMobile(booking.mobile) === normalizeMobile(mobile),
      );
      const merged = new Map<string, Booking>();
      local.forEach((booking) => merged.set(booking.id, booking));
      result.bookings.forEach((booking) => merged.set(booking.id, booking));
      setItems(
        [...merged.values()]
          .map((booking) => ({
            ...booking,
            status: safeStatus(booking.status),
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          ),
      );
      setOffline(result.source === "localStorage");
    } catch (error) {
      setItems(
        getLocalBookings().map((booking) => ({
          ...booking,
          status: safeStatus(booking.status),
        })),
      );
      setOffline(true);
      toast.error(
        error instanceof Error ? error.message : "Unable to sync bookings",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.mobile]);

  useEffect(() => {
    setRequests(quotes());
    void loadBookings();
    window.addEventListener("focus", loadBookings);
    return () => window.removeEventListener("focus", loadBookings);
  }, [loadBookings]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          tab === "all" ||
          (tab === "active"
            ? !["completed", "cancelled"].includes(item.status)
            : item.status === "completed"),
      ),
    [items, tab],
  );

  return (
    <div className="min-h-dvh bg-[#fffafb] pb-24">
      <MobilePageHeader
        title="My Bookings"
        subtitle="Complete booking history and live status"
      />
      <main className="px-4 py-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-black text-gray-900">
              {items.length} booking{items.length === 1 ? "" : "s"}
            </p>
            <p className="text-[10px] text-gray-500">
              {offline ? "Offline history" : "Synced with VizhaOne"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
        </div>
        {requests.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-3 text-sm font-black">Quotation requests</h2>
            <div className="space-y-3">
              {requests.map((q) => (
                <article
                  key={q.id}
                  className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase text-rose-500">
                        {q.vendorName}
                      </p>
                      <h3 className="mt-1 text-sm font-black">{q.service}</h3>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-700">
                      {q.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-3 text-[10px] text-gray-500">
                    <span>{q.eventDate}</span>
                    <span>{q.guestCount} guests</span>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">{q.message}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="mb-5 grid grid-cols-3 rounded-2xl bg-rose-50 p-1">
          {(["all", "active", "completed"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`rounded-xl px-2 py-2.5 text-xs font-black capitalize ${tab === value ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}
            >
              {value}
            </button>
          ))}
        </div>
        {loading && !items.length ? (
          <div className="py-16 text-center text-sm font-bold text-gray-500">
            Loading booking history...
          </div>
        ) : filtered.length ? (
          <div className="space-y-3">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-black text-gray-900">
                        {item.hallName ||
                          item.serviceName ||
                          "VizhaOne Booking"}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${tones[item.status]}`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">
                      #{item.id}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-gray-500">
                      {statusHelp[item.status]}
                    </p>
                  </div>
                </div>
                <BookingProgress status={item.status} />
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-rose-500" />
                    {item.date || "Date pending"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    {item.slot === "fullday"
                      ? "Full day"
                      : item.slot || "Slot pending"}
                  </span>
                </div>
                {item.status === "cancelled" && item.rejectionReason && (
                  <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    Reason: {item.rejectionReason}
                  </p>
                )}
                {item.status !== "cancelled" && item.vendorMobile && (
                  <section className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Your service contact</p>
                    <h3 className="mt-1 text-sm font-black text-gray-900">{item.vendorName || item.hallName || item.serviceName || "VizhaOne Partner"}</h3>
                    <p className="mt-1 text-xs font-bold text-gray-600">{item.vendorMobile}</p>
                    <a href={`tel:${String(item.vendorMobile).replace(/[^+\d]/g, "")}`} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black text-white"><PhoneCall className="h-4 w-4"/>Continue — Call Vendor</a>
                  </section>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <strong className="text-sm text-rose-700">
                    {item.price ? formatPrice(item.price) : "Quote requested"}
                  </strong>
                  <Link
                    to="/services"
                    className="flex items-center text-xs font-bold text-gray-600"
                  >
                    Explore more <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-50 text-rose-500">
              <PartyPopper className="h-9 w-9" />
            </span>
            <h2 className="mt-5 text-xl font-black">No bookings yet</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
              Find the perfect hall or service and start planning your
              celebration.
            </p>
            <Link
              to="/services"
              className="mt-6 inline-flex rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white"
            >
              Explore services
            </Link>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

function BookingProgress({ status }: { status: Booking["status"] }) {
  if (status === "cancelled") return null;
  const steps: Booking["status"][] = [
    "pending",
    "approved",
    "in_progress",
    "completed",
  ];
  const active = steps.indexOf(status);
  return (
    <div className="mt-4" aria-label={`Booking progress: ${status}`}>
      <div className="flex gap-1">
        {steps.map((step, index) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${index <= active ? "bg-rose-500" : "bg-gray-100"}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[8px] font-bold text-gray-400">
        <span>Received</span><span>Approved</span><span>In progress</span><span>Complete</span>
      </div>
    </div>
  );
}
