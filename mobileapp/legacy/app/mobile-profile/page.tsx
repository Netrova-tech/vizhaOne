"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Bookmark, Check, ChevronRight, CircleHelp, Gift, Globe2, Grid3X3, ImagePlus, LogOut, MapPin, Pencil, Phone, PlaySquare, ShieldCheck, Trash2, Upload, UserRound, WandSparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { fileData, publishSocial, socialItems, updateSessionAvatar, type SocialItem, type SocialKind } from "@/lib/social";
import { clearMobileSession, deleteAccount, startSession, updateAccount } from "@/lib/mobileAuth";

const menu = [
  { label: "Referral rewards", hint: "Invite friends and earn", href: "/referrals", icon: Gift },
  { label: "Celebration tools", hint: "Invites, hashtags and more", href: "/create", icon: WandSparkles },
  { label: "Notifications", hint: "Booking and offer updates", href: "/bookings", icon: Bell },
  { label: "Saved", hint: "Your favourite vendors", href: "/saved", icon: Bookmark },
  { label: "Language", hint: "English, Tamil and more", href: "/", icon: Globe2 },
  { label: "Help & support", hint: "FAQ and contact options", href: "/faq", icon: CircleHelp },
  { label: "Privacy & security", hint: "Your data and account", href: "/privacy", icon: ShieldCheck },
];

