"use client";

import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, ArrowRight, Heart, Building2, MessageSquare } from "lucide-react";
import { VizhaLogo } from "@/components/ui/VizhaLogo";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const FOOTER_LINKS = [
  {
    title: "Services",
    links: [
      { name: "Catering", href: "/services?category=Catering" },
      { name: "Photography", href: "/services?category=Photography" },
      { name: "Stage Decoration", href: "/services?category=Stage%20Decoration" },
      { name: "DJ Sound", href: "/services?category=DJ%20Sound" },
      { name: "Flowers", href: "/services?category=Flower%20Decoration" },
      { name: "Sandai Melam", href: "/services?category=Sandai%20Melam" },
    ],
  },
  {
    title: "Explore",
    links: [
      { name: "Marriage Halls", href: "/halls" },
      { name: "Event Packages", href: "/packages" },
      { name: "Cost Calculator", href: "/calculator" },
      { name: "Categories", href: "/categories" },
      { name: "Halls", href: "/halls" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Partner Plans", href: "/partner-plans" },
      { name: "Blog", href: "/blog" },
      { name: "FAQ", href: "/faq" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden">
      <div className="bg-gray-50/80 py-12 px-5 sm:px-8">
        <ScrollReveal direction="right">
          <div className="max-w-6xl mx-auto rounded-2xl bg-white border border-gray-200 px-8 sm:px-14 py-12 sm:py-14 shadow-[0_4px_32px_rgba(0,0,0,0.07)]">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 text-left">
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 bg-[#e11d48]/10 text-[#e11d48] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="h-3 w-3" /> Next step
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 leading-tight">
                  Ready to plan your celebration?
                </h2>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                  Browse halls, compare vendors, and send your booking request via WhatsApp in minutes.
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {[
                    { icon: Building2, label: "Halls" },
                    { icon: MessageSquare, label: "WhatsApp request" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-600">
                      <Icon className="h-4 w-4 text-[#e11d48]" /> {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[240px] shrink-0">
                <Link
                  to="/calculator"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e11d48] text-white rounded-xl font-bold text-sm hover:bg-[#be123c] shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  Start Planning Free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/halls"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#e11d48] hover:text-[#e11d48] transition-all active:scale-95 whitespace-nowrap"
                >
                  Browse Marriage Halls
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <div className="bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#be123c] text-white">
        <div className="h-px bg-white/20" aria-hidden />
        <div className="h-[3px] bg-gradient-to-r from-transparent via-[#f9a8d4] to-transparent" aria-hidden />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 pt-12 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-2">
              <div className="mb-4">
                <VizhaLogo size="xs" light showTagline />
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-5 max-w-xs">
                Tamil Nadu&apos;s premier event marketplace. Book marriage mahals, vendors &amp; complete functions stress-free.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/918190094755"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-10 px-4 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold transition-colors shadow-md"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>

            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-sm font-semibold text-white mb-4 pb-2 border-b border-white/15 inline-block">
                  {col.title}
                </h3>
                <ul className="space-y-2.5 mt-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-white/60 hover:text-white hover:translate-x-0.5 inline-block transition-all"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/45">© 2026 vizhaOne. All rights reserved.</p>
            <p className="text-xs text-white/45 flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for Tamil Nadu families
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
