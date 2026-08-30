"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

type Props = { images: Array<string | null | undefined>; title: string };

export function ServiceDetailGallery({ images, title }: Props) {
  const clean = useMemo(() => [...new Set(images.filter((value): value is string => Boolean(value?.trim())))], [images]);
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const touchStart = useRef<number | null>(null);
  if (!clean.length) return null;
  const activeIndex = Math.min(index, clean.length - 1);
  const move = (direction: number) => { setZoom(1); setIndex((current) => (current + direction + clean.length) % clean.length); };
  const startSwipe = (event: React.TouchEvent) => { if (zoom === 1) touchStart.current = event.touches[0]?.clientX ?? null; };
  const endSwipe = (event: React.TouchEvent) => {
    if (touchStart.current === null || zoom !== 1) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
  };

  return <>
    <section className="bg-white" aria-label={`${title} photo gallery`}>
      <div className="relative h-72 w-full overflow-hidden bg-rose-50 sm:h-96" onTouchStart={startSwipe} onTouchEnd={endSwipe}>
        <img src={clean[activeIndex]} alt={`${title} photo ${activeIndex + 1}`} className="h-full w-full object-cover" />
        <button type="button" onClick={() => setViewerOpen(true)} className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-black text-white backdrop-blur"><Images className="h-4 w-4" /> View all {clean.length} photos</button>
        <button type="button" onClick={() => setViewerOpen(true)} className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-gray-800 shadow" aria-label="View gallery full screen"><Maximize2 className="h-4 w-4" /></button>
        {clean.length > 1 && <>
          <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow" aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow" aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button>
          <span className="absolute bottom-4 right-4 z-20 rounded-full bg-black/65 px-3 py-2 text-xs font-black text-white">{activeIndex + 1}/{clean.length}</span>
        </>}
      </div>
      {clean.length > 1 && <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{clean.map((image, photoIndex) => <button type="button" key={image} onClick={() => setIndex(photoIndex)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${photoIndex === activeIndex ? "border-rose-600 shadow" : "border-transparent opacity-75"}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div>}
    </section>
    {viewerOpen && <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-black" onClick={() => setViewerOpen(false)} onTouchStart={startSwipe} onTouchEnd={endSwipe}>
      <button type="button" onClick={() => setViewerOpen(false)} className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-30 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white" aria-label="Close gallery"><X className="h-5 w-5" /></button>
      {clean.length > 1 && <><button type="button" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-2 z-30 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white"><ChevronLeft /></button><button type="button" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-2 z-30 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white"><ChevronRight /></button></>}
      <div className="h-full w-full overflow-auto" onClick={(event) => event.stopPropagation()} onDoubleClick={() => setZoom((value) => value === 1 ? 2 : 1)}><img src={clean[activeIndex]} alt={`${title} photo ${activeIndex + 1}`} draggable={false} className="h-full w-full origin-center select-none object-contain transition-transform" style={{ transform: `scale(${zoom})` }} /></div>
      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 p-2 text-white">
        <button type="button" onClick={(event) => { event.stopPropagation(); setZoom((value) => Math.max(1, value - .5)); }} className="grid h-9 w-9 place-items-center"><ZoomOut className="h-4 w-4" /></button><span className="min-w-16 text-center text-xs font-black">{activeIndex + 1}/{clean.length}</span><button type="button" onClick={(event) => { event.stopPropagation(); setZoom((value) => Math.min(3, value + .5)); }} className="grid h-9 w-9 place-items-center"><ZoomIn className="h-4 w-4" /></button><button type="button" onClick={(event) => { event.stopPropagation(); setZoom(1); }} className="grid h-9 w-9 place-items-center"><RotateCcw className="h-4 w-4" /></button>
      </div>
    </div>}
  </>;
}
