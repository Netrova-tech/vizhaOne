import { Building2, Shield, MessageCircle, BadgePercent, Star } from "lucide-react";

const ITEMS = [
  { icon: Building2, label: "6 Cities in TN" },
  { icon: Shield, label: "Verified Vendors" },
  { icon: MessageCircle, label: "WhatsApp Booking" },
  { icon: BadgePercent, label: "Best Price Guarantee" },
  { icon: Star, label: "4.9 Avg Rating" },
];

export function TrustBar() {
  return (
    <section className="relative bg-gradient-to-r from-[#fff1f2] via-white to-[#fff1f2] border-y border-[#fecdd3]/60 py-3.5 shrink-0">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e11d48]/20 to-transparent" aria-hidden />
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-4">
          {ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-100 shadow-sm"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#e11d48]" strokeWidth={2.2} />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
