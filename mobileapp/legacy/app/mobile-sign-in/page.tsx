"use client";

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LocateFixed, LockKeyhole, Mail, ShieldCheck, X } from "lucide-react";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { toast } from "sonner";
import { destination, loginAccount, loginGoogle, startSession, type MobileAccount, type MobileRole } from "@/lib/mobileAuth";

export default function MobileSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googlePhone, setGooglePhone] = useState("");
  const [googleLocation, setGoogleLocation] = useState("");
  const [googleRole, setGoogleRole] = useState<MobileRole>("customer");

  function enter(account: MobileAccount, token?: string) {
    startSession(account, token);
    toast.success(`Welcome, ${account.name}!`);
    navigate(destination(account.role), { replace: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await loginAccount(email.trim().toLowerCase(), password);
      enter(result.user, result.token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setGoogleBusy(true);
    try {
      // The legacy Google account selector is more reliable on Android devices
      // where Credential Manager reports "No credentials available".
      const credential = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false });
      // `credential.idToken` is the Google OAuth token. Our backend verifies a
      // Firebase Auth token, so always request the Firebase session token after
      // the native provider sign-in has completed.
      const { token: idToken } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
      if (!idToken) throw new Error("Google did not return a secure sign-in token");
      const result = await loginGoogle(idToken);
      if (result.user) return enter(result.user, result.token);
      setGoogleToken(idToken);
      setGoogleName(result.profile?.name || credential.user?.displayName || "");
      toast.success("Google account verified. Complete your profile.");
    } catch (error) {
      const message=error instanceof Error?error.message:"Google sign-in failed";
      if(!/cancel/i.test(message)) toast.error(message);
    } finally { setGoogleBusy(false); }
  }

  function detectGoogleLocation(){
    if(!navigator.geolocation)return toast.error("Location is not supported on this device");
    navigator.geolocation.getCurrentPosition(({coords})=>{setGoogleLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);toast.success("Current location detected");},()=>toast.error("Allow location permission or enter your area manually"),{enableHighAccuracy:true,timeout:12000});
  }

  async function completeGoogleProfile(event:FormEvent){
    event.preventDefault();setGoogleBusy(true);
    try{const result=await loginGoogle(googleToken,{name:googleName.trim(),phone:googlePhone.trim(),location:googleLocation.trim(),role:googleRole});if(!result.user)throw new Error("Please complete all profile details");enter(result.user,result.token);}catch(error){toast.error(error instanceof Error?error.message:"Google signup failed");}finally{setGoogleBusy(false)}
  }

  const field = "mt-2 flex min-h-14 items-center rounded-2xl border border-[#e8ddd5] bg-white/85 px-4 shadow-[0_8px_30px_rgba(72,28,45,.05)] transition focus-within:border-[#9b3655] focus-within:ring-4 focus-within:ring-[#9b3655]/10";

  return <main className="auth-luxury-shell relative min-h-dvh overflow-y-auto px-5 pb-[calc(30px+env(safe-area-inset-bottom,0px))] pt-[calc(20px+env(safe-area-inset-top,0px))]">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_5%,rgba(255,226,189,.09),transparent_44%)]" />
    <div className="relative mx-auto flex min-h-[calc(100dvh-50px)] max-w-md flex-col justify-center py-5">
      <header className="mb-7 text-center">
        <div className="mx-auto grid h-[94px] w-[94px] place-items-center overflow-hidden rounded-[30px] border border-white/90 bg-white shadow-[0_20px_52px_rgba(15,0,7,.38),0_0_0_5px_rgba(255,231,198,.08)]"><img src="/icon.png" alt="VizhaOne emblem" className="h-full w-full object-cover" /></div>
        <p className="auth-brand-script mt-4 text-[66px] leading-[.86]">VizhaOne</p>
        <p className="auth-brand-subtitle mt-4 text-[13px]">events <span>&amp;</span> occasions</p>
      </header>
      <section className="rounded-[34px] border border-[#fff8ef]/90 bg-[#fffaf5]/96 p-6 shadow-[0_30px_90px_rgba(15,0,8,.38),0_0_0_1px_rgba(255,238,215,.2)] backdrop-blur-xl">
        <p className="bg-[linear-gradient(90deg,#b37a35,#7b3046)] bg-clip-text text-[10px] font-black uppercase tracking-[.28em] text-transparent">Premium Events</p>
        <h1 className="font-display mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-.03em] text-[#2f1027]">Plan Your Entire Celebration in One Place.</h1>
        <p className="mt-3 text-sm leading-6 text-[#796871]">Sign in to discover trusted professionals, manage every detail and celebrate beautifully.</p>
        <button type="button" disabled={googleBusy} onClick={googleSignIn} className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#dfd6d1] bg-white px-5 text-sm font-black text-[#2f2027] shadow-[0_9px_25px_rgba(55,24,36,.08)] transition active:scale-[.99] disabled:opacity-60">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#eee8e4] bg-white text-lg font-black text-[#4285f4]">G</span>{googleBusy ? "Connecting securely..." : "Continue with Google"}
        </button>
        <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.22em] text-[#aa9aa0]"><span className="h-px flex-1 bg-[#e7ddd8]" />or sign in with email<span className="h-px flex-1 bg-[#e7ddd8]" /></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4a303c]">Email address<span className={field}><Mail className="h-4 w-4 text-[#b00086]" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent px-3 py-3 font-semibold text-[#29151e] outline-none" /></span></label>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4a303c]">Password<span className={field}><LockKeyhole className="h-4 w-4 text-[#b00086]" /><input required minLength={8} type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="min-w-0 flex-1 bg-transparent px-3 py-3 font-semibold text-[#29151e] outline-none" /><button type="button" onClick={() => setShow(!show)} className="grid h-9 w-9 place-items-center text-[#8f7b83]" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
          <button disabled={busy} className="mt-1 min-h-14 w-full rounded-2xl bg-[linear-gradient(115deg,#6e1637,#9f3157_58%,#bd486b)] px-5 text-sm font-black text-white shadow-[0_15px_34px_rgba(73,13,38,.3)] disabled:opacity-60">{busy ? "Opening your account..." : "Sign in to VizhaOne"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-[#806d75]">New to VizhaOne? <Link to="/sign-up" className="font-black text-[#8c294c]">Create an account</Link></p>
        <a href="#/auth/login?role=admin" className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#d8bdc6] bg-[#fff4f6] text-sm font-black text-[#7a2143]"><ShieldCheck className="h-4 w-4" /> Super Admin Login</a>
        <p className="mt-5 flex items-start justify-center gap-2 text-[10px] leading-5 text-[#97858c]"><ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />Secure sign-in powered by VizhaOne.</p>
      </section>
    </div>
    {googleToken && <div className="fixed inset-0 z-[100] flex items-end bg-[#190710]/65 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <form onSubmit={completeGoogleProfile} className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[30px] bg-[#fffaf6] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#a33a5c]">One last step</p><h2 className="mt-1 font-display text-2xl font-semibold text-[#321322]">Complete your VizhaOne profile</h2></div><button type="button" onClick={()=>setGoogleToken("")} aria-label="Close" className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#f3e9e8]"><X className="h-5 w-5" /></button></div>
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-black text-[#4a303c]">Full name<input required minLength={3} value={googleName} onChange={e=>setGoogleName(e.target.value)} className="mt-2 min-h-14 w-full rounded-2xl border border-[#e3d7d1] bg-white px-4 outline-none focus:border-[#9b3655]" /></label>
          <label className="block text-xs font-black text-[#4a303c]">Phone number<input required inputMode="tel" pattern="[+0-9 ]{10,15}" value={googlePhone} onChange={e=>setGooglePhone(e.target.value)} placeholder="+91 98765 43210" className="mt-2 min-h-14 w-full rounded-2xl border border-[#e3d7d1] bg-white px-4 outline-none focus:border-[#9b3655]" /></label>
          <label className="block text-xs font-black text-[#4a303c]">Location<div className="mt-2 flex gap-2"><input required value={googleLocation} onChange={e=>setGoogleLocation(e.target.value)} placeholder="City, area or current location" className="min-h-14 min-w-0 flex-1 rounded-2xl border border-[#e3d7d1] bg-white px-4 outline-none focus:border-[#9b3655]" /><button type="button" onClick={detectGoogleLocation} aria-label="Detect current location" className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-[#f6e7eb] text-[#9b3655]"><LocateFixed className="h-5 w-5" /></button></div></label>
          <fieldset><legend className="text-xs font-black text-[#4a303c]">I want to</legend><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setGoogleRole("customer")} className={`min-h-14 rounded-2xl border px-3 text-sm font-black ${googleRole==="customer"?"border-[#922c50] bg-[#922c50] text-white":"border-[#e3d7d1] bg-white text-[#553943]"}`}>Book services</button><button type="button" onClick={()=>setGoogleRole("service_provider")} className={`min-h-14 rounded-2xl border px-3 text-sm font-black ${googleRole==="service_provider"?"border-[#922c50] bg-[#922c50] text-white":"border-[#e3d7d1] bg-white text-[#553943]"}`}>Register as vendor</button></div></fieldset>
          <p className="text-[11px] leading-5 text-[#86747b]">By continuing, you agree to VizhaOne Terms and Privacy Policy.</p>
          <button disabled={googleBusy} className="min-h-14 w-full rounded-2xl bg-[linear-gradient(115deg,#6e1637,#bd486b)] text-sm font-black text-white disabled:opacity-60">{googleBusy?"Creating your profile...":"Continue to VizhaOne"}</button>
        </div>
      </form>
    </div>}
  </main>;
}
