"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

const DEMO_OTP = "123456";
const ADMIN_MOBILE = "9999999999";

function VerifyContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobile = searchParams.get("mobile") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [imgFailed, setImgFailed] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  async function trackSignup(mobileNum: string) {
    try {
      // Save to localStorage for admin panel (works always)
      const existing = JSON.parse(localStorage.getItem("vizha_signups") || "[]");
      const already = existing.find((u: { mobile: string }) => u.mobile === `+91${mobileNum}`);
      if (!already) {
        existing.unshift({ mobile: `+91${mobileNum}`, joinedAt: new Date().toISOString() });
        localStorage.setItem("vizha_signups", JSON.stringify(existing.slice(0, 500)));
      }
      // Send to server (Google Sheets + Telegram if configured)
      await fetch("/api/track-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: `+91${mobileNum}`, timestamp: new Date().toISOString() }),
      });
    } catch { /* silent — never block login */ }
  }

  async function handleVerify(e: React.SyntheticEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter 6-digit OTP"); return; }
    setLoading(true);

    if (!isSupabaseConfigured) {
      if (code === DEMO_OTP) {
        const isAdmin = mobile === ADMIN_MOBILE;
        localStorage.setItem("vizha_demo_user", JSON.stringify({
          id: "demo-" + mobile, role: isAdmin ? "admin" : "user",
          mobile: `+91${mobile}`, name: isAdmin ? "Admin User" : "Demo User",
        }));
        window.dispatchEvent(new Event("vizha_auth_change"));
        if (!isAdmin) await trackSignup(mobile);
        toast.success("Welcome to VizhaOne! 🎊");
        navigate(isAdmin ? "/admin" : "/");
      } else {
        toast.error("Wrong OTP. Demo OTP is 123456");
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${mobile}`, token: code, type: "sms" });
      if (error) throw error;
      if (data.user) {
        const role = mobile === ADMIN_MOBILE ? "admin" : "user";
        await supabase.from("users").upsert({ id: data.user.id, mobile: `+91${mobile}`, role }, { onConflict: "id" });
      }
      if (mobile !== ADMIN_MOBILE) await trackSignup(mobile);
      toast.success("Welcome to VizhaOne! 🎊");
      navigate(mobile === ADMIN_MOBILE ? "/admin" : "/");
    } catch {
      if (code === DEMO_OTP) {
        const isAdmin = mobile === ADMIN_MOBILE;
        localStorage.setItem("vizha_demo_user", JSON.stringify({
          id: "demo-" + mobile, role: isAdmin ? "admin" : "user",
          mobile: `+91${mobile}`, name: isAdmin ? "Admin User" : "Demo User",
        }));
        window.dispatchEvent(new Event("vizha_auth_change"));
        if (!isAdmin) await trackSignup(mobile);
        toast.success("Welcome to VizhaOne! 🎊");
        navigate(isAdmin ? "/admin" : "/");
      } else {
        toast.error("Wrong OTP. Demo OTP is 123456");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendTimer(30);
    if (!isSupabaseConfigured) { toast.info("Demo: OTP is 123456"); return; }
    try { await supabase.auth.signInWithOtp({ phone: `+91${mobile}` }); toast.success("OTP resent!"); }
    catch { toast.info("Demo: OTP is 123456"); }
  }

  const filled = otp.join("").length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ═══ LEFT — Light gradient panel ═══ */}
      <div
        className="lg:w-1/2 relative flex flex-col items-center justify-center overflow-hidden min-h-[40vh] lg:min-h-screen"
        style={{ background: "linear-gradient(145deg,#fff7ed 0%,#fef3c7 25%,#fce7f3 60%,#ede9fe 100%)" }}
      >
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full blur-3xl opacity-60 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fdba74,transparent)" }} />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle,#f97316,transparent)" }} />
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle,#7c3aed 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg,#f97316,#fbbf24,#ec4899,#a855f7,#6366f1)" }} />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col items-center text-center px-10 py-10"
        >


          {/* Brand */}
          <div className="flex items-baseline gap-0.5 mb-1">
            <span className="font-extrabold text-4xl"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Vizha</span>
            <span className="font-extrabold text-4xl"
              style={{ background: "linear-gradient(135deg,#ec4899,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One</span>
            <span className="text-amber-500 text-xl ml-1">✦</span>
          </div>
          <p className="text-gray-500 text-sm mb-8">One Platform for Every Celebration</p>

          {/* OTP status card */}
          <div className="w-full max-w-xs rounded-2xl p-5 shadow-sm"
            style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.9)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-gray-800 text-sm font-bold">OTP Sent Successfully</p>
                <p className="text-gray-400 text-xs">Code sent to +91 {mobile}</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5">
              {otp.map((d, i) => (
                <motion.div key={i} className="flex-1 h-2 rounded-full"
                  animate={{ background: d ? "linear-gradient(90deg,#f97316,#ec4899)" : "#e5e7eb" }}
                  transition={{ duration: 0.2 }} />
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-2 text-right">{filled} of 6 entered</p>
          </div>
        </motion.div>
      </div>

      {/* ═══ RIGHT — White form panel ═══ */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 py-12 lg:py-16 bg-white lg:bg-[#fbfbfb] relative min-h-[60vh] lg:min-h-screen">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full blur-3xl opacity-15 -translate-y-1/2 translate-x-1/2 pointer-events-none"
          style={{ background: "radial-gradient(circle,#f97316,transparent)" }} />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{ background: "radial-gradient(circle,#a855f7,transparent)" }} />
        <div className="absolute top-0 left-0 right-0 h-0.5 lg:hidden"
          style={{ background: "linear-gradient(90deg,#f97316,#fbbf24,#ec4899,#a855f7)" }} />

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 w-full max-w-sm lg:max-w-md lg:p-10 lg:bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-[0_20px_50px_rgba(0,0,0,0.04)]"
        >
          {/* Back */}
          <Link to="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8">
            <div className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back to login
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Enter OTP 🔐</h1>
            <p className="text-gray-500 text-sm">
              6-digit code sent to{" "}
              <span className="font-bold text-orange-500">+91 {mobile}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {/* OTP inputs */}
            <div className="flex gap-2.5 justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  className="h-14 w-11 lg:h-16 lg:w-14 text-center text-xl lg:text-2xl font-extrabold rounded-2xl border-2 focus:outline-none transition-all"
                  style={{
                    background: digit ? "#fff7ed" : "#f9fafb",
                    borderColor: digit ? "#f97316" : "#e5e7eb",
                    color: digit ? "#ea580c" : "#374151",
                    boxShadow: digit ? "0 0 0 4px rgba(249,115,22,0.1), 0 4px 12px rgba(249,115,22,0.15)" : "none",
                  }}
                />
              ))}
            </div>

            {/* Gradient progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#f97316,#fbbf24,#ec4899,#a855f7)" }}
                animate={{ width: `${(filled / 6) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || filled !== 6}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-extrabold text-base text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: filled === 6 && !loading
                  ? "linear-gradient(135deg,#f97316,#fbbf24 40%,#ec4899 80%,#a855f7)"
                  : "#f3f4f6",
                color: filled === 6 && !loading ? "white" : "#9ca3af",
                boxShadow: filled === 6 ? "0 8px 32px rgba(249,115,22,0.3), 0 2px 8px rgba(168,85,247,0.2)" : "none",
              }}
            >
              {loading
                ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : "Verify & Sign In ✓"
              }
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-5">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-400">
                Resend in <span className="font-bold text-orange-500">{resendTimer}s</span>
              </p>
            ) : (
              <button onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                <RefreshCw className="h-4 w-4" /> Resend OTP
              </button>
            )}
          </div>

          {/* Demo hint */}
          <div className="mt-5 p-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg,#fffbeb,#fff7ed)", border: "1px solid #fde68a" }}>
            <p className="text-amber-700 font-bold text-xs mb-1">✨ Demo Mode</p>
            <p className="text-amber-600 text-xs">
              OTP: <strong className="text-amber-800 text-base font-extrabold">123456</strong>
              <span className="mx-2 text-amber-300">|</span>
              Admin: <strong className="text-amber-800">9999999999</strong>
            </p>
          </div>

          <p className="text-center text-xs text-gray-300 mt-5">🪔 Made with love for Tamil Nadu families</p>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(145deg,#fff7ed,#fce7f3)" }}>
        <div className="h-12 w-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
