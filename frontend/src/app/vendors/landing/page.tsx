"use client";
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useServices } from "@/hooks/useServices";
import { formatServicePrice } from "@/lib/utils";

const words = (value = "") => value.replace(/-/g," ").replace(/\b\w/g,(m)=>m.toUpperCase());
export default function VendorLandingPage() {
  const { category = "event-services", city = "near-me" } = useParams(); const { services, loading } = useServices();
  const categoryName = words(category); const cityName = words(city);
  const matches = useMemo(() => services.filter((s:any) => {
    const cat = `${s.category_id || ''} ${s.categories?.category_name || ''}`.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    const loc = `${s.location || ''} ${s.place_name || ''}`.toLowerCase();
    return (category === 'all' || cat.includes(category.toLowerCase())) && (city === 'near-me' || loc.includes(city.replace(/-/g,' ').toLowerCase()));
  }),[services,category,city]);
  useEffect(()=>{ const title=`Best ${categoryName} in ${cityName} | Prices & Verified Vendors | VizhaOne`; document.title=title; let meta=document.querySelector('meta[name="description"]'); if(!meta){meta=document.createElement('meta');meta.setAttribute('name','description');document.head.appendChild(meta);} meta.setAttribute('content',`Compare verified ${categoryName.toLowerCase()} in ${cityName}, transparent starting prices, portfolios, packages and request quotes on VizhaOne.`); },[categoryName,cityName]);
  return <div className="min-h-screen bg-[#fff9fa]"><Navbar/><header className="bg-gradient-to-br from-[#6b0928] via-[#a30f43] to-[#e11d48] px-5 py-16 text-center text-white"><p className="text-xs font-black uppercase tracking-[.25em]">Verified celebration professionals</p><h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black sm:text-6xl">{categoryName} in {cityName}</h1><p className="mx-auto mt-4 max-w-2xl text-white/80">View prices, portfolios and packages. Compare trusted vendors and request a personalised quote.</p></header>
  <main className="mx-auto max-w-6xl px-5 py-10"><div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">Recommended listings</h2><span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-[#be123c]">{matches.length} found</span></div>
  {loading ? <p>Loading verified vendors...</p> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{matches.map((s:any)=><article key={s.id} className="overflow-hidden rounded-3xl bg-white shadow-sm"><img src={s.image_url} alt={s.title} className="h-52 w-full object-cover"/><div className="p-5"><div className="flex justify-between gap-3"><h3 className="text-xl font-black">{s.title}</h3>{s.verified && <ShieldCheck className="text-emerald-600"/>}</div><p className="mt-2 flex items-center gap-1 text-sm text-gray-500"><MapPin size={15}/>{s.location}</p><p className="mt-4 text-lg font-black text-[#be123c]">{formatServicePrice(s)}</p><Link to={`/services/${s.id}`} className="mt-5 block rounded-xl bg-[#e11d48] py-3 text-center font-bold text-white">View packages & quote</Link></div></article>)}</div>}
  <section className="mt-14 grid gap-6 rounded-3xl bg-white p-7 shadow-sm md:grid-cols-2"><div><h2 className="text-2xl font-black">How to choose</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-gray-600"><li>Compare total package inclusions, not only starting price.</li><li>Check event date availability and response time.</li><li>Prefer VizhaOne Verified Partners with reviewed portfolios.</li><li>Confirm advance, travel charges and cancellation terms.</li></ul></div><div><h2 className="text-2xl font-black">Frequently asked questions</h2><details className="mt-4 border-b py-3"><summary className="font-bold">How do I get an exact price?</summary><p className="pt-2 text-gray-600">Open a vendor profile and send event date, guest count, location and budget through Request Quote.</p></details><details className="border-b py-3"><summary className="font-bold">Can I compare vendors?</summary><p className="pt-2 text-gray-600">Yes. Select up to three vendors and compare price, verification, ratings, experience and packages.</p></details></div></section></main><SiteFooter/></div>;
}
