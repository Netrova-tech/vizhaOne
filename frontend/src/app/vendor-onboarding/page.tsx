import { useState, type FormEvent } from "react";
import { ArrowLeft, Building2, CheckCircle2, IndianRupee, MapPin, MessageCircle, Phone, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { VizhaLogo } from "@/components/ui/VizhaLogo";

const WHATSAPP_NUMBER = "918190094755";
const categories = ["Marriage Hall", "Catering", "Photography", "Decoration", "Makeup", "Music & DJ", "Transport", "Invitation", "Other"];
const initialForm = { vendorName: "", businessName: "", phone: "", serviceName: "", category: "", price: "", location: "", description: "" };

export default function VendorOnboardingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.vendorName.trim()) return toast.error("Please enter your name.");
    if (!/^\d{10}$/.test(form.phone)) return toast.error("Please enter a valid 10-digit phone number.");
    if (!form.serviceName.trim()) return toast.error("Please enter your service name.");
    if (!form.location.trim()) return toast.error("Please enter your service location.");

    const message = [
      "*New VizhaOne Vendor Registration*", "",
      `Name: ${form.vendorName.trim()}`,
      `Business name: ${form.businessName.trim() || "Not provided"}`,
      `Phone: +91 ${form.phone}`,
      `Service: ${form.serviceName.trim()}`,
      `Category: ${form.category || "Not selected"}`,
      `Starting price: ${form.price ? `Rs ${form.price}` : "Contact for quote"}`,
      `Location: ${form.location.trim()}`,
      `About service: ${form.description.trim() || "Not provided"}`, "",
      "Please help me add my service to VizhaOne.",
    ].join("\n");

    setSubmitted(true);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff5f7] to-white px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-rose-100 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <VizhaLogo size="sm" />
          <a href={`tel:+${WHATSAPP_NUMBER}`} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50" aria-label="Call VizhaOne support">
            <Phone className="h-4 w-4" /><span className="hidden sm:inline">Help</span>
          </a>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-xl shadow-rose-900/10">
          <div className="bg-gradient-to-r from-[#9f1239] to-[#e11d48] px-6 py-7 text-white sm:px-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-100">Vendor registration</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Add your service</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-50 sm:text-base">
              Basic details மட்டும் fill pannunga. WhatsApp-la எங்கள் team உங்களை contact செய்து listing complete பண்ண உதவும்.
            </p>
          </div>

          <div className="p-6 sm:p-9">
            {submitted ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-11 w-11" /></span>
                <h2 className="mt-6 text-2xl font-black text-gray-950">WhatsApp opened</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">WhatsApp-la prepared message-ஐ Send pannunga. VizhaOne team உங்கள் listing-ku உதவுவாங்க.</p>
                <button type="button" onClick={() => { setSubmitted(false); setForm(initialForm); }} className="mt-7 rounded-xl border border-rose-200 px-5 py-3 text-sm font-black text-rose-700 hover:bg-rose-50">Add another service</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  <MessageCircle className="mr-2 inline h-4 w-4" />No technical setup needed. Submit pannina details WhatsApp-la ready-ah open aagum.
                </div>
                <Field icon={UserRound} label="Your name *"><input autoComplete="name" value={form.vendorName} onChange={(e) => update("vendorName", e.target.value)} placeholder="Full name" /></Field>
                <Field icon={Building2} label="Business name (optional)"><input autoComplete="organization" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Business or brand name" /></Field>
                <Field icon={Phone} label="Phone number *"><div className="flex items-center"><span className="border-r border-gray-200 pr-3 text-gray-400">+91</span><input className="pl-3" autoComplete="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div></Field>
                <Field icon={Sparkles} label="Service name *"><input value={form.serviceName} onChange={(e) => update("serviceName", e.target.value)} placeholder="Example: Wedding Photography" /></Field>
                <Field icon={Building2} label="Service category (optional)"><select value={form.category} onChange={(e) => update("category", e.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field icon={IndianRupee} label="Starting price (optional)"><input inputMode="numeric" value={form.price} onChange={(e) => update("price", e.target.value.replace(/\D/g, ""))} placeholder="Leave empty for custom quote" /></Field>
                <div className="sm:col-span-2"><Field icon={MapPin} label="Service location *"><input autoComplete="address-level2" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City, district or service area" /></Field></div>
                <label className="sm:col-span-2 text-sm font-black text-gray-700">About your service (optional)<textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} maxLength={500} placeholder="Your experience or service details" className="mt-2 w-full resize-none rounded-2xl border border-gray-200 px-4 py-4 font-medium outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" /></label>
                <button type="submit" className="sm:col-span-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#25D366] px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5"><MessageCircle className="h-6 w-6" />Send Details on WhatsApp</button>
                <p className="sm:col-span-2 text-center text-xs leading-relaxed text-gray-400">Required: name, phone, service and location only. Need help? Call +91 81900 94755.</p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-black text-gray-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-rose-500" />{label}</span><div className="mt-2 rounded-2xl border border-gray-200 px-4 py-3.5 font-medium [&_input]:w-full [&_input]:bg-transparent [&_input]:outline-none [&_select]:w-full [&_select]:bg-transparent [&_select]:outline-none focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">{children}</div></label>;
}
