"use client";

import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";



const packageGradients: Record<string, string> = {
  basic: "from-blue-500 to-blue-700",
  premium: "from-[#e11d48] to-[#be123c]",
  vip: "from-amber-500 to-amber-700",
};

type PkgData = {
  id: string; name: string; package_type: string; description: string;
  total_price: number; features: string[]; is_active: boolean;
};

export default function PackageDetailClient({ id }: { id: string }) {
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<PkgData | null>(null);

  useEffect(() => {
    const resolvedId = (id === "_" && typeof window !== "undefined")
      ? window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop() || id
      : id;
    const raw = localStorage.getItem("vizha_admin_packages");
    const pkgs: PkgData[] = raw ? JSON.parse(raw) : [];
    setPkg(pkgs.find((p) => p.id === resolvedId) || null);
  }, [id]);

  if (!pkg) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">Package not found</p>
        <Link to="/" className="text-[#e11d48] underline mt-2 block">Go Home</Link>
      </div>
    </div>
  );

  const whatsappMsg = `Vanakkam! Naan "${pkg.name}" event package book pananum.\n\n` +
    `Includes:\n${pkg.features.map((f) => `• ${f}`).join("\n")}\n\n` +
    `Please confirm availability and next steps. Nandri!`;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className={`relative bg-gradient-to-br ${packageGradients[pkg.package_type]} py-16 px-4`}>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-white text-sm font-bold mb-4">
              {pkg.package_type === "vip" ? "👑 VIP" : pkg.package_type === "premium" ? "⭐ Premium" : "💙 Basic"} Package
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">{pkg.name}</h1>
            <p className="text-white/80 text-lg mb-6">{pkg.description}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-premium p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">What&apos;s Included</h2>
            <ul className="space-y-3">
              {pkg.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#fff1f2] flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 text-[#e11d48]" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className={`card-premium p-6 bg-gradient-to-br ${packageGradients[pkg.package_type]} text-white`}>
              <h3 className="font-bold text-xl mb-2">Book This Package</h3>
              <p className="text-white/80 text-sm mb-6">Contact us via WhatsApp to confirm availability and get started.</p>
              <a href={`https://wa.me/918190094755?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-bold border border-white/30 transition-all">
                <MessageCircle className="h-5 w-5" /> Book via WhatsApp
              </a>
            </div>

            <div className="card-premium p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Package Highlights</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {["All vendors verified & professional", "Dedicated event coordinator", "Flexible payment options", "Same-day booking confirmation"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#e11d48]" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-24 md:hidden" />
    </div>
  );
}
