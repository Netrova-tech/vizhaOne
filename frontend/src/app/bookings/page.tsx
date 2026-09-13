"use client";

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarDays, Loader2, MapPin, Phone, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/utils";

type Booking = { id: string; hallName?: string; serviceName?: string; date?: string; startDate?: string; status?: string; vendorName?: string; vendorMobile?: string; price?: number | null };

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("vizha_mobile_token");
      const response = await fetch(apiUrl("/api/bookings"), { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Unable to load bookings");
      setItems(Array.isArray(body) ? body : body?.bookings || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load bookings"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user && user.role !== "service_provider") load(); else setLoading(false); }, [user]);
  if (authLoading) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-rose-600"/></main>;
  if (!user) return <Navigate to="/auth/login" replace/>;
  if (user.role === "service_provider") return <Navigate to="/profile" replace/>;

  return <main className="min-h-screen bg-[#fff8f7]"><Navbar/><section className="mx-auto max-w-5xl px-4 py-8 sm:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-rose-600">Customer account</p><h1 className="mt-1 text-3xl font-black">My bookings</h1></div><button onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-black text-rose-700"><RefreshCw className="h-4 w-4"/>Refresh</button></div>
    {loading ? <div className="grid h-56 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-rose-600"/></div> : error ? <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">{error}</div> : items.length ? <div className="mt-7 grid gap-4">{items.map(item => <article key={item.id} className="rounded-[24px] border border-rose-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{item.hallName || item.serviceName || "VizhaOne booking"}</h2><p className="mt-1 flex items-center gap-2 text-sm text-gray-500"><CalendarDays className="h-4 w-4"/>{item.startDate || item.date || "Date pending"}</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black capitalize text-rose-700">{item.status || "pending"}</span></div>{item.vendorName && <div className="mt-4 rounded-2xl bg-gray-50 p-4"><p className="font-bold">{item.vendorName}</p>{item.vendorMobile && <a href={`tel:${item.vendorMobile}`} className="mt-2 inline-flex items-center gap-2 text-sm font-black text-rose-700"><Phone className="h-4 w-4"/>{item.vendorMobile}</a>}</div>}</article>)}</div> : <div className="mt-8 rounded-[28px] border border-dashed border-rose-200 bg-white p-10 text-center"><MapPin className="mx-auto h-9 w-9 text-rose-500"/><h2 className="mt-4 text-xl font-black">No bookings yet</h2><p className="mt-2 text-sm text-gray-500">Your service and hall booking requests will appear here.</p><Link to="/services" className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white">Explore services</Link></div>}
  </section></main>;
}
