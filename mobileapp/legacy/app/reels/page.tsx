"use client";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, CalendarCheck, Heart, Lock, PlaySquare, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { MobileAppHeader } from "@/components/layout/MobileAppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { fetchSocial, setFollowing, socialItems, toggleSocial, type SocialItem } from "@/lib/social";

export default function ReelsPage() {
  const { user } = useAuth(); const [items,setItems]=useState<SocialItem[]>([]);
  useEffect(()=>{setItems(socialItems());void fetchSocial().then(setItems).catch(()=>undefined)},[]);
  function toggle(id:string,key:"likes"|"savedBy"){if(user)setItems(toggleSocial(id,user.id,key));else toast.error("Sign in to continue")}
  async function follow(item:SocialItem){if(!user)return toast.error("Sign in to follow this profile");try{const result=await setFollowing(item.ownerId,!item.isFollowing);setItems(current=>current.map(entry=>entry.ownerId===item.ownerId?{...entry,isFollowing:result.following,followerCount:result.followers}:entry));toast.success(result.following?`Following ${item.ownerName}`:`Unfollowed ${item.ownerName}`)}catch(error){toast.error(error instanceof Error?error.message:"Unable to update follow")}}
  return <div className="min-h-dvh bg-black pb-20 pt-[calc(68px+env(safe-area-inset-top,0px))]"><MobileAppHeader/><main className="h-[calc(100dvh-148px-env(safe-area-inset-top,0px))] snap-y snap-mandatory overflow-y-auto">
    {items.length?items.map(item=><article key={item.id} className="relative h-full snap-start overflow-hidden bg-gray-950">
      {item.mediaType==="video"?<video src={item.media} controls playsInline loop className="h-full w-full object-contain"/>:<img src={item.media} alt={item.caption} className="h-full w-full object-cover"/>}<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10"/>
      <div className="absolute bottom-5 left-4 right-20 text-white"><div className="flex items-center gap-2"><Link to={`/vendor/${item.ownerId}`} className="flex min-w-0 items-center gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-rose-600">{item.avatar?<img src={item.avatar} alt="" className="h-full w-full object-cover"/>:item.ownerName[0]}</span><strong className="truncate text-sm">{item.ownerName}</strong></Link>{user?.id!==item.ownerId&&<button type="button" onClick={()=>void follow(item)} className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${item.isFollowing?"border-white/40 bg-white/15":"border-rose-400 bg-rose-600"}`}>{item.isFollowing?"Following":"Follow"}</button>}</div><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] font-black uppercase backdrop-blur">{item.visibility==="followers"&&<Lock className="h-3 w-3"/>}{item.kind}</span><p className="mt-2 text-sm leading-5">{item.caption}</p><p className="mt-2 text-xs font-black text-rose-300">{item.service}{item.price?` · ₹${item.price}`:""}</p></div>
      <div className="absolute bottom-5 right-3 flex flex-col gap-4 text-white"><button onClick={()=>toggle(item.id,"likes")} className="flex flex-col items-center text-[10px]"><Heart className={`h-7 w-7 ${user&&item.likes.includes(user.id)?"fill-rose-500 text-rose-500":""}`}/>{item.likes.length}</button><button onClick={()=>toggle(item.id,"savedBy")}><Bookmark className={`h-7 w-7 ${user&&item.savedBy.includes(user.id)?"fill-white":""}`}/></button><Link to={`/vendor/${item.ownerId}`}><UserRound className="h-7 w-7"/></Link><Link to={`/quote/${item.id}`} aria-label="Get quotation" className="grid h-11 w-11 place-items-center rounded-full bg-rose-600"><CalendarCheck className="h-5 w-5"/></Link></div>
    </article>):<section className="grid h-full place-items-center px-8 text-center text-white"><div><PlaySquare className="mx-auto h-14 w-14 text-rose-500"/><h1 className="mt-4 text-xl font-black">Community reels coming soon</h1><p className="mt-2 text-sm leading-6 text-gray-400">Public posts and reels from customers and service providers will appear here.</p>{user&&<Link to="/profile" className="mt-5 inline-flex rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black">Upload first reel</Link>}</div></section>}
  </main><MobileBottomNav/></div>;
}
