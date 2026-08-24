"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { images: Array<string | null | undefined>; title: string };

export function ServiceImageCarousel({ images, title }: Props) {
 const clean=useMemo(()=>[...new Set(images.filter((value):value is string=>Boolean(value?.trim())))],[images]);
 const[index,setIndex]=useState(0),[failed,setFailed]=useState<Set<string>>(new Set());
 const touchStart=useRef<number|null>(null),available=clean.filter(image=>!failed.has(image));
 if(!available.length)return null;
 const active=index%available.length,current=available[active];
 const move=(direction:number)=>setIndex(value=>(value+direction+available.length)%available.length);
 return <div className="absolute inset-0 overflow-hidden" onTouchStart={event=>{touchStart.current=event.touches[0]?.clientX??null}} onTouchEnd={event=>{if(touchStart.current===null)return;const distance=(event.changedTouches[0]?.clientX??touchStart.current)-touchStart.current;if(Math.abs(distance)>35)move(distance<0?1:-1);touchStart.current=null}}>
  <img src={current} alt={`${title} photo ${active+1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={()=>setFailed(old=>new Set(old).add(current))}/>
  {available.length>1&&<><button type="button" aria-label="Previous photo" onClick={event=>{event.stopPropagation();move(-1)}} className="absolute left-1.5 top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-800 shadow"><ChevronLeft className="h-4 w-4"/></button><button type="button" aria-label="Next photo" onClick={event=>{event.stopPropagation();move(1)}} className="absolute right-1.5 top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-gray-800 shadow"><ChevronRight className="h-4 w-4"/></button><span className="absolute bottom-2 right-2 z-20 rounded-full bg-black/65 px-2 py-1 text-[9px] font-black text-white">{active+1}/{available.length}</span></>}
 </div>
}
