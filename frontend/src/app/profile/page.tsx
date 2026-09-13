"use client";

import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CalendarCheck, Loader2, LogOut, Mail, MapPin, Phone, ShieldCheck, Store, UserRound } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/utils";

type ProviderDashboard = { vendor: { business_name?: string; verified?: boolean; phone?: string; location?: string } | null; services: Array<{ id: string; title: string; listingStatus?: string; verificationStatus?: string }> };

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderDashboard | null>(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const isProvider = user?.role === "service_provider";

  useEffect(() => {
    if (!isProvider) return;
    const token = localStorage.getItem("vizha_mobile_token");
    if (!token) return;
    setProviderLoading(true);
    fetch(apiUrl("/api/provider/dashboard"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load provider dashboard")))
      .then(setProvider).catch(() => setProvider({ vendor: null, services: [] })).finally(() => setProviderLoading(false));
  }, [isProvider]);

  if (loading) return <main className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></main>;
  if (!user) return <Navigate to="/auth/login" replace />;

  async function logout() { await signOut(); navigate("/auth/login", { replace: true }); }

  const roleLabel = user.role === "admin" ? "VizhaOne Admin" : isProvider ? "Service Provider" : "Customer";
  return <main className="min-h-screen bg-[#fff8f7]">
    <Navbar />
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-xl shadow-rose-100/50">
        <div className="h-32 bg-gradient-to-r from-[#57052e] via-[#8b1047] to-[#d71d62] sm:h-40" />
        <div className="px-5 pb-7 sm:px-9">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="grid h-24 w-24 flex-none place-items-center overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-br from-rose-400 to-rose-800 text-3xl font-black text-white shadow-lg">
                {user.avatar_url ? <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : (user.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="pb-1"><h1 className="text-2xl font-black text-gray-950">{user.name || "VizhaOne User"}</h1><p className="mt-1 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">{roleLabel}</p></div>
            </div>
            <button onClick={logout} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-black text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4"/>Sign out</button>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Info icon={Mail} label="Email" value={user.email || "Connected account"}/><Info icon={Phone} label="Phone" value={user.mobile || user.phone || "Not added"}/><Info icon={MapPin} label="Location" value={user.location || "Not added"}/>
          </div>
        </div>
      </div>

      {isProvider ? <section className="mt-6 rounded-[28px] border border-rose-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-rose-600">Provider workspace</p><h2 className="mt-1 text-2xl font-black">Your business & services</h2></div><Link to="/vendor-onboarding" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-black text-white"><Store className="h-4 w-4"/>Add service</Link></div>
        {providerLoading ? <div className="grid h-28 place-items-center"><Loader2 className="animate-spin text-rose-600"/></div> : <>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-rose-50 p-4"><BriefcaseBusiness className="h-6 w-6 text-rose-700"/><div className="flex-1"><p className="font-black">{provider?.vendor?.business_name || "Complete your business profile"}</p><p className="text-xs text-gray-500">{provider?.services?.length || 0} service(s) published</p></div>{provider?.vendor?.verified && <span className="flex items-center gap-1 text-xs font-black text-emerald-700"><ShieldCheck className="h-4 w-4"/>Verified</span>}</div>
          <div className="mt-4 grid gap-3">{provider?.services?.map(service => <Link key={service.id} to={`/services/${service.id}`} className="flex items-center justify-between rounded-2xl border p-4 hover:border-rose-300"><span className="font-bold">{service.title}</span><span className="text-xs font-black capitalize text-rose-700">{service.verificationStatus || "unverified"}</span></Link>)}{!provider?.services?.length && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-gray-500">No services added yet. Add your first service to appear in Explore.</p>}</div>
        </>}
      </section> : <section className="mt-6 grid gap-4 sm:grid-cols-2"><Link to="/bookings" className="rounded-[24px] border border-rose-100 bg-white p-6 shadow-sm hover:border-rose-300"><CalendarCheck className="h-7 w-7 text-rose-600"/><h2 className="mt-4 text-lg font-black">My bookings</h2><p className="mt-1 text-sm text-gray-500">View your booking requests and current status.</p></Link><Link to="/services" className="rounded-[24px] border border-rose-100 bg-white p-6 shadow-sm hover:border-rose-300"><UserRound className="h-7 w-7 text-rose-600"/><h2 className="mt-4 text-lg font-black">Explore services</h2><p className="mt-1 text-sm text-gray-500">Find trusted professionals for your celebration.</p></Link></section>}
    </section>
  </main>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><Icon className="h-5 w-5 text-rose-600"/><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="truncate text-sm font-bold text-gray-800">{value}</p></div></div>; }
