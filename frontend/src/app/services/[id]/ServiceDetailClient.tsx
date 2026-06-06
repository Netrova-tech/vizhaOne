"use client";

import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, MessageCircle, Phone, MapPin, Sparkles, Share2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { toast } from "sonner";

import type { Service, Category } from "@/types";

export default function ServiceDetailClient({ id }: { id: string }) {
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    const resolvedId = (id === "_" && typeof window !== "undefined")
      ? window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop() || id
      : id;
    const rawServices = localStorage.getItem("vizha_admin_services");
    const servicesList: Service[] = rawServices ? JSON.parse(rawServices) : [];
    const foundService = servicesList.find((s) => s.id === resolvedId);
    
    if (foundService) {
      const rawCategories = localStorage.getItem("vizha_admin_categories");
      const categoriesList: Category[] = rawCategories ? JSON.parse(rawCategories) : [];
      const cat = categoriesList.find((c) => c.id === foundService.category_id);
      setService({ ...foundService, categories: cat });
    }
  }, [id]);

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

  const whatsappMsg = `Vanakkam! Naan "${service.title}" vendor service pathi kekanum.\n\nPlease confirm availability.`;

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
              {/* Image */}
              <div className="relative h-64 sm:h-96 w-full bg-rose-50 flex items-center justify-center">
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
          </div>

          {/* Contact Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              {service.vendor_mobile && (
                <div className="space-y-2">
                  <a href={`https://wa.me/91${service.vendor_mobile}?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#e11d48] text-white rounded-2xl text-sm font-bold hover:bg-[#be123c] transition-colors shadow-md shadow-rose-100">
                    <MessageCircle className="h-4 w-4" /> WhatsApp vendor
                  </a>
                  <a href={`tel:${service.vendor_mobile}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-sm font-semibold transition-colors">
                    <Phone className="h-4 w-4" /> Call vendor
                  </a>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] rounded-3xl p-6 text-white shadow-sm">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-300" />
                VizhaOne Guarantee
              </h3>
              <p className="text-white/80 text-xs leading-relaxed">
                All vendors on our platform are verified, professional, and adhere to strict quality standards to ensure your event runs smoothly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-24 md:hidden" />
    </div>
  );
}
