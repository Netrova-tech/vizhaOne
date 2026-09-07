"use client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, MapPin, PlusCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MobileAppHeader } from "@/components/layout/MobileAppHeader";
import { apiUrl } from "@/lib/utils";
import { token } from "@/lib/mobileAuth";

type ProviderService = { id:string; title:string; verified:boolean; listingStatus:string; verificationStatus:string };

export default function ProviderDashboardPage(){
  const {user}=useAuth();
  const [services,setServices]=useState<ProviderService[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch(apiUrl("/api/provider/dashboard"),{headers:{Authorization:`Bearer ${token()}`}}).then(async response=>{if(!response.ok)throw new Error();return response.json()}).then(data=>setServices(Array.isArray(data.services)?data.services:[])).catch(()=>setServices([])).finally(()=>setLoading(false))},[]);
  const verified=services.filter(service=>service.verified).length;
  return <div className="min-h-dvh bg-[#fffafb] pb-10 pt-[calc(68px+env(safe-area-inset-top,0px))]">
    <MobileAppHeader/>
    <main className="px-4 py-5">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#5f1230] via-[#9f1239] to-[#f43f5e] p-5 text-white shadow-xl">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><BriefcaseBusiness/></span><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-100">Provider workspace</p><h1 className="text-xl font-black">Hello, {user?.name||"Partner"}</h1></div></div>
        <p className="mt-5 text-sm leading-6 text-rose-50">Create your business profile and publish services instantly. VizhaOne verification is a separate admin approval.</p>
        <Link to="/vendor-onboarding" className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black text-rose-700">Add a service <ArrowRight className="h-4 w-4"/></Link>
      </section>
      <div className="mt-5 grid grid-cols-3 gap-3">{[[loading?"…":String(services.length),"Published",Sparkles],[String(verified),"Verified",ShieldCheck],[String(services.length-verified),"Awaiting badge",Clock3]].map(([value,label,Icon])=><div key={String(label)} className="rounded-2xl border border-rose-100 bg-white p-3 shadow-sm"><Icon className="h-5 w-5 text-rose-500"/><strong className="mt-3 block text-sm">{value as string}</strong><small className="text-[9px] text-gray-400">{label as string}</small></div>)}</div>
      <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2/></span><div><h2 className="text-sm font-black">Instant publishing</h2><p className="text-[10px] text-gray-400">New services go live as Unverified. Only VizhaOne admin can enable the Verified Partner badge.</p></div></div><div className="mt-4 flex items-start gap-2 rounded-2xl bg-gray-50 p-3 text-xs text-gray-500"><MapPin className="h-4 w-4 flex-none text-rose-500"/>{user?.location||"Location not available"}</div></section>
      {services.length?<section className="mt-5 space-y-3"><h2 className="text-sm font-black">Your services</h2>{services.map(service=><Link key={service.id} to={`/services/${service.id}`} className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm"><div><p className="text-sm font-black">{service.title}</p><p className="mt-1 text-[10px] font-bold text-emerald-600">Published</p></div><span className={`rounded-full px-3 py-1 text-[9px] font-black ${service.verified?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{service.verified?"VizhaOne Verified":"Unverified"}</span></Link>)}</section>:<section className="mt-5 rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/50 p-6 text-center"><PlusCircle className="mx-auto h-8 w-8 text-rose-500"/><h2 className="mt-3 text-base font-black">Add your first service</h2><p className="mt-2 text-xs leading-5 text-gray-500">Publish your service and start receiving customer enquiries.</p><Link to="/vendor-onboarding" className="mt-4 inline-flex rounded-xl bg-rose-600 px-5 py-3 text-xs font-black text-white">Create service</Link></section>}
    </main>
  </div>;
}
