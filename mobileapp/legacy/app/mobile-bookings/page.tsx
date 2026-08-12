"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Clock3, MapPin, PartyPopper } from "lucide-react";
import { getLocalBookings, type Booking } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { quotes, type QuoteRequest } from "@/lib/celebration";

const tones: Record<Booking["status"], string> = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", in_progress: "bg-blue-50 text-blue-700", completed: "bg-violet-50 text-violet-700", cancelled: "bg-gray-100 text-gray-500" };

export default function MobileBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  useEffect(() => { setItems(getLocalBookings()); setRequests(quotes()); }, []);
  const filtered = items.filter((item) => tab === "all" || (tab === "active" ? !["completed", "cancelled"].includes(item.status) : item.status === "completed"));
  return <div className="min-h-dvh bg-[#fffafb] pb-24"><MobilePageHeader title="My Bookings" subtitle="Track every celebration in one place" /><main className="px-4 py-5">
    {requests.length > 0 && <section className="mb-5"><h2 className="mb-3 text-sm font-black">Quotation requests</h2><div className="space-y-3">{requests.map(q => <article key={q.id} className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase text-rose-500">{q.vendorName}</p><h3 className="mt-1 text-sm font-black">{q.service}</h3></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-700">{q.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-3 text-[10px] text-gray-500"><span>{q.eventDate}</span><span>{q.guestCount} guests</span></div><p className="mt-3 text-xs text-gray-500">{q.message}</p></article>)}</div></section>}
    <div className="mb-5 grid grid-cols-3 rounded-2xl bg-rose-50 p-1">{(["all","active","completed"] as const).map(value => <button key={value} onClick={() => setTab(value)} className={`rounded-xl px-2 py-2.5 text-xs font-black capitalize ${tab === value ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>{value}</button>)}</div>
    {filtered.length ? <div className="space-y-3">{filtered.map(item => <article key={item.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600"><CalendarDays className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-sm font-black text-gray-900">{item.hallName || "VizhaOne Booking"}</h2><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${tones[item.status]}`}>{item.status.replace("_", " ")}</span></div><p className="mt-1 text-[10px] font-bold text-gray-400">#{item.id}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-3 text-xs text-gray-600"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-rose-500" />{item.date || "Date pending"}</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-rose-500" />{item.slot || "Full day"}</span></div><div className="mt-3 flex items-center justify-between"><strong className="text-sm text-rose-700">{item.price ? formatPrice(item.price) : "Quote requested"}</strong><Link to="/halls" className="flex items-center text-xs font-bold text-gray-600">View halls <ChevronRight className="h-4 w-4" /></Link></div></article>)}</div> : <div className="mt-16 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-50 text-rose-500"><PartyPopper className="h-9 w-9" /></span><h2 className="mt-5 text-xl font-black">No bookings yet</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">Find the perfect hall or service and start planning your celebration.</p><Link to="/services" className="mt-6 inline-flex rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">Explore services</Link></div>}
  </main><MobileBottomNav /></div>;
}
