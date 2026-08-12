"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Link } from "react-router-dom";

const BLOGS = [
  {
    slug: "tamil-wedding-planning-checklist-2026",
    title: "Tamil Wedding Planning",
    excerpt: "A complete checklist explaining everything you need to prepare before planning your Tamil wedding...",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600"
  }
];

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen luxury-page">
      <Navbar />
      
      <div className="bg-green-800 text-white pt-24 pb-16 px-5 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">VizhaOne Blog</h1>
        <p className="text-[#e11d48]/20 text-lg">Event planning tips, trends, and inspiration</p>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOGS.map((blog) => (
            <Link key={blog.slug} to={`/blog/${blog.slug}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col">
              <div className="relative h-56 w-full overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#e11d48] transition-colors">{blog.title}</h2>
                <p className="text-gray-600 line-clamp-3 mb-4">{blog.excerpt}</p>
                <div className="mt-auto text-[#e11d48] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read More <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-20 md:hidden" />
    </div>
  );
}
