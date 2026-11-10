"use client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Calculator,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Gift,
  Heart,
  Info,
  Languages,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  Sparkles,
  ShoppingBag,
  UserRound,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";
import { VizhaLogo } from "@/components/ui/VizhaLogo";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/context/LanguageContext";
import type { Language } from "@/types";
const links = [
  ["About VizhaOne", "/about", Info],
  ["Celebration Planner", "/planner", CalendarCheck],
  ["Checklist & Reminders", "/planner/checklist", ClipboardCheck],
  ["Smart Budget", "/planner/budget", Calculator],
  ["Guest Circle", "/planner/guests", UsersRound],
  ["My Bookings", "/bookings", CalendarDays],
  ["Saved", "/saved", Heart],
  ["Hashtag Generator", "/tools/hashtag-generator", Sparkles],
  ["Invitation Maker", "/invitations", WandSparkles],
  ["Referral Rewards", "/referrals", Gift],
  ["Add Your Service", "/vendor-onboarding", PlusCircle],
] as const;
export function MobileAppHeader() {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const { lang, setLang } = useLang();
  const isProvider = user?.role === "service_provider";
  const languages: { code: Language; label: string; short: string }[] = [
    { code: "en", label: "English", short: "EN" },
    { code: "ta", label: "Tamil", short: "தமிழ்" },
    { code: "hi", label: "Hindi", short: "हिंदी" },
    { code: "ml", label: "Malayalam", short: "മലയാളം" },
    { code: "te", label: "Telugu", short: "తెలుగు" },
  ];
  function changeLanguage(code:Language){setLang(code);setLanguageOpen(false)}
  function go(href: string) { setOpen(false); window.setTimeout(() => navigate(href), 0); }
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-rose-100 bg-white/95 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-xl">
        <div className="grid h-[76px] grid-cols-[48px_1fr_auto] items-center px-4">
          <button
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" aria-label="VizhaOne home" className="min-w-0 justify-self-center text-center">
            <VizhaLogo size="md" className="origin-center scale-[1.06]" />
          </Link>
          <div className="relative flex items-center gap-1.5"><button type="button" onClick={()=>setLanguageOpen(value=>!value)} aria-label="Change language" className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-800"><Languages className="h-5 w-5"/><span className="absolute -bottom-0.5 text-[7px] font-black">{lang.toUpperCase()}</span></button><Link
            to="/cart"
            aria-label={`Cart with ${count} items`}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 text-white shadow-lg shadow-rose-200"
          >
            <ShoppingBag className="h-5 w-5"/>
            {count>0&&<span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-gray-950 px-1 text-[9px] font-black text-white">{count>99?"99+":count}</span>}
          </Link>{languageOpen&&<div className="absolute right-0 top-14 z-[110] w-56 overflow-hidden rounded-3xl border border-rose-100 bg-white p-2 shadow-2xl"><div className="flex items-center justify-between px-2 pb-2 pt-1"><div><p className="text-xs font-black text-gray-950">Choose language</p><p className="text-[9px] text-gray-400">Translate the complete app</p></div><button type="button" onClick={()=>setLanguageOpen(false)} aria-label="Close language menu" className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700"><X className="h-4 w-4"/></button></div>{languages.map(item=><button type="button" key={item.code} onClick={()=>changeLanguage(item.code)} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-xs font-black ${lang===item.code?"bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm":"text-gray-800 active:bg-rose-50"}`}><span>{item.label}</span><span className={`rounded-full px-2 py-1 text-[9px] ${lang===item.code?"bg-white/20":"bg-rose-50 text-rose-700"}`}>{item.short}</span></button>)}</div>}</div>
        </div>
      </header>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-[86vw] max-w-[350px] flex-col bg-white pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-100 px-5 py-5">
              <VizhaLogo size="sm" />
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-gray-100 bg-gradient-to-br from-rose-50 to-orange-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 font-black text-white">
                  {user?.avatar_url?<img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover"/>:(user?.name || "V")[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {user?.name || "VizhaOne User"}
                  </p>
                  <p className="truncate text-[10px] text-gray-500">
                    {user?.email || user?.mobile || "Welcome back"}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-rose-600 shadow-sm">
                    {isProvider ? "Service provider" : "Customer"}
                  </span>
                </div>
              </div>
              {user?.location && (
                <p className="mt-3 flex items-center gap-1.5 truncate text-[10px] text-gray-500">
                  <MapPin className="h-3 w-3 text-rose-500" />
                  {user.location}
                </p>
              )}
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {isProvider && (
                <Link
                  to="/provider-dashboard"
                  onClick={() => setOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-2xl bg-rose-600 px-3 py-3.5 text-sm font-bold text-white"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </span>
                  Provider Dashboard
                </Link>
              )}
              {links.map(([label, href, Icon]) => (
                <button
                  type="button"
                  key={href}
                  onClick={() => go(href)}
                  className="flex w-full touch-manipulation items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-sm font-bold text-gray-700 active:bg-rose-50"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </button>
              ))}
            </nav>
            <div className="border-t p-4">
              <button
                onClick={() => void signOut()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 py-3.5 text-sm font-black text-rose-600"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
