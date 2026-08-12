"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface HallGalleryProps {
  images: string[];
  hallName: string;
}

export function HallGallery({ images, hallName }: HallGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  function openLightbox(i: number) { setLightbox(i); }
  function closeLightbox() { setLightbox(null); }
  function prev() { setLightbox((p) => p !== null ? (p - 1 + images.length) % images.length : null); }
  function next() { setLightbox((p) => p !== null ? (p + 1) % images.length : null); }

  if (!images.length) return null;

  const [main, ...rest] = images;

  return (
    <>
      {/* Gallery grid */}
      <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-72 sm:h-80">
        {/* Main large image */}
        <div
          onClick={() => openLightbox(0)}
          className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
        >
          <img src={main} alt={`${hallName} - 1`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Side thumbnails */}
        {rest.slice(0, 4).map((img, i) => (
          <div
            key={i}
            onClick={() => openLightbox(i + 1)}
            className="relative cursor-pointer group overflow-hidden"
          >
            <img src={img} alt={`${hallName} - ${i + 2}`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* "More" overlay on last thumbnail */}
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{images.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-4xl h-[70vh] mx-16"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightbox]}
                alt={`${hallName} - ${lightbox + 1}`}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === lightbox ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
