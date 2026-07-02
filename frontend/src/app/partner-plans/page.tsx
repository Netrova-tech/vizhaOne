"use client";

import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  Crown,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

const plans = [
  {
    name: "Starter",
    eyebrow: "Launch Offer",
    price: "Rs 365",
    marketPrice: "Rs 12,000",
    validity: "1 Year",
    title: "Perfect for New Vendors",
    description: "Start with a professional VizhaOne profile and receive direct enquiries from customers.",
    button: "Choose Starter",
    icon: Building2,
    tone: "border-gray-200 bg-white",
    buttonTone: "bg-gray-950 hover:bg-gray-800",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    features: [
      "Business Profile",
      "Service Listing",
      "Photo Gallery",
      "Call & WhatsApp Button",
      "Customer Enquiries",
      "Basic Support",
    ],
  },
  {
    name: "Growth Lite",
    eyebrow: "Growth",
    price: "Rs 999",
    marketPrice: "Rs 24,000",
    validity: "2 Years",
    title: "Best for Regular Vendors",
    description: "A stronger upgrade for vendors who want verified trust and better visibility.",
    button: "Choose Growth Lite",
    icon: TrendingUp,
    tone: "border-rose-100 bg-white",
    buttonTone: "bg-[#be123c] hover:bg-[#9f1239]",
    badgeTone: "bg-rose-50 text-[#be123c] border-rose-100",
    features: [
      "Everything in Starter",
      "Verified Partner Badge",
      "Higher Search Ranking",
      "Priority Customer Enquiries",
      "Premium Business Profile",
      "Priority Support",
    ],
  },
  {
    name: "Growth Pro",
    eyebrow: "Best Value",
    price: "Rs 1,499",
    marketPrice: "Rs 36,000",
    validity: "3 Years",
    title: "Best for Growing Businesses",
    description: "Recommended for established vendors who need long-term visibility, analytics, and premium trust.",
    button: "Choose Best Value",
    icon: Crown,
    tone: "border-[#e11d48] bg-white shadow-2xl shadow-rose-900/10 ring-2 ring-[#e11d48]/10",
    buttonTone: "bg-[#e11d48] hover:bg-[#be123c]",
    badgeTone: "bg-[#e11d48] text-white border-[#e11d48]",
    featured: true,
    features: [
      "Everything in Growth Lite",
      "Verified Partner Badge",
      "Higher Search Ranking",
      "Priority Customer Enquiries",
      "Premium Business Profile",
      "Business Analytics",
      "Priority Support",
      "Save More Compared to Yearly Renewal",
    ],
  },
];

function whatsappLink(plan: string) {
  const message = encodeURIComponent(`Hi VizhaOne, I want to list my business. Plan: ${plan}. I will pay by UPI and send the payment screenshot. Please activate my listing.`);
  return `https://wa.me/918190094755?text=${message}`;
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <div className="mt-6 space-y-3">
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-3.5 w-3.5" />
          </span>
          {feature}
        </div>
      ))}
    </div>
  );
}

