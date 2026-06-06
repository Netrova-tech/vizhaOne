"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams();

  // We could fetch from DB, but hardcoding the translation for now as per the user request
  return (
    <div className="min-h-screen bg-gray-50 luxury-page">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200" 
          alt="Tamil Wedding" 
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
          <span className="text-rose-300 text-sm font-bold uppercase tracking-widest mb-3">Complete Guide</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 max-w-3xl">
            Tamil Wedding Planning Checklist 2026
          </h1>
          <p className="text-gray-200 text-sm sm:text-base">May 30, 2026 • 5 min read</p>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 pb-24 bg-white shadow-xl -mt-10 relative z-10 rounded-t-3xl sm:rounded-3xl sm:-mt-16 mb-20">
        <Link to="/blog" className="inline-flex items-center gap-2 text-rose-600 font-semibold mb-8 hover:text-rose-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <div className="prose prose-rose prose-lg max-w-none">
          <p className="lead text-xl text-gray-600 mb-8 font-medium">
            Planning a grand Tamil wedding is no small feat. Once the engagement (Nitchayathartham) is over, are you wondering what to do next? This complete guide will definitely help you navigate the process.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 border-b border-gray-100 pb-2">Introduction</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            In Tamil Nadu, a wedding is not just a function—it's a grand festival. From the Engagement to the Mehendi, Sangeet, Muhurtham, and finally the Reception, there is so much to plan and coordinate for every single event.
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold text-rose-700 flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-700 text-sm">1</span>
                Budget Planning
              </h3>
              <p className="text-gray-700 leading-relaxed pl-11">
                The very first thing you must do when starting to plan a wedding is set a clear budget. Determine in advance exactly how much you are willing to allocate for the marriage hall, catering, decorations, and other expenses.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-rose-700 flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-700 text-sm">2</span>
                Marriage Hall Booking
              </h3>
              <p className="text-gray-700 leading-relaxed pl-11">
                As soon as the Muhurtham date is fixed, your top priority should be booking the marriage hall. Premium and popular marriage halls get booked 6 to 8 months in advance, so don't delay!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-rose-700 flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-700 text-sm">3</span>
                Photographer Selection
              </h3>
              <p className="text-gray-700 leading-relaxed pl-11">
                After the wedding celebrations end, the only tangible memories left in your hands are the photos and videos. Apart from traditional photography, candid photography, drone shots, and pre-wedding shoots are highly trendy and essential right now.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-rose-700 flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-700 text-sm">4</span>
                Catering Arrangements
              </h3>
              <p className="text-gray-700 leading-relaxed pl-11">
                While the traditional banana leaf (elai saapadu) meal remains a staple, having a modern buffet and live food counters for the evening reception is a huge trend. Decide your menu early and always confirm with the caterers after a tasting session.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-rose-700 flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-700 text-sm">5</span>
                Decoration Planning
              </h3>
              <p className="text-gray-700 leading-relaxed pl-11">
                The stage decoration will serve as the backdrop for all your wedding photos, so it deserves special attention. The entrance arch, the traditional swing (Unjal) setup, and the dining area decorations are equally important to create a magical atmosphere.
              </p>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-rose-50 rounded-2xl border border-rose-100">
            <h4 className="text-lg font-bold text-rose-900 mb-2">Ready to start planning?</h4>
            <p className="text-rose-800 text-sm mb-4">VizhaOne helps you discover, calculate, and book the best vendors across Tamil Nadu.</p>
            <Link to="/calculator" className="inline-flex items-center gap-2 px-6 py-3 bg-[#e11d48] text-white rounded-xl font-bold text-sm hover:bg-[#be123c] transition-all">
              Try our Free Planning Calculator <CheckCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
