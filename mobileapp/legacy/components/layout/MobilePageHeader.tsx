"use client";

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MobilePageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  return <header className="sticky top-0 z-30 border-b border-rose-100 bg-white/95 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top,0px))] backdrop-blur-xl">
    <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-700" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-xl font-black tracking-tight text-gray-900">{title}</h1>{subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}</div></div>
  </header>;
}
