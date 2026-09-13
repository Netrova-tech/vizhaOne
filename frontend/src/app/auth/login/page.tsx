"use client";

import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, MapPin, ShieldCheck, Store, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { VizhaLogo } from "@/components/ui/VizhaLogo";
import { completeGoogleWebProfile, loginWebAccount, saveWebSession, startGoogleWebSignIn, type WebRole } from "@/lib/webAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [profile, setProfile] = useState({ name: "", phone: "", location: "", role: "customer" as WebRole });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdminLogin(params.get("role") === "admin");
    if (localStorage.getItem("vizha_demo_user") && params.get("role") !== "admin") navigate("/", { replace: true });
  }, [navigate]);

  function enter(user: Parameters<typeof saveWebSession>[0], token?: string) {
    saveWebSession(user, token);
    toast.success(`Welcome, ${user.name || "VizhaOne user"}!`);
    navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { const result = await loginWebAccount(email.trim().toLowerCase(), password); enter(result.user, result.token); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Sign in failed"); }
    finally { setBusy(false); }
  }

  async function googleSignIn() {
    setGoogleBusy(true);
    try {
      const result = await startGoogleWebSignIn();
      if (result.user) return enter(result.user, result.token);
      setGoogleToken(result.idToken);
      setProfile((current) => ({ ...current, name: result.profile?.name || "" }));
      toast.success("Google account verified. Complete your profile.");
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      const fallback = error instanceof Error ? error.message : "Google sign-in failed";
      const message = code === "auth/unauthorized-domain"
        ? "Google Sign-In is not enabled for this website domain yet. Please contact VizhaOne support."
        : code === "auth/operation-not-allowed"
          ? "Google Sign-In is temporarily unavailable. Please use email sign-in."
          : code === "auth/popup-blocked"
            ? "Your browser blocked the Google sign-in window. Allow pop-ups for VizhaOne and try again."
            : fallback;
      if (!/popup.closed|cancel/i.test(message)) toast.error(message);
    } finally { setGoogleBusy(false); }
  }

  async function completeProfile(event: FormEvent) {
    event.preventDefault(); setGoogleBusy(true);
    try { const result = await completeGoogleWebProfile(googleToken, profile); enter(result.user, result.token); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Profile creation failed"); }
    finally { setGoogleBusy(false); }
  }

  return <main className="min-h-screen bg-[#fff9f7] lg:grid lg:grid-cols-[minmax(0,1.36fr)_minmax(430px,.64fr)]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#5d092f] lg:block">
      <img src="/vizhaone-website-auth-concept.png" alt="VizhaOne connects customers with venues and event professionals" className="absolute inset-0 h-full w-full origin-left scale-[1.28] object-cover object-left" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#4a0628]/20 via-transparent to-[#4a0628]/45" />
      <Link to="/" aria-label="Back to VizhaOne home" className="absolute left-8 top-7 rounded-2xl bg-white/92 px-5 py-3 shadow-xl backdrop-blur"><VizhaLogo size="md" /></Link>
      <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between rounded-2xl border border-white/20 bg-[#4f082b]/85 px-6 py-4 text-white shadow-2xl backdrop-blur-md">
        <div><p className="text-[10px] font-black uppercase tracking-[.24em] text-rose-200">VizhaOne celebration marketplace</p><p className="mt-1 text-lg font-black">Customers and vendors, connected.</p></div>
        <div className="flex gap-5 text-xs font-bold"><span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-300"/>Verified vendors</span><span className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-amber-300"/>All events in one place</span></div>
      </div>
    </section>

    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-10">
      <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="relative w-full max-w-[470px] rounded-[32px] border border-white bg-white/95 p-6 shadow-[0_30px_90px_rgba(91,11,53,.16)] sm:p-9">
        <div className="mb-7 text-center lg:hidden"><VizhaLogo size="lg" /></div>
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-rose-700"><ArrowLeft className="h-4 w-4"/>Home</Link>
        <p className="text-[10px] font-black uppercase tracking-[.26em] text-[#a96b35]">Welcome to VizhaOne</p>
        <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-[#2f1027]">{isAdminLogin ? "Secure admin sign in" : "Sign in to your account"}</h1>
        <p className="mt-2 text-sm text-gray-500">Plan, connect and celebrate—all in one trusted place.</p>

        {!isAdminLogin && <button type="button" disabled={googleBusy} onClick={googleSignIn} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-sm font-black text-gray-800 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-60"><span className="text-xl font-black text-[#4285f4]">G</span>{googleBusy ? <><Loader2 className="h-4 w-4 animate-spin"/>Connecting securely...</> : "Continue with Google"}</button>}
        {!isAdminLogin && <div className="my-5 flex items-center gap-3 text-[9px] font-black uppercase tracking-[.2em] text-gray-400"><span className="h-px flex-1 bg-gray-200"/>or continue with email<span className="h-px flex-1 bg-gray-200"/></div>}

        <form onSubmit={submit} className={isAdminLogin ? "mt-7 space-y-4" : "space-y-4"}>
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">Email address<span className="mt-2 flex min-h-14 items-center rounded-2xl border border-gray-200 bg-white px-4 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100"><Mail className="h-4 w-4 text-rose-600"/><input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent px-3 outline-none"/></span></label>
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">Password<span className="mt-2 flex min-h-14 items-center rounded-2xl border border-gray-200 bg-white px-4 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100"><LockKeyhole className="h-4 w-4 text-rose-600"/><input required minLength={isAdminLogin ? 4 : 8} type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" placeholder="Enter your password" className="min-w-0 flex-1 bg-transparent px-3 outline-none"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="p-2 text-gray-400">{showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}</button></span></label>
          {!isAdminLogin && <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 font-semibold text-gray-500"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="accent-rose-700"/>Remember me</label><Link to="/auth/forgot-password" className="font-black text-rose-700">Forgot password?</Link></div>}
          <button disabled={busy} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7a123f] to-[#bd185b] text-sm font-black text-white shadow-lg shadow-rose-200 disabled:opacity-60">{busy ? <><Loader2 className="h-4 w-4 animate-spin"/>Signing in...</> : <>Sign in <ArrowRight className="h-4 w-4"/></>}</button>
        </form>

        {!isAdminLogin && <><p className="mt-5 text-center text-sm text-gray-500">New to VizhaOne? <Link to="/auth/sign-up" className="font-black text-rose-700">Create an account</Link></p><Link to="/vendor-onboarding" className="mt-6 flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-[#681137]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow"><Store className="h-5 w-5"/></span><span className="flex-1"><strong className="block text-sm">Are you a vendor?</strong><small className="text-[10px] text-gray-500">List your business and reach more customers.</small></span><ArrowRight className="h-4 w-4"/></Link></>}
      </div>
    </section>

    {googleToken && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><form onSubmit={completeProfile} className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-[#fffaf7] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-rose-600">One last step</p><h2 className="mt-1 text-2xl font-black text-[#321322]">Complete your profile</h2></div><button type="button" onClick={()=>setGoogleToken("")} className="rounded-full bg-gray-100 p-2"><X className="h-5 w-5"/></button></div><div className="mt-5 space-y-4"><input required minLength={3} value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} placeholder="Full name" className="min-h-13 w-full rounded-xl border px-4"/><input required value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="Phone number" className="min-h-13 w-full rounded-xl border px-4"/><label className="flex min-h-13 items-center rounded-xl border bg-white px-4"><MapPin className="h-4 w-4 text-rose-600"/><input required value={profile.location} onChange={e=>setProfile({...profile,location:e.target.value})} placeholder="City or service location" className="min-w-0 flex-1 px-3 outline-none"/></label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setProfile({...profile,role:"customer"})} className={`min-h-13 rounded-xl border text-sm font-black ${profile.role==="customer"?"bg-rose-700 text-white":"bg-white"}`}>Book services</button><button type="button" onClick={()=>setProfile({...profile,role:"service_provider"})} className={`min-h-13 rounded-xl border text-sm font-black ${profile.role==="service_provider"?"bg-rose-700 text-white":"bg-white"}`}>Join as vendor</button></div><button disabled={googleBusy} className="min-h-14 w-full rounded-xl bg-rose-700 font-black text-white">{googleBusy?"Creating profile...":"Continue to VizhaOne"}</button></div></form></div>}
  </main>;
}
