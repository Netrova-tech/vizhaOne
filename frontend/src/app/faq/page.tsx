"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How does VizhaOne work?",
    a: "VizhaOne is a marketplace that connects you with verified event vendors in Tamil Nadu. You can browse marriage halls, caterers, decorators, and more, compare their prices, and book them directly through our platform."
  },
  {
    q: "Are the vendors verified?",
    a: "Yes! We personally verify every vendor listed on VizhaOne to ensure they meet our quality and reliability standards. You can also read reviews from other families who have booked them."
  },
  {
    q: "How do I make a booking?",
    a: "Once you find a vendor you like, you can add their service to your cart or planner. From there, you can easily send your requirements to them via WhatsApp directly from our app to confirm the booking."
  },
  {
    q: "Is there any extra fee for booking through VizhaOne?",
    a: "No, VizhaOne does not charge any hidden fees or extra commissions from the customers. You pay the transparent price listed by the vendor."
  },
  {
    q: "Can I cancel a booking?",
    a: "Cancellation policies vary by vendor. Please discuss the cancellation terms directly with the vendor when you confirm your booking on WhatsApp."
  }
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      
      <div className="bg-green-800 text-white pt-24 pb-12 px-5 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-[#e11d48]/20">Got questions? We've got answers.</p>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div 
              key={i} 
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="px-6 py-5 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 pr-4">{faq.q}</h3>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </div>
              
              {open === i && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
