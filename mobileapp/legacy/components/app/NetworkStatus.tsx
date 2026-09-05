"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export function NetworkStatus(){
  const [online,setOnline]=useState(true);
  const [checking,setChecking]=useState(false);
  useEffect(()=>{const sync=()=>setOnline(navigator.onLine);sync();window.addEventListener("online",sync);window.addEventListener("offline",sync);return()=>{window.removeEventListener("online",sync);window.removeEventListener("offline",sync)}},[]);
  if(online)return null;
  const retry=()=>{setChecking(true);window.setTimeout(()=>{setOnline(navigator.onLine);setChecking(false);if(navigator.onLine)window.location.reload()},350)};
  return <div role="alert" className="fixed inset-x-3 top-[calc(10px+env(safe-area-inset-top,0px))] z-[500] flex items-center gap-3 rounded-2xl bg-gray-950 px-4 py-3 text-white shadow-2xl"><WifiOff className="h-5 w-5 text-amber-300"/><div className="min-w-0 flex-1"><p className="text-xs font-black">You’re offline</p><p className="text-[10px] text-white/65">Saved data remains available. Reconnect and retry.</p></div><button type="button" onClick={retry} disabled={checking} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" aria-label="Retry connection"><RefreshCw className={`h-4 w-4 ${checking?"animate-spin":""}`}/></button></div>;
}
