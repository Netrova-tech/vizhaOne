import { useState, type FormEvent } from "react";
import { ArrowLeft, Building2, CheckCircle2, ImagePlus, IndianRupee, LockKeyhole, Mail, MapPin, MessageCircle, Phone, Sparkles, UserRound, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { VizhaLogo } from "@/components/ui/VizhaLogo";
import { apiUrl } from "@/lib/utils";

const WHATSAPP_NUMBER = "918190094755";
const categories = ["Marriage Hall", "Catering", "Photography", "Decoration", "Makeup", "Music & DJ", "Transport", "Invitation", "Other"];
const initialForm = { vendorName: "", businessName: "", email: "", password: "", phone: "", serviceName: "", category: "", price: "", location: "", description: "" };

export default function VendorOnboardingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [form, setForm] = useState(initialForm);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.vendorName.trim()) return toast.error("Please enter your name.");
    if (!/^\d{10}$/.test(form.phone)) return toast.error("Please enter a valid 10-digit phone number.");
    if (!form.serviceName.trim()) return toast.error("Please enter your service name.");
    if (!form.location.trim()) return toast.error("Please enter your service location.");
    if (images.length < 1 || images.length > 5) return toast.error("Upload between 1 and 5 service images.");

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

    setBusy(true);
    try {
      let authToken = localStorage.getItem("vizha_mobile_token") || "";
      if (!authToken) {
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) throw new Error("Please enter a valid email address.");
        if (form.password.length < 8) throw new Error("Password must contain at least 8 characters.");
        const account = { name: form.vendorName.trim(), email: form.email.trim().toLowerCase(), password: form.password, mobile: form.phone, phone: form.phone, location: form.location.trim(), role: "service_provider", provider: "email" };
        let response = await fetch(apiUrl("/api/auth/register"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(account) });
        if (response.status === 409) response = await fetch(apiUrl("/api/auth/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: account.email, password: account.password }) });
        const auth = await response.json().catch(() => null);
        if (!response.ok || !auth?.token) throw new Error(auth?.error || "Unable to create or sign in to your provider account.");
        if (!["service_provider", "admin"].includes(auth.user?.role)) throw new Error("This email belongs to a customer account. Use a provider account email.");
        authToken = auth.token;
        localStorage.setItem("vizha_mobile_token", authToken);
        localStorage.setItem("vizha_demo_user", JSON.stringify(auth.user));
        window.dispatchEvent(new Event("vizha_auth_change"));
      }

      const imageBody = new FormData();
      images.forEach((file) => imageBody.append("images", file));
      const imageResponse = await fetch(apiUrl("/api/uploads/cloudinary"), { method: "POST", body: imageBody });
      const imageResult = await imageResponse.json().catch(() => null);
      const imageUrls = Array.isArray(imageResult?.images) ? imageResult.images.map((item: { url?: string }) => item.url).filter(Boolean).slice(0, 5) : [];
      if (!imageResponse.ok || !imageUrls.length) throw new Error(imageResult?.error || "Service image upload failed.");
      let videoUrls: string[] = [];
      if (video) {
        const videoBody = new FormData();
        videoBody.append("media", video);
        const videoResponse = await fetch(apiUrl("/api/uploads/media"), { method: "POST", body: videoBody });
        const videoResult = await videoResponse.json().catch(() => null);
        if (!videoResponse.ok || !videoResult?.media?.url) throw new Error(videoResult?.error || "Service video upload failed.");
        videoUrls = [videoResult.media.url];
      }
      const response = await fetch(apiUrl("/api/provider/publish"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ ...form, imageUrls, videoUrls }) });
      const published = await response.json().catch(() => null);
      if (!response.ok) throw new Error(published?.error || "Unable to publish your service.");
      setSubmitted(true);
      toast.success("Your profile and service are now published on VizhaOne.");
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`${message}\n\nService ID: ${published.service.id}`)}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish your service.");
    } finally {
      setBusy(false);
    }
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
              Share your basic details and our team will contact you on WhatsApp to help complete your listing.
            </p>
          </div>

          <div className="p-6 sm:p-9">
            {submitted ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-11 w-11" /></span>
                <h2 className="mt-6 text-2xl font-black text-gray-950">Profile and service published successfully</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">Customers can now discover your service. It remains unverified until the VizhaOne admin completes verification.</p>
                <button type="button" onClick={() => { setSubmitted(false); setForm(initialForm); setImages([]); setVideo(null); }} className="mt-7 rounded-xl border border-rose-200 px-5 py-3 text-sm font-black text-rose-700 hover:bg-rose-50">Add another service</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                {!localStorage.getItem("vizha_mobile_token") && <>
                  <div className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">Create your provider login. If this email already exists, the same password will sign you in.</div>
                  <Field icon={Mail} label="Email *"><input type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></Field>
                  <Field icon={LockKeyhole} label="Password *"><input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Minimum 8 characters" /></Field>
                </>}
                <Field icon={UserRound} label="Your name *"><input autoComplete="name" value={form.vendorName} onChange={(e) => update("vendorName", e.target.value)} placeholder="Full name" /></Field>
                <Field icon={Building2} label="Business name (optional)"><input autoComplete="organization" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Business or brand name" /></Field>
                <Field icon={Phone} label="Phone number *"><div className="flex items-center"><span className="border-r border-gray-200 pr-3 text-gray-400">+91</span><input className="pl-3" autoComplete="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div></Field>
                <Field icon={Sparkles} label="Service name *"><input value={form.serviceName} onChange={(e) => update("serviceName", e.target.value)} placeholder="Example: Wedding Photography" /></Field>
                <Field icon={Building2} label="Service category (optional)"><select value={form.category} onChange={(e) => update("category", e.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field icon={IndianRupee} label="Starting price (optional)"><input inputMode="numeric" value={form.price} onChange={(e) => update("price", e.target.value.replace(/\D/g, ""))} placeholder="Leave empty for custom quote" /></Field>
                <div className="sm:col-span-2"><Field icon={MapPin} label="Service location *"><input autoComplete="address-level2" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City, district or service area" /></Field></div>
                <label className="sm:col-span-2 block text-sm font-black text-gray-700"><span className="flex items-center gap-2"><ImagePlus className="h-4 w-4 text-rose-500" />Service images * (minimum 1, maximum 5)</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { const selected=Array.from(e.target.files||[]); if(selected.length>5){toast.error("Maximum 5 images allowed");e.target.value="";return} if(selected.some(file=>file.size>5*1024*1024)){toast.error("Each image must be 5 MB or smaller");e.target.value="";return} setImages(selected); }} className="mt-2 block w-full rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-4 py-5 text-sm font-medium file:mr-3 file:rounded-xl file:border-0 file:bg-rose-600 file:px-4 file:py-2 file:font-bold file:text-white" /><span className="mt-2 block text-xs font-medium text-gray-400">{images.length ? `${images.length} image${images.length===1?"":"s"} selected` : "JPG, PNG or WebP · up to 5 MB each"}</span></label>
                <label className="sm:col-span-2 block text-sm font-black text-gray-700"><span className="flex items-center gap-2"><Video className="h-4 w-4 text-rose-500" />Service video (optional)</span><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { const selected=e.target.files?.[0]||null; if(selected&&selected.size>25*1024*1024){toast.error("Video must be 25 MB or smaller");e.target.value="";setVideo(null);return} setVideo(selected); }} className="mt-2 block w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm font-medium file:mr-3 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:font-bold file:text-white" /><span className="mt-2 block text-xs font-medium text-gray-400">{video ? video.name : "MP4, WebM or MOV · up to 25 MB"}</span></label>
                <label className="sm:col-span-2 text-sm font-black text-gray-700">About your service (optional)<textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} maxLength={500} placeholder="Your experience or service details" className="mt-2 w-full resize-none rounded-2xl border border-gray-200 px-4 py-4 font-medium outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" /></label>
                <button type="submit" disabled={busy} className="sm:col-span-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#25D366] px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"><MessageCircle className="h-6 w-6" />{busy ? "Publishing service..." : "Publish Service & Notify on WhatsApp"}</button>
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
