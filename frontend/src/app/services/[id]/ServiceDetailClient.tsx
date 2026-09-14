"use client";

import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Sparkles, Share2, Scale, ShieldCheck, PlayCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { toast } from "sonner";
import { useCatalog } from "@/hooks/useCatalog";
import { HallGallery } from "@/components/features/HallGallery";
import { QuoteRequestModal } from "@/components/features/QuoteRequestModal";
import { toggleCompare } from "@/lib/compare";
import { formatServicePrice } from "@/lib/utils";

export default function ServiceDetailClient({ id }: { id: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [requestMode, setRequestMode] = useState<"quote"|"booking"|null>(null);
  const { services, categories, loading } = useCatalog();
  const resolvedId = (id === "_" && typeof window !== "undefined")
    ? window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop() || id
    : id;
  const foundService = services.find((s) => s.id === resolvedId) || null;
  const service = foundService
    ? { ...foundService, categories: categories.find((c) => c.id === foundService.category_id) }
    : null;
  const serviceImages = service ? [...new Set([service.image_url,...(service.gallery_urls||[])].filter(Boolean) as string[])] : [];
  const isFixedPrice = service?.pricing_type === "fixed";

  useEffect(() => {
    if (service && new URLSearchParams(location.search).get("action") === "book") {
      setRequestMode(isFixedPrice ? "booking" : "quote");
    }
  }, [service?.id, isFixedPrice, location.search]);

  function handleShare() {
    if (!service) return;
    if (navigator.share) {
      navigator.share({
        title: service.title,
        text: `Check out ${service.title} on VizhaOne!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Service not found</p>
          <Link to="/services" className="text-[#e11d48] underline mt-2 block">Back to Services</Link>
        </div>
      </div>
    );
  }

  const packages = Array.isArray(service.packages) ? service.packages : [];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              {serviceImages.length > 1 && <HallGallery images={serviceImages} hallName={service.title}/>}
              {/* Image */}
              <div className={`${serviceImages.length > 1?"hidden":""} relative h-64 sm:h-96 w-full bg-rose-50 flex items-center justify-center`}>
                {service.image_url ? (
                  <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-7xl">🎉</span>
                )}
                {service.categories && (
                  <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold">
                    {service.categories.category_name}
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{service.title}</h1>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={handleShare}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#e11d48] transition-colors"
                      aria-label="Share Service"
                      title="Share this Service"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${service.availability_status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {service.availability_status ? "Available" : "Booked"}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-gray-500 mb-4">{service.vendor_name}</p>

                {service.verified && <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><ShieldCheck className="h-4 w-4"/> VizhaOne Verified Partner</div>}

                {service.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-6">
                    <MapPin className="h-4 w-4 text-[#e11d48]" />
                    <span>{service.location} {service.place_name ? `• ${service.place_name}` : ""}</span>
                  </div>
                )}

                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{service.description || "No description provided."}</p>
              </div>
            </div>

            {packages.length > 0 && <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Packages</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{packages.map((pkg:any)=><article key={pkg.name} className="rounded-2xl border border-rose-100 p-4"><h3 className="font-black">{pkg.name}</h3><p className="mt-2 text-xl font-black text-[#be123c]">₹{Number(pkg.price||0).toLocaleString('en-IN')}</p><ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-gray-600">{(pkg.inclusions||[]).map((x:string)=><li key={x}>{x}</li>)}</ul></article>)}</div></section>}

            {(service.video_urls?.length || 0) > 0 && <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-2xl font-black"><PlayCircle/> Videos & reels</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{service.video_urls!.map((url)=><video key={url} src={url} controls playsInline className="aspect-video w-full rounded-2xl bg-black object-cover"/>)}</div></section>}
          </div>

          {/* Contact Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div><p className="text-xs font-black uppercase tracking-widest text-gray-400">{service.pricing_type === 'quote' ? 'Pricing' : 'Starting price'}</p><p className="mt-2 text-2xl font-black text-[#be123c]">{formatServicePrice(service)}</p><p className="text-xs text-gray-500">{service.price_unit || 'per event'}</p></div>
              <button onClick={()=>setRequestMode(isFixedPrice?'booking':'quote')} className="w-full rounded-2xl bg-[#e11d48] py-4 text-sm font-black text-white shadow-md">{isFixedPrice ? 'Book Now':'Request Quote'}</button>
              <button onClick={()=>{const result=toggleCompare(service);result.error?toast.error(result.error):toast.success('Compare list updated');}} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-bold"><Scale className="h-4 w-4"/> Add to Compare</button>
              <div className="space-y-2 border-t pt-4 text-xs text-gray-600">{service.extra_charges && <p><b>Extra charges:</b> {service.extra_charges}</p>}{service.travel_charges && <p><b>Travel:</b> {service.travel_charges}</p>}{service.advance_percentage != null && <p><b>Advance:</b> {service.advance_percentage}%</p>}{service.cancellation_terms && <p><b>Cancellation:</b> {service.cancellation_terms}</p>}</div>
            </div>

            <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] rounded-3xl p-6 text-white shadow-sm">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-300" />
                VizhaOne Guarantee
              </h3>
              <p className="text-white/80 text-xs leading-relaxed">
                Verified badges are awarded only after business, phone, location and portfolio checks by the VizhaOne team.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-24 md:hidden" />
      {requestMode && <QuoteRequestModal service={service} mode={requestMode} onClose={()=>setRequestMode(null)}/>}
    </div>
  );
}
