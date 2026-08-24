"use client";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useServices } from "@/hooks/useServices";
import { getCompareIds, toggleCompare } from "@/lib/compare";
import { formatServicePrice } from "@/lib/utils";

export default function ComparePage() {
  const { services } = useServices(); const ids = getCompareIds();
  const items = useMemo(() => ids.map((id) => services.find((s) => s.id === id)).filter(Boolean), [ids,services]);
  return <div className="min-h-screen bg-[#fff9fa]"><Navbar/><main className="mx-auto max-w-6xl px-5 py-12"><p className="text-xs font-black uppercase tracking-[.2em] text-[#be123c]">Decision made simpler</p><h1 className="mt-2 text-4xl font-black">Compare vendors</h1><p className="mt-2 text-gray-500">Compare up to 3 vendors by pricing, trust, experience and response.</p>
    {!items.length ? <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm"><p>No vendors selected.</p><Link to="/services" className="mt-5 inline-block rounded-xl bg-[#e11d48] px-6 py-3 font-bold text-white">Explore vendors</Link></div> : <div className="mt-8 grid gap-5 md:grid-cols-3">{items.map((s:any)=><article key={s.id} className="overflow-hidden rounded-3xl bg-white shadow-sm"><img src={s.image_url} className="h-52 w-full object-cover"/><div className="p-5"><h2 className="text-xl font-black">{s.title}</h2><p className="text-sm text-gray-500">{s.location || 'Location on request'}</p><dl className="mt-5 space-y-3 text-sm"><div><dt className="text-gray-400">Starting price</dt><dd className="font-black text-[#be123c]">{formatServicePrice(s)} {s.price_unit ? `· ${s.price_unit}`:''}</dd></div><div><dt className="text-gray-400">Verification</dt><dd className="font-bold">{s.verified ? '✓ VizhaOne Verified Partner':'Not verified'}</dd></div><div><dt className="text-gray-400">Experience</dt><dd className="font-bold">{s.experience_years ? `${s.experience_years}+ years`:'Not provided'}</dd></div><div><dt className="text-gray-400">Rating</dt><dd className="font-bold">{s.rating ? `★ ${s.rating} (${s.review_count || 0})`:'New vendor'}</dd></div><div><dt className="text-gray-400">Response</dt><dd className="font-bold">{s.response_time || 'Within 24 hours'}</dd></div></dl><div className="mt-5 flex gap-2"><Link to={`/services/${s.id}`} className="flex-1 rounded-xl bg-[#e11d48] px-3 py-2 text-center text-sm font-bold text-white">View profile</Link><button onClick={()=>{toggleCompare(s);location.reload();}} className="rounded-xl border px-3 text-sm font-bold">Remove</button></div></div></article>)}</div>}
  </main><SiteFooter/></div>;
}
