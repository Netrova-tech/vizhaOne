import { Download, Smartphone } from "lucide-react";
import { useLocation } from "react-router-dom";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.vizhaone.app";

export function InstallAppCta(){
  const {pathname}=useLocation();
  if(pathname.startsWith("/admin")||pathname.startsWith("/auth")||pathname.startsWith("/invite/"))return null;
  return <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Install VizhaOne from Google Play" className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-rose-200 bg-white px-3 py-3 text-[#881337] shadow-[0_12px_35px_rgba(136,19,55,.22)] transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-200"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#881337] to-[#e11d48] text-white"><Smartphone className="h-4 w-4"/></span><span className="hidden text-left sm:block"><strong className="block text-xs font-black">Install VizhaOne</strong><small className="flex items-center gap-1 text-[9px] font-bold text-gray-500"><Download className="h-3 w-3"/>Get it on Google Play</small></span></a>;
}
