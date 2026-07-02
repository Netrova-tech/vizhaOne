"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/utils";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingText, setLoadingText] = useState("Entering VizhaOne...");

  const adminUser = {
    id: "demo-9999999999",
    role: "admin" as const,
    mobile: "+919999999999",
    name: "Admin User",
  };

  async function enterAdmin(user = adminUser) {
    localStorage.setItem("vizha_demo_user", JSON.stringify(user));
    window.dispatchEvent(new Event("vizha_auth_change"));
    toast.success("Welcome back, Admin! 👑");
    window.location.assign("/admin");
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");

    if (roleParam === "admin") {
      setIsAdminLogin(true);
    } else {
      setLoadingText("Entering VizhaOne...");
      const existing = localStorage.getItem("vizha_demo_user");
      if (!existing) {
        const demoUser = {
          id: "demo-user",
          role: "user",
          mobile: "+919999999999",
          name: "Demo User",
        };
        localStorage.setItem("vizha_demo_user", JSON.stringify(demoUser));
        window.dispatchEvent(new Event("vizha_auth_change"));
      }

      // Auto-redirect guest user after 3 seconds
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [navigate]);

  async function handleAdminPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/auth/admin-pin"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Invalid secret key");
      }

      if (!result?.user) {
        throw new Error("Admin login failed. Please check backend is running on port 5000.");
      }

      await enterAdmin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
      toast.error(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: "linear-gradient(135deg,#fff7ed 0%,#fef3c7 30%,#fce7f3 65%,#ede9fe 100%)" }}
    >
      {/* Soft blobs */}
      <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full blur-3xl opacity-50 pointer-events-none"
        style={{ background: "radial-gradient(circle,#fdba74,transparent)" }} />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle,#f97316,transparent)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle,#c4b5fd,transparent)" }} />

      {/* Rainbow top border */}
      <div className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: "linear-gradient(90deg,#f97316,#fbbf24,#ec4899,#a855f7,#6366f1)" }} />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle,#7c3aed 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-md mx-4 p-8 bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl flex flex-col items-center text-center"
      >
        {/* Brand */}
        <div className="flex items-baseline gap-0.5 mb-2">
          <span className="font-extrabold text-4xl leading-none tracking-tight font-display"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Vizha
          </span>
          <span className="font-extrabold text-4xl leading-none tracking-tight font-display"
            style={{ background: "linear-gradient(135deg,#ec4899,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            One
          </span>
          <span className="text-amber-500 text-2xl ml-1">✦</span>
        </div>
        <p className="text-gray-400 text-xs font-semibold mb-6">One Platform for Every Celebration 🎊</p>

        {isAdminLogin ? (
          <div className="w-full">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-[#e11d48] border border-rose-100 shadow-inner">
              <Lock className="h-7 w-7 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">Admin Access</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your secret PIN to verify admin credentials</p>

            <form onSubmit={handleAdminPinSubmit} className="space-y-4">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                type="password"
                required
                placeholder="••••••"
                autoFocus
                className="h-14 w-full rounded-2xl border-2 border-rose-100 bg-gray-50/50 px-5 text-center text-2xl font-extrabold tracking-[0.2em] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-[#e11d48] focus:bg-white"
              />
              {error && (
                <p className="text-xs font-semibold text-red-500">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !pin.trim()}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e11d48] to-[#be123c] text-base font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Verify & Enter
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 flex justify-center">
              <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#e11d48] transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="font-bold text-lg text-gray-800 mb-1">Welcome to VizhaOne! 🎊</p>
            <p className="text-xs text-gray-400 font-medium">Loading your session...</p>
            
            {/* Loading progress indicator */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="h-1.5 w-40 bg-gray-200/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#f97316,#ec4899)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </div>
              <p className="text-[10px] text-orange-400/80 font-bold tracking-wider uppercase animate-pulse">{loadingText}</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
