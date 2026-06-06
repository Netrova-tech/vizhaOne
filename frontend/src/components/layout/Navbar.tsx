"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import type { Language } from "@/types";
import {
  X, LogOut, ChevronDown, Info,
  ShoppingBag, Calculator, LayoutDashboard,
  UserCircle2, Sparkles, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VizhaLogo } from "@/components/ui/VizhaLogo";

export const NAVBAR_HEIGHT = 68;

const navLinks = [
  { href: "/",           labelKey: "home",      label: "Home"     },
  { href: "/halls",      labelKey: "halls",      label: "Halls"    },
  { href: "/services",   labelKey: "services",   label: "Services" },
  { href: "/calculator", labelKey: "calculator", label: "Plan"     },
];



export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const { pathname } = useLocation();
  const navigate  = useNavigate();
  const dropRef   = useRef<HTMLDivElement>(null);
  const langRef   = useRef<HTMLDivElement>(null);

  const [scrolled,        setScrolled]        = useState(false);
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [desktopLangOpen, setDesktopLangOpen] = useState(false);



  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current  && !dropRef.current.contains(e.target as Node))  setProfileOpen(false);
      if (langRef.current  && !langRef.current.contains(e.target as Node))  setDesktopLangOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const langLabel = lang === "en" ? "EN" : lang === "ta" ? "த" : lang === "hi" ? "हि" : lang === "ml" ? "മ" : "తె";

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg transition-all duration-300 border-b border-transparent",
        scrolled && "shadow-[0_4px_20px_rgba(225,29,72,0.08)] border-b border-rose-100/80"
      )}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-2 py-2.5">

            {/* Logo */}
            <Link to="/" className="justify-self-start hover:opacity-90 transition-opacity">
              <VizhaLogo size="sm" />
            </Link>

            {/* Desktop nav — centered pill bar */}
            <nav className="hidden md:flex items-center justify-self-center bg-rose-50/60 border border-rose-100/80 rounded-full px-1.5 py-1 gap-0.5 shadow-sm">
              {navLinks.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} to={link.href}
                    className={cn(
                      "relative px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] transition-all whitespace-nowrap",
                      active
                        ? "text-white bg-gradient-to-r from-[#e11d48] to-[#db2777] shadow-sm"
                        : "text-[#881337]/75 hover:text-[#e11d48] hover:bg-white/70"
                    )}>
                    {t(link.labelKey as Parameters<typeof t>[0])}
                  </Link>
                );
              })}
              <div ref={langRef} className="relative ml-0.5"
                onMouseEnter={() => setDesktopLangOpen(true)}
                onMouseLeave={() => setDesktopLangOpen(false)}
              >
                <button
                  onClick={() => { setDesktopLangOpen(!desktopLangOpen); setProfileOpen(false); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] text-[#881337]/75 hover:text-[#e11d48] hover:bg-white/70 transition-all"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {langLabel}
                </button>
                <AnimatePresence>
                  {desktopLangOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-rose-100 overflow-hidden z-50 min-w-[140px]"
                    >
                      {[
                        { code: "en", label: "🇬🇧 English",  gt: "en" },
                        { code: "ta", label: "🇮🇳 தமிழ்",    gt: "ta" },
                        { code: "hi", label: "🇮🇳 हिन्दी",   gt: "hi" },
                        { code: "ml", label: "🇮🇳 മലയാളം",  gt: "ml" },
                        { code: "te", label: "🇮🇳 తెలుగు",   gt: "te" },
                      ].map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setLang(l.code as Language);
                            setDesktopLangOpen(false);
                            if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).__vizha_translate) {
                              (window as unknown as Record<string, (lang: string) => void>).__vizha_translate(l.gt);
                            }
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-rose-50 hover:text-rose-700 transition-colors ${lang === l.code ? "bg-rose-50 text-rose-700" : "text-gray-700"}`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Desktop utilities */}
            <div className="hidden md:flex items-center gap-2 justify-self-end">


              {user && isAdmin ? (
                <div className="flex items-center gap-3">
                  <div ref={dropRef} className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={cn(
                        "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-200",
                        profileOpen
                          ? "bg-rose-50 border-[#e11d48]/25 shadow-sm"
                          : "bg-white border-rose-100 hover:border-rose-200 hover:bg-rose-50/40"
                      )}
                    >
                      <Link to="/profile" onClick={(e) => e.stopPropagation()}>
                        <div className={cn(
                          "h-9 w-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-700 flex items-center justify-center ring-2 ring-offset-1 transition-all shadow-md",
                          pathname === "/profile" ? "ring-rose-500" : "ring-transparent"
                        )}>
                          {user.avatar_url
                            ? <img src={user.avatar_url} alt="av" className="h-9 w-9 rounded-xl object-cover" />
                            : <span className="text-white text-sm font-bold">{(user.name || user.mobile || "U").charAt(0).toUpperCase()}</span>
                          }
                        </div>
                      </Link>
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-800 leading-none truncate max-w-[72px]">
                          {user.name || "User"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          👑 Admin
                        </p>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200 ml-0.5", profileOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15, type: "spring", bounce: 0.1 }}
                          className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl shadow-rose-100/80 border border-rose-100 overflow-hidden z-50"
                        >
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-rose-50 to-rose-50 border-b border-rose-100">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-700 flex items-center justify-center shadow-md flex-shrink-0">
                              {user.avatar_url
                                ? <img src={user.avatar_url} alt="av" className="h-11 w-11 rounded-2xl object-cover" />
                                : <span className="text-white text-base font-extrabold">{(user.name || user.mobile || "U").charAt(0).toUpperCase()}</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{user.name || "User"}</p>
                              <p className="text-xs text-gray-500 truncate">{user.mobile}</p>
                            </div>
                          </div>

                          <div className="p-2 space-y-0.5">
                            {[
                              { href: "/about",     icon: Info,           label: "About Us"      },
                              { href: "/calculator",icon: Calculator,     label: "Event Planner" },
                              { href: "/admin",      icon: LayoutDashboard,label: "Dashboard"     },
                            ].map((item) => (
                              <Link key={item.href} to={item.href}
                                onClick={() => setProfileOpen(false)}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                                  pathname === item.href || pathname.startsWith(item.href + "/")
                                    ? "bg-rose-50 text-rose-700"
                                    : "text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                                )}>
                                <item.icon className="h-4 w-4" />
                                {item.label}
                              </Link>
                            ))}
                          </div>
                          <div className="p-2 border-t border-rose-50">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="h-4 w-4" strokeWidth={2.5} />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-rose-100/80 shadow-sm cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>

            {/* Mobile utilities */}
            <div className="md:hidden flex items-center gap-2 justify-self-end">

              {/* Profile icon */}
              {user && isAdmin && (
                <>
                  <Link to="/admin"
                    className={cn(
                      "relative flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200 shadow-sm",
                      pathname === "/admin" ? "ring-2 ring-rose-500 ring-offset-1" : ""
                    )}
                    aria-label="Admin dashboard"
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-700 flex items-center justify-center shadow-md">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt="avatar" className="h-9 w-9 rounded-xl object-cover" />
                        : <span className="text-white text-sm font-bold leading-none">{(user.name || user.mobile || "U").charAt(0).toUpperCase()}</span>
                      }
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center shadow-sm active:scale-95"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Full-width double line — luxury header separator */}
        <div className="w-full" aria-hidden>
          <div className="h-px bg-gradient-to-r from-transparent via-[#e11d48]/25 to-transparent" />
          <div className="h-[3px] bg-gradient-to-r from-[#db2777] via-[#e11d48] to-[#db2777]" />
        </div>


      </nav>
      <div className="h-[68px]" />
    </>
  );
}
