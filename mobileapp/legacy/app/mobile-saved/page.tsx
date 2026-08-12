"use client";

import { Heart, MapPin, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { ExternalImg } from "@/components/ui/ExternalImg";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { formatPriceOrQuote } from "@/lib/utils";

export default function MobileSavedPage() {
  const { items, remove } = useFavorites();
  return <div className="min-h-dvh bg-[#fffafb] pb-24"><MobilePageHeader title="Saved" subtitle={`${items.length} favourite${items.length === 1 ? "" : "s"}`} /><main className="px-4 py-5">{items.length ? <div className="grid grid-cols-2 gap-3">{items.map(item => <article key={item.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"><Link to={`/${item.type === "hall" ? "halls" : "services"}/${item.id}`}><ExternalImg src={item.image_url || "/hero/slide-1.jpg"} alt={item.title} className="h-28 w-full object-cover" /></Link><div className="p-3"><h2 className="truncate text-xs font-black text-gray-900">{item.title}</h2><p className="mt-1 flex items-center gap-1 truncate text-[10px] text-gray-500"><MapPin className="h-3 w-3 text-rose-500" />{item.location || "Tamil Nadu"}</p><div className="mt-3 flex items-center justify-between"><strong className="text-[11px] text-rose-600">{formatPriceOrQuote(item.price)}</strong><button onClick={() => remove(item.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-gray-100 text-gray-500" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button></div></div></article>)}</div> : <div className="mt-16 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-50 text-rose-500"><Heart className="h-9 w-9" /></span><h2 className="mt-5 text-xl font-black">Nothing saved yet</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">Tap the heart on halls and services you love.</p><Link to="/services" className="mt-6 inline-flex rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">Start exploring</Link></div>}</main><MobileBottomNav /></div>;
}