export default function MobileProfilePage() {
  const { user, loading, signOut } = useAuth();
  const provider = user?.role === "service_provider";
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "", mobile: "", location: "" });
  const [uploads, setUploads] = useState<SocialItem[]>([]);
  const [kind, setKind] = useState<SocialKind>("reel");
  const [media, setMedia] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [service, setService] = useState("");
  const [price, setPrice] = useState("");
  const [posting, setPosting] = useState(false);
  const [deleting,setDeleting]=useState(false);
  const [deleteOpen,setDeleteOpen]=useState(false);
  const [analyticsConsent,setAnalyticsConsent]=useState(()=>typeof window!=="undefined"&&localStorage.getItem("vizha_analytics_consent")==="granted");

  useEffect(() => {
    if (!user) return;
    setUploads(socialItems().filter((x) => x.ownerId === user.id));
    setProfile({ name: user.name || "", mobile: user.mobile || "", location: user.location || "" });
  }, [user]);

  if (loading) return <div className="grid min-h-dvh place-items-center bg-rose-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" /></div>;

  async function chooseAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { updateSessionAvatar(await fileData(file, 1_500_000)); toast.success("Profile picture updated"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  }
  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Name is required");
    try { const result=await updateAccount({name:profile.name.trim(),mobile:profile.mobile.trim(),location:profile.location.trim()}); startSession(result.user); setEditing(false); toast.success("Profile updated"); }
    catch(err){ toast.error(err instanceof Error?err.message:"Profile update failed"); }
  }
  async function chooseMedia(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { setMedia(await fileData(file)); setMediaType(file.type.startsWith("video") ? "video" : "image"); toast.success("Media ready"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  }
  function publish(e: FormEvent) {
    e.preventDefault();
    if (!user || !media || !caption.trim() || !service.trim()) return toast.error("Media, caption and service required");
    setPosting(true);
    try {
      publishSocial({ id: `social-${Date.now()}`, ownerId: user.id, ownerName: user.name || "VizhaOne Provider", avatar: user.avatar_url, kind, media, mediaType, caption: caption.trim(), service: service.trim(), price: price.trim(), createdAt: new Date().toISOString(), likes: [], savedBy: [] });
      setMedia(""); setCaption(""); setService(""); setPrice(""); setUploads(socialItems().filter((x) => x.ownerId === user.id)); toast.success(`${kind === "reel" ? "Reel" : "Post"} published`);
    } catch { toast.error("Device storage full. Try a smaller file."); } finally { setPosting(false); }
  }
  async function removeAccount(){setDeleting(true);try{await deleteAccount();clearMobileSession();localStorage.removeItem("vizha_favorites");localStorage.removeItem("vizha_cart");toast.success("Your account and personal data were deleted");window.location.hash="#/sign-in";window.location.reload()}catch(error){toast.error(error instanceof Error?error.message:"Account deletion failed")}finally{setDeleting(false)}}

  return <div className="min-h-dvh bg-[#fffafb] pb-24">
    <MobilePageHeader title={provider ? "Business profile" : "My profile"} subtitle={provider ? "Create, post and grow" : "Account and preferences"} />
    <main className="px-4 py-5">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#701a3a] via-[#be123c] to-[#f43f5e] p-5 text-white shadow-xl shadow-rose-900/15">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <button onClick={() => setEditing(true)} className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-[10px] font-black backdrop-blur"><Pencil className="h-3.5 w-3.5" /> Edit profile</button>
        <div className="relative flex items-center gap-4 pt-8">
          <label className="relative grid h-24 w-24 flex-none cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-white/70 bg-white/15 shadow-lg">{user?.avatar_url ? <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : <UserRound className="h-11 w-11" />}<input type="file" accept="image/*" onChange={chooseAvatar} className="hidden" /><span className="absolute inset-x-0 bottom-0 bg-black/50 py-1.5 text-center text-[8px] font-bold">CHANGE</span></label>
          <div className="min-w-0"><p className="truncate text-xl font-black">{user?.name || "VizhaOne User"}</p><p className="mt-1 truncate text-xs text-rose-100">{user?.email || "Verified account"}</p><p className="mt-2 flex items-center gap-1 truncate text-[11px] text-white/85"><MapPin className="h-3.5 w-3.5" />{user?.location || "Tamil Nadu"}</p><span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-wider text-rose-700">{provider ? "Service provider" : "Customer"}</span></div>
        </div>
      </section>

      {editing && <div className="fixed inset-0 z-[120] flex items-end bg-black/50 p-3 backdrop-blur-sm"><form onSubmit={saveProfile} className="w-full rounded-[28px] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Edit profile</h2><p className="text-xs text-gray-500">Keep your account details up to date</p></div><button type="button" onClick={() => setEditing(false)} className="grid h-10 w-10 place-items-center rounded-full bg-gray-100"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-3"><label className="block text-[10px] font-bold text-gray-500">FULL NAME<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-rose-500" /></label><label className="block text-[10px] font-bold text-gray-500">PHONE NUMBER<div className="mt-1 flex items-center rounded-2xl border border-gray-200 px-4"><Phone className="h-4 w-4 text-rose-500" /><input value={profile.mobile} inputMode="tel" onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} className="w-full px-3 py-3.5 text-sm outline-none" /></div></label><label className="block text-[10px] font-bold text-gray-500">LOCATION<div className="mt-1 flex items-center rounded-2xl border border-gray-200 px-4"><MapPin className="h-4 w-4 text-rose-500" /><input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="w-full px-3 py-3.5 text-sm outline-none" /></div></label></div><button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 text-sm font-black text-white"><Check className="h-4 w-4" />Save changes</button></form></div>}

      {provider ? <><section className="mt-5 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm"><div className="flex gap-2">{(["reel", "post"] as SocialKind[]).map((x) => <button key={x} onClick={() => setKind(x)} className={`flex-1 rounded-xl py-3 text-xs font-black capitalize ${kind === x ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-500"}`}>{x}</button>)}</div><form onSubmit={publish} className="mt-4 space-y-3"><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50">{media ? (mediaType === "image" ? <img src={media} className="max-h-56 w-full object-cover" /> : <video src={media} controls className="max-h-56 w-full" />) : <><ImagePlus className="h-8 w-8 text-rose-500" /><strong className="mt-2 text-xs">Choose photo or video</strong></>}<input type="file" accept="image/*,video/*" onChange={chooseMedia} className="hidden" /></label><input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="w-full rounded-2xl border px-4 py-3 text-sm" /><div className="grid grid-cols-2 gap-2"><input value={service} onChange={(e) => setService(e.target.value)} placeholder="Service name" className="min-w-0 rounded-2xl border px-3 py-3 text-xs" /><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="Starting price" className="min-w-0 rounded-2xl border px-3 py-3 text-xs" /></div><button disabled={posting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 py-3.5 text-xs font-black text-white"><Upload className="h-4 w-4" />{posting ? "Publishing..." : `Publish ${kind}`}</button></form></section><section className="mt-5"><div className="flex justify-between"><h2 className="font-black">Your content</h2><span className="text-xs text-gray-400">{uploads.length} uploads</span></div><div className="mt-3 grid grid-cols-3 gap-1">{uploads.map((item) => <div key={item.id} className="relative aspect-square overflow-hidden rounded-md bg-gray-900">{item.mediaType === "image" ? <img src={item.media} className="h-full w-full object-cover" /> : <video src={item.media} className="h-full w-full object-cover" />}<span className="absolute right-1 top-1 text-white">{item.kind === "reel" ? <PlaySquare className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}</span></div>)}</div></section></> : <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="text-sm font-black">Customer account</h2><p className="mt-2 text-xs leading-5 text-gray-500">Manage bookings, saved vendors and rewards. Your phone number always stays private.</p></section>}
      <section className="mt-5 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">{menu.map(({ label, hint, href, icon: Icon }, i) => <Link key={label} to={href} className={`flex items-center gap-3 px-4 py-4 ${i ? "border-t border-gray-100" : ""}`}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="block truncate text-[10px] text-gray-400">{hint}</small></span><ChevronRight className="h-4 w-4 text-gray-400" /></Link>)}</section>
      <label className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4"><input type="checkbox" checked={analyticsConsent} onChange={event=>{const value=event.target.checked;setAnalyticsConsent(value);localStorage.setItem("vizha_analytics_consent",value?"granted":"denied")}} className="h-5 w-5 accent-rose-600"/><span><strong className="block text-xs">Share diagnostics</strong><small className="text-[10px] text-gray-500">Help improve crashes and performance. Optional.</small></span></label>
      <button onClick={() => void signOut()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-4 text-sm font-black text-rose-600"><LogOut className="h-4 w-4" />Sign out</button>
      <button onClick={()=>setDeleteOpen(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-red-600"><Trash2 className="h-4 w-4"/>Delete my account</button>
      {deleteOpen&&<div className="fixed inset-0 z-[140] grid place-items-center bg-black/55 p-5"><section className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"><h2 className="text-xl font-black">Delete account permanently?</h2><p className="mt-2 text-xs leading-5 text-gray-500">Your profile and linked personal data will be deleted. This action cannot be undone.</p><div className="mt-5 grid grid-cols-2 gap-2"><button disabled={deleting} onClick={()=>setDeleteOpen(false)} className="rounded-2xl bg-gray-100 py-3 text-sm font-bold">Cancel</button><button disabled={deleting} onClick={()=>void removeAccount()} className="rounded-2xl bg-red-600 py-3 text-sm font-black text-white disabled:opacity-60">{deleting?"Deleting...":"Delete permanently"}</button></div></section></div>}
    </main><MobileBottomNav />
  </div>;
}
