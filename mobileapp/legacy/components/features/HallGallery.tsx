"use client";

import { useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface HallGalleryProps {
  images: string[];
  hallName: string;
}

export function HallGallery({ images, hallName }: HallGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef<number | null>(null);

  function openLightbox(i: number) { setZoom(1); setLightbox(i); }
  function closeLightbox() { setZoom(1); setLightbox(null); }
  function prev() { setZoom(1); setLightbox((p) => p !== null ? (p - 1 + images.length) % images.length : null); }
  function next() { setZoom(1); setLightbox((p) => p !== null ? (p + 1) % images.length : null); }
  function handleTouchStart(event: React.TouchEvent) {
    if (event.touches.length === 1 && zoom === 1) touchStartX.current = event.touches[0].clientX;
  }
  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null || zoom !== 1) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 45) return;
    if (delta < 0) next(); else prev();
  }

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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative h-full w-full overflow-auto touch-pan-x touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => setZoom((value) => value === 1 ? 2 : 1)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={images[lightbox]}
                alt={`${hallName} - ${lightbox + 1}`}
                className="h-full w-full origin-center object-contain transition-transform duration-200 select-none"
                draggable={false}
                style={{ transform: `scale(${zoom})` }}
              />
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 p-2 text-white backdrop-blur">
              <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((value) => Math.max(1, value - .5)); }} disabled={zoom === 1} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-40" aria-label="Zoom out"><ZoomOut className="h-5 w-5" /></button>
              <span className="min-w-10 text-center text-xs font-bold">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((value) => Math.min(3, value + .5)); }} disabled={zoom === 3} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-40" aria-label="Zoom in"><ZoomIn className="h-5 w-5" /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setZoom(1); }} className="grid h-9 w-9 place-items-center rounded-full" aria-label="Reset zoom"><RotateCcw className="h-4 w-4" /></button>
            </div>

            {/* Counter */}
            <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-20 flex -translate-x-1/2 gap-2">
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
