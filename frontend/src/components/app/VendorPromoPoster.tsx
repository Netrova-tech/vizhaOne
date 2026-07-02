"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Camera, MessageCircle, Phone, Sparkles, X } from "lucide-react";

export function VendorPromoPoster() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  function closePoster() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-950/55 px-4 py-6 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-rose-950/30 ring-1 ring-white/60">
        <button
          type="button"
          onClick={closePoster}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-lg shadow-rose-950/10 transition hover:bg-rose-50 hover:text-[#e11d48]"
          aria-label="Close vendor offer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#e11d48] via-[#be123c] to-[#881337] px-6 py-6 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-amber-300/20" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">Vendor launch offer</p>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">Add your service on VizhaOne</h2>
              <p className="mt-1 text-xs font-semibold text-white/75">Start getting direct customer enquiries</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="rounded-[1.75rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#be123c]">Annual listing plan</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <span className="text-6xl font-black leading-none text-gray-950">Rs 365</span>
                  <span className="mb-2 rounded-full bg-[#e11d48] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white shadow-sm">
                    only / year
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-white text-center shadow-sm ring-1 ring-rose-100">
                <span className="text-2xl font-black text-[#e11d48]">365</span>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">days</span>
              </div>
            </div>
            <p className="mt-4 text-sm sm:text-base font-semibold leading-relaxed text-gray-700">
              Add your business profile, service, photos, price, Call & WhatsApp button. Get customer enquiries and orders directly.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              [Camera, "Photos"],
              [Phone, "Call button"],
              [MessageCircle, "WhatsApp"],
              [Sparkles, "Enquiries"],
            ].map(([Icon, label]) => {
              const PromoIcon = Icon as typeof Camera;
              return (
                <div key={label as string} className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm font-bold text-gray-700 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#e11d48] shadow-sm">
                    <PromoIcon className="h-4 w-4" />
                  </span>
                  {label as string}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Link
              to="/partner-plans"
              onClick={closePoster}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e11d48] px-5 py-4 text-base font-black text-white shadow-xl shadow-rose-900/15 transition hover:bg-[#be123c]"
            >
              View Partner Plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
