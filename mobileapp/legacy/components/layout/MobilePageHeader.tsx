"use client";

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MobilePageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  const goBack = () => window.history.length > 1 ? navigate(-1) : navigate("/", { replace: true });
  return <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-[#3d0825] via-[#5b0b35] to-[#3d0825] px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top,0px))] text-white shadow-[0_7px_24px_rgba(61,8,37,.22)] backdrop-blur-xl">
    <div className="flex items-center gap-3"><button type="button" onClick={goBack} className="grid h-10 w-10 place-items-center rounded-xl bg-white/12 text-white active:scale-95" aria-label="Go back"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0"><h1 className="truncate text-xl font-black tracking-tight text-white">{title}</h1>{subtitle && <p className="truncate text-xs text-white/65">{subtitle}</p>}</div></div>
  </header>;
}