export default function PartnerPlansPage() {
  return (
    <div className="min-h-screen luxury-page">
      <Navbar />

      <section className="bg-[#e11d48] px-5 py-4 text-white shadow-lg shadow-rose-900/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black">Add your services on VizhaOne</p>
              <p className="text-sm font-medium text-white/80">Vendor ah? Your business profile, photos, price, Call & WhatsApp button ellam show pannunga.</p>
            </div>
          </div>
          <a
            href="#plans"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#be123c] transition hover:bg-rose-50"
          >
            View Partner Plans <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e11d48] via-amber-400 to-[#e11d48]" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#be123c]">
                <Sparkles className="h-4 w-4" /> Exclusive Launch Offer
              </span>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-gray-950">
                Start your vendor listing for just <span className="text-[#e11d48]">Rs 365/year</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600">
                List your event business on VizhaOne, build trust with families, and get direct enquiries through Call and WhatsApp. Built for halls, decorators, photographers, caterers, bridal artists, and event service providers.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappLink("Growth Pro Rs 1,499 / 3 Years")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e11d48] px-6 py-4 text-sm font-black text-white shadow-lg shadow-rose-900/15 transition hover:bg-[#be123c]"
                >
                  Join as Vendor <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-white px-6 py-4 text-sm font-black text-gray-700 transition hover:border-[#e11d48] hover:text-[#be123c]"
                >
                  See Live Listings
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-5 sm:p-6">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Why service providers join</p>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Get direct leads", "Customers contact you through Call and WhatsApp."],
                    ["Look professional", "Show profile, photos, services, prices, and location."],
                    ["Build trust fast", "Verified badge and premium profile options improve confidence."],
                    ["Grow locally", "Reach families searching by city, hall, and event need."],
                  ].map(([title, text]) => (
                    <div key={title} className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#e11d48]" />
                      <div>
                        <p className="text-sm font-black text-gray-900">{title}</p>
                        <p className="text-xs leading-relaxed text-gray-500">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 scroll-mt-24">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#be123c]">Subscription plans</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-950">Choose the right launch offer</h2>
          <p className="text-sm text-gray-500">Customers browse free. These plans are only for vendors and business listings.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 max-w-7xl mx-auto items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.name} className={`relative flex flex-col rounded-3xl border p-6 ${plan.tone}`}>
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#e11d48] px-4 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${plan.badgeTone}`}>
                      {plan.featured && <Star className="h-3.5 w-3.5 fill-white" />}
                      {plan.eyebrow}
                    </span>
                    <h3 className="mt-4 text-2xl font-black text-gray-950">{plan.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{plan.description}</p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#e11d48]">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">{plan.name}</p>
                    <span className="rounded-full bg-[#e11d48] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                      Only
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <span className="text-5xl font-black leading-none text-gray-950">{plan.price}</span>
                    <span className="mb-1 rounded-full bg-white px-3 py-1 text-xs font-black text-[#be123c] ring-1 ring-rose-100">
                      {plan.validity}
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-rose-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Market listing value</p>
                    <p className="mt-0.5 text-sm font-black text-gray-500">
                      <span className="line-through decoration-2">{plan.marketPrice}</span>
                      <span className="ml-2 text-[#be123c]">Launch offer price</span>
                    </p>
                  </div>
                </div>

                <FeatureList features={plan.features} />

                <a
                  href={whatsappLink(`${plan.name} ${plan.price} / ${plan.validity}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition ${plan.buttonTone}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  {plan.button}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-14">
        <div className="rounded-3xl border border-rose-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#be123c]">
                <BadgeCheck className="h-5 w-5" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">Manual activation now</p>
              </div>
              <h2 className="mt-3 text-2xl font-black text-gray-950">How activation works</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Vendor contacts VizhaOne, chooses a plan, pays by UPI or direct payment, and admin activates the listing. Simple now, payment gateway later.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Contact VizhaOne", MessageCircle],
                ["Pay using UPI", BadgeCheck],
                ["Send screenshot & go live", TrendingUp],
              ].map(([step, Icon], index) => {
                const StepIcon = Icon as typeof MessageCircle;
                return (
                  <div key={step as string} className="rounded-2xl bg-rose-50 px-4 py-4 text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#e11d48] text-white">
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-black text-gray-900">{index + 1}. {step as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-32 md:pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Business Analytics", "Understand listing interest and enquiry growth.", BarChart3],
            ["Verified Trust", "Make your profile feel safer for customers.", ShieldCheck],
            ["Priority Enquiries", "Growth vendors receive stronger lead visibility.", Crown],
          ].map(([title, text, Icon]) => {
            const CardIcon = Icon as typeof BarChart3;
            return (
              <div key={title as string} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <CardIcon className="h-6 w-6 text-[#e11d48]" />
                <p className="mt-4 text-base font-black text-gray-950">{title as string}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
      <div className="h-32 md:hidden" />
    </div>
  );
}
