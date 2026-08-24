"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { images: Array<string | null | undefined>; title: string };

export function ServiceImageCarousel({ images, title }: Props) {
  const clean = useMemo(() => [...new Set(images.filter((value): value is string => Boolean(value?.trim())))], [images]);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const available = clean.filter((image) => !failed.has(image));
  if (!available.length) return null;
  const active = index % available.length;
  const current = available[active];
  const move = (direction: number) => setIndex((value) => (value + direction + available.length) % available.length);

  return <div className="absolute inset-0 overflow-hidden">
    <img src={current} alt={`${title} photo ${active + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" onError={() => setFailed((old) => new Set(old).add(current))} />
    {available.length > 1 && <>
      <button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-800 shadow-md"><ChevronLeft className="h-4 w-4" /></button>
      <button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-800 shadow-md"><ChevronRight className="h-4 w-4" /></button>
      <span className="absolute bottom-2 right-2 z-20 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white">{active + 1}/{available.length}</span>
    </>}
  </div>;
}
