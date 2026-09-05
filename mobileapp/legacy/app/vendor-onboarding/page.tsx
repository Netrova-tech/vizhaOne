import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock3, IndianRupee, MapPin, MessageCircle, Phone, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const WHATSAPP_NUMBER = "918190094755";
const categories = ["Marriage Hall", "Catering", "Photography", "Decoration", "Makeup", "Music & DJ", "Transport", "Invitation", "Other"];

export default function VendorOnboardingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ vendorName: "", businessName: "", phone: "", serviceName: "", category: "", price: "", location: "", description: "" });

  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.vendorName.trim() || !form.phone.match(/^\d{10}$/) || !form.serviceName.trim() || !form.location.trim()) {
      toast.error("Please complete all required details with a valid 10-digit phone number."); return;
    }
    const message = [
      "*New VizhaOne Vendor Onboarding Request*", "",
      `Vendor name: ${form.vendorName}`, `Business name: ${form.businessName || "Not provided"}`,
      `Phone number: +91 ${form.phone}`, `Service name: ${form.serviceName}`,
      `Category: ${form.category || "Other"}`, `Starting price: ${form.price ? `Rs ${form.price}` : "Contact for quote"}`,
      `Service location: ${form.location}`, `Description: ${form.description || "Not provided"}`, "",
      "I would like to list my service on VizhaOne.",
    ].join("\n");
    setSubmitted(true);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="min-h-screen bg-[#fffafb] pb-20 md:pb-0"><Navbar/><main>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0519] via-[#9f1239] to-[#e11d48] px-5 py-16 text-white sm:py-20"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl"/><div className="relative mx-auto max-w-6xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em]"><Sparkles className="h-4 w-4"/>Grow with VizhaOne</span><h1 className="mt-6 max-w-4xl font-display text-4xl font-bold sm:text-6xl">Bring your service closer to thousands of celebrations.</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-rose-100 sm:text-lg">Share your business details with our onboarding team. We will review your profile and help you go live on VizhaOne within 24 hours.</p><div className="mt-8 flex flex-wrap gap-3">{["Direct enquiries","Professional listing","Call & WhatsApp leads"].map(item=><span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold"><BadgeCheck className="h-4 w-4 text-amber-300"/>{item}</span>)}</div></div></section>
    <section className="relative z-10 mx-auto -mt-8 grid max-w-6xl gap-7 px-5 pb-24 lg:grid-cols-[.7fr_1.3fr]">
      <aside className="rounded-3xl bg-gradient-to-br from-gray-950 to-[#4c0519] p-7 text-white shadow-2xl lg:self-start sm:p-8"><Building2 className="h-10 w-10 text-rose-300"/><h2 className="mt-6 font-display text-2xl font-bold">A simple path to your new customers</h2><div className="mt-7 space-y-6">{[["1","Tell us about your service","Complete this short business form."],["2","Connect on WhatsApp","Your details reach our team instantly."],["3","Go live within 24 hours","We verify and help onboard your listing."]].map(([n,title,text])=><div key={n} className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-black text-rose-200">{n}</span><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-relaxed text-white/55">{text}</p></div></div>)}</div><div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center gap-2 text-rose-200"><Clock3 className="h-5 w-5"/><p className="font-black">24-hour onboarding support</p></div><p className="mt-2 text-sm text-white/60">Questions? Call or WhatsApp us at +91 81900 94755.</p></div></aside>
      <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl shadow-rose-900/10 sm:p-9">{submitted?<div className="flex min-h-[580px] flex-col items-center justify-center text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-11 w-11"/></span><h2 className="mt-7 font-display text-3xl font-bold text-gray-950">Thank you for connecting with VizhaOne!</h2><p className="mt-4 max-w-lg text-base leading-relaxed text-gray-600">Your vendor details are ready to send on WhatsApp. Our team will review your service and help onboard you within 24 hours.</p><button onClick={()=>setSubmitted(false)} className="mt-8 rounded-xl border border-rose-200 px-6 py-3 text-sm font-black text-rose-700">Submit another service</button><Link to="/services" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-gray-500">Explore VizhaOne services <ArrowRight className="h-4 w-4"/></Link></div>:<><div><p className="text-xs font-black uppercase tracking-[.2em] text-rose-600">Vendor registration</p><h2 className="mt-2 font-display text-3xl font-bold text-gray-950">Add your service</h2><p className="mt-2 text-sm text-gray-500">Fields marked with * are required. Your information is shared only with the VizhaOne onboarding team.</p></div><form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field icon={UserRound} label="Your name *"><input value={form.vendorName} onChange={e=>update("vendorName",e.target.value)} placeholder="Full name"/></Field>
        <Field icon={Building2} label="Business name"><input value={form.businessName} onChange={e=>update("businessName",e.target.value)} placeholder="Business or brand name"/></Field>
        <Field icon={Phone} label="Phone number *"><div className="flex"><span className="border-r border-gray-200 pr-3 text-gray-400">+91</span><input className="pl-3" inputMode="numeric" value={form.phone} onChange={e=>update("phone",e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit number"/></div></Field>
        <Field icon={Sparkles} label="Service name *"><input value={form.serviceName} onChange={e=>update("serviceName",e.target.value)} placeholder="e.g. Wedding Photography"/></Field>
        <Field icon={Building2} label="Service category"><select value={form.category} onChange={e=>update("category",e.target.value)}><option value="">Select category</option>{categories.map(item=><option key={item}>{item}</option>)}</select></Field>
        <Field icon={IndianRupee} label="Starting price (optional)"><input inputMode="numeric" value={form.price} onChange={e=>update("price",e.target.value.replace(/[^\d.]/g,""))} placeholder="Leave blank for contact quote"/></Field>
        <div className="sm:col-span-2"><Field icon={MapPin} label="Service location *"><input value={form.location} onChange={e=>update("location",e.target.value)} placeholder="City, district or service area"/></Field></div>
        <label className="sm:col-span-2 text-sm font-black text-gray-700">About your service<textarea value={form.description} onChange={e=>update("description",e.target.value)} rows={4} maxLength={500} placeholder="Tell us about your experience, packages and what makes your service special..." className="mt-2 w-full resize-none rounded-2xl border border-gray-200 px-4 py-4 font-medium outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"/></label>
        <button type="submit" className="sm:col-span-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#25D366] px-6 py-5 text-base font-black text-white shadow-xl shadow-emerald-200 transition hover:-translate-y-0.5"><MessageCircle className="h-6 w-6"/>Send Details on WhatsApp</button><p className="sm:col-span-2 text-center text-xs text-gray-400">By submitting, you agree to be contacted by the VizhaOne onboarding team.</p>
      </form></>}</div>
    </section>
  </main><SiteFooter/><MobileBottomNav/></div>;
}

function Field({icon:Icon,label,children}:{icon:typeof UserRound;label:string;children:React.ReactNode}){return <label className="block text-sm font-black text-gray-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-rose-500"/>{label}</span><div className="mt-2 rounded-2xl border border-gray-200 px-4 py-3.5 font-medium [&_input]:w-full [&_input]:bg-transparent [&_input]:outline-none [&_select]:w-full [&_select]:bg-transparent [&_select]:outline-none focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">{children}</div></label>}
