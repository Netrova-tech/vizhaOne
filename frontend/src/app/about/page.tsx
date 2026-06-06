"use client";

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Heart, Shield, CheckCircle, Users, MapPin, Star, CalendarHeart, Lock, Loader2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function AboutPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [adminStarClicks, setAdminStarClicks] = useState(0);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const handleAdminStarClick = () => {
    setAdminStarClicks((clicks) => {
      const nextClicks = clicks + 1;

      if (nextClicks >= 5) {
        setAdminModalOpen(true);
        return 0;
      }

      return nextClicks;
    });
  };

  const closeAdminModal = () => {
    setAdminModalOpen(false);
    setAdminPin("");
    setAdminError("");
  };

  const handleAdminPinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError("");
    setAdminSubmitting(true);

    try {
      const response = await fetch("/api/auth/admin-pin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: adminPin }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Admin access failed");
      }

      localStorage.setItem("vizha_demo_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("vizha_auth_change"));
      navigate("/admin");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Admin access failed");
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      {!isAdmin && (
        <button
          type="button"
          aria-label="Admin access"
          onClick={handleAdminStarClick}
          className="fixed right-5 top-28 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/20 shadow-sm backdrop-blur-[2px] transition-all hover:scale-105 hover:border-white/25 hover:bg-white/10 hover:text-amber-300/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
        </button>
      )}

      {adminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm sm:items-center sm:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="relative bg-gradient-to-br from-[#f50546] to-[#be003e] px-6 py-9 text-center text-white">
              <button
                type="button"
                aria-label="Close admin access"
                onClick={closeAdminModal}
                className="absolute right-5 top-5 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 shadow-inner">
                <Lock className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-extrabold">Admin Access</h2>
              <p className="mt-2 text-lg text-white/75">Enter your secret PIN to continue</p>
            </div>

            <form onSubmit={handleAdminPinSubmit} className="px-7 py-8">
              <input
                value={adminPin}
                onChange={(event) => setAdminPin(event.target.value)}
                type="password"
                autoFocus
                placeholder="Enter secret key"
                className="h-16 w-full rounded-3xl border-2 border-[#f50546] bg-gray-50 px-5 text-center text-xl font-extrabold tracking-[0.16em] text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#be003e] focus:bg-white"
              />
              {adminError && (
                <p className="mt-3 text-center text-sm font-semibold text-red-600">{adminError}</p>
              )}
              <button
                type="submit"
                disabled={adminSubmitting || adminPin.trim().length < 4}
                className="mt-6 flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-[#f50546] to-[#be003e] text-xl font-extrabold text-white shadow-xl shadow-rose-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {adminSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Lock className="h-6 w-6" />}
                Enter Admin
              </button>
              <p className="mt-5 text-center text-sm font-medium text-gray-400">
                This is restricted access for authorized personnel only.
              </p>
            </form>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28" style={{ background: "linear-gradient(135deg, #1e0b36 0%, #3e1b70 50%, #1e0b36 100%)" }}>
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-500/20 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-amber-500/20 blur-[100px]" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 text-center text-white z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full text-sm font-semibold mb-6 shadow-xl">
              <Sparkles className="h-4 w-4 text-amber-400" /> The VizhaOne Journey
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Crafting Memorable Celebrations <br className="hidden md:block"/> Across Tamil Nadu
            </h1>
            <p className="text-lg md:text-xl text-rose-100 max-w-3xl mx-auto leading-relaxed mb-10">
              VizhaOne is more than just a marketplace; it is a movement to organize, simplify, and elevate how we celebrate our most cherished moments. We bring the best of Tamil Nadu's event industry directly to your fingertips.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/services" className="px-8 py-3.5 bg-amber-500 text-rose-950 font-bold rounded-xl shadow-lg hover:bg-amber-400 transition-colors">
                Explore Services
              </Link>
              <Link to="/halls" className="px-8 py-3.5 bg-white/10 text-white font-bold rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                Find Venues
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100 shadow-sm relative z-20 -mt-8 mx-5 sm:mx-8 lg:mx-auto max-w-5xl rounded-3xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4 sm:px-8">
          {[
            { icon: Users, num: "50+", label: "Happy Families" },
            { icon: Star, num: "25+", label: "Verified Vendors" },
            { icon: MapPin, num: "5+", label: "Districts Covered" },
            { icon: CalendarHeart, num: "200+", label: "Events Planned" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center">
              <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <stat.icon className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">{stat.num}</h3>
              <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 sm:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 font-bold rounded-lg text-sm mb-4">Our Mission</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">Why We Started VizhaOne</h2>
              <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                <p>
                  Planning a function in Tamil Nadu has traditionally been a chaotic and exhausting process. Families spend weeks making endless phone calls, negotiating with multiple middlemen, and worrying about hidden charges that pop up at the last minute.
                </p>
                <p>
                  We recognized that celebrations are meant to be enjoyed with loved ones, not managed like a stressful corporate project. We wanted to change the narrative.
                </p>
                <p>
                  We built VizhaOne so every family can easily browse verified local vendors, compare transparent prices, and book all services under one roof—with absolute peace of mind. From magnificent Marriages to intimate Ear-Piercing ceremonies, we ensure every detail is handled perfectly.
                </p>
              </div>
              
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {[
                  "100% Verified Local Vendors",
                  "Transparent Pricing & Packages",
                  "Direct WhatsApp Communication",
                  "Zero Hidden Charges"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <CheckCircle className="text-rose-600 h-5 w-5 flex-shrink-0 mt-0.5" /> 
                    <span className="text-gray-800 font-semibold text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-rose-200 group">
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1000"
                alt="Wedding celebration in Tamil Nadu"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-transparent to-transparent flex items-end p-8">
                <div>
                  <p className="text-white font-bold text-xl mb-1">Bringing people together</p>
                  <p className="text-rose-200 text-sm">Every event is a unique story waiting to be told.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gradient-to-b from-white to-rose-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 text-lg">The foundational principles that guide every feature we build and every vendor we onboard.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, colors: "bg-rose-50 text-rose-600", accent: "bg-rose-500/5", title: "Trust & Honesty", desc: "We believe in clear, upfront pricing and honest reviews. What you see is what you pay." },
              { icon: Shield, colors: "bg-blue-50 text-blue-600", accent: "bg-blue-500/5", title: "Quality Assured", desc: "Only the best decorators, caterers, and halls pass our strict verification process." },
              { icon: Sparkles, colors: "bg-amber-50 text-amber-600", accent: "bg-amber-500/5", title: "Stress-Free Planning", desc: "Your celebration should be enjoyed. We simplify the entire management process." },
              { icon: Users, colors: "bg-[#fff1f2] text-[#e11d48]", accent: "bg-[#e11d48]/5", title: "Cultural Heritage", desc: "We deeply respect and cater to the rich, diverse cultural traditions of Tamil Nadu." }
            ].map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} 
                className="p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 ${v.accent} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
                <div className={`h-14 w-14 ${v.colors} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="bg-gradient-to-r from-rose-600 to-rose-800 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-repeat bg-center" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Ready to plan your next event?</h2>
              <p className="text-rose-100 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of families who have successfully planned their dream celebrations with VizhaOne. Let's make your next function unforgettable.
              </p>
              <Link to="/calculator" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-rose-950 font-extrabold rounded-xl shadow-lg hover:bg-amber-300 hover:-translate-y-0.5 transition-all">
                <Sparkles className="h-5 w-5" /> Start Planning Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
