"use client";

import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { destination, findAccount, loginAccount, startSession, type MobileAccount } from "@/lib/mobileAuth";

const DEMO_EMAIL = "demo@vizhaone.com";
const DEMO_PASSWORD = "VizhaOne@123";
const googleChoices = [{email:"murugan@gmail.com",name:"Murugan"},{email:"vizhaone.business@gmail.com",name:"VizhaOne Business"}];

export default function MobileSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleOpen,setGoogleOpen]=useState(false);

  function enter(account:MobileAccount,token?:string){startSession(account,token);toast.success(`Welcome, ${account.name}!`);navigate(destination(account.role),{replace:true});}

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try { const result=await loginAccount(email,password); enter(result.user,result.token); }
    catch(err){ toast.error(err instanceof Error?err.message:"Login failed"); }
    finally { setBusy(false); }
  }

  return <main className="relative flex min-h-dvh flex-col overflow-y-auto bg-gradient-to-br from-rose-50 via-white to-orange-50 px-5 pb-8 pt-[calc(30px+env(safe-area-inset-top,0px))]">
    <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
    <section className="relative my-auto py-8">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-rose-500 to-pink-700 text-white shadow-lg"><Sparkles className="h-8 w-8" /></span>
      <p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-rose-500">Welcome to VizhaOne</p>
      <h1 className="mt-2 text-4xl font-black leading-tight tracking-[-.05em] text-gray-950">Celebrate without the stress.</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">Sign in to access your bookings, saved vendors and referral rewards.</p>

      <button type="button" onClick={()=>setGoogleOpen(true)} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-black shadow-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-lg font-black text-blue-600">G</span>Continue with Google</button>
      <div className="my-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[.2em] text-gray-300"><span className="h-px flex-1 bg-gray-200"/>or use email<span className="h-px flex-1 bg-gray-200"/></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="text-xs font-black text-gray-700">Email address</span><span className="mt-2 flex items-center rounded-2xl border border-rose-100 bg-white px-4 shadow-sm"><Mail className="h-4 w-4 text-rose-500" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="min-w-0 flex-1 bg-transparent px-3 py-4 font-bold outline-none" /></span></label>
        <label className="block"><span className="text-xs font-black text-gray-700">Password</span><span className="mt-2 flex items-center rounded-2xl border border-rose-100 bg-white px-4 shadow-sm"><LockKeyhole className="h-4 w-4 text-rose-500" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="min-w-0 flex-1 bg-transparent px-3 py-4 font-bold outline-none" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-gray-400" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
        <button disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-[#be123c] to-[#e11d48] px-5 py-4 text-sm font-black text-white shadow-lg disabled:opacity-60">{busy ? "Signing in..." : "Sign in & continue"}</button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">New to VizhaOne? <Link to="/sign-up" className="font-black text-rose-600">Create account</Link></p>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><p className="font-black">Demo login</p><p className="mt-1">Email: {DEMO_EMAIL}</p><p>Password: {DEMO_PASSWORD}</p></div>
      <p className="mt-5 flex items-start gap-2 text-[10px] leading-5 text-gray-400"><ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />By continuing, you agree to VizhaOne Terms and Privacy Policy.</p>
    </section>
    {googleOpen&&<div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 backdrop-blur-sm"><section className="w-full rounded-[28px] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Choose an account</h2><p className="text-xs text-gray-400">Continue to VizhaOne</p></div><button onClick={()=>setGoogleOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100"><X className="h-5 w-5"/></button></div><div className="mt-4 space-y-2">{googleChoices.map(choice=><button key={choice.email} onClick={()=>{const old=findAccount(choice.email);setGoogleOpen(false);if(old)enter(old);else navigate(`/sign-up?provider=google&email=${encodeURIComponent(choice.email)}&name=${encodeURIComponent(choice.name)}`)}} className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 p-3 text-left"><span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-red-500 font-black text-white">{choice.name[0]}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{choice.name}</strong><small className="block truncate text-gray-400">{choice.email}</small></span><ArrowRight className="h-4 w-4 text-gray-400"/></button>)}</div><p className="mt-4 rounded-xl bg-blue-50 p-3 text-[10px] leading-4 text-blue-700">Testing mode: this account picker simulates Google Sign-In.</p></section></div>}
  </main>;
}
