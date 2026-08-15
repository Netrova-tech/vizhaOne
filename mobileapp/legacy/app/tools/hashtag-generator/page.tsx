import { useMemo, useState } from "react";
import { Copy, Hash, Heart, Laugh, Landmark, Languages, Share2, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { shareContent } from "@/lib/nativeShare";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

type Style = "romantic" | "funny" | "traditional" | "tamil";
const styleMeta = {
  romantic: { label: "Romantic", icon: Heart, color: "from-rose-500 to-pink-500" },
  funny: { label: "Fun & Playful", icon: Laugh, color: "from-amber-400 to-orange-500" },
  traditional: { label: "Traditional", icon: Landmark, color: "from-purple-500 to-violet-600" },
  tamil: { label: "Tamil Style", icon: Languages, color: "from-emerald-500 to-teal-600" },
};
const clean = (value: string) => value.trim().replace(/[^a-zA-Z0-9]/g, "");
function generate(first: string, second: string, style: Style) {
  const a = clean(first), b = clean(second); if (!a || !b) return [];
  const year = new Date().getFullYear(); const initials = `${a[0]}${b[0]}`.toUpperCase();
  const sets: Record<Style, string[]> = {
    romantic: [`${a}Weds${b}`, `${a}Found${b}`, `${a}And${b}Forever`, `${initials}LoveStory`, `TogetherWith${a}${b}`, `${a}${b}EverAfter`],
    funny: [`${a}Got${b}`, `${b}SaidYesTo${a}`, `${a}${b}Hitched`, `Mission${initials}Possible`, `${a}${b}PartyOfTwo`, `Finally${a}${b}`],
    traditional: [`SubhaMangalam${a}${b}`, `${a}${b}Kalyanam`, `The${a}${b}Wedding`, `${initials}Thirumanam${year}`, `Bless${a}${b}`, `${a}${b}Mangalyam`],
    tamil: [`Namma${a}${b}`, `${a}${b}KalyanaVizha`, `${initials}ThirumanaThiruvizha`, `${a}KaramPiditha${b}`, `Anbudan${a}${b}`, `${a}${b}InainthaNeram`],
  };
  return sets[style].map((item) => `#${item}`);
}

export default function HashtagGeneratorPage() {
  const [first, setFirst] = useState(""); const [second, setSecond] = useState(""); const [style, setStyle] = useState<Style>("romantic");
  const tags = useMemo(() => generate(first, second, style), [first, second, style]);
  async function copy(tag: string) { await navigator.clipboard.writeText(tag); localStorage.setItem("vizha_selected_hashtag", tag); toast.success("Hashtag copied and saved for your invitation"); }
  async function share(tag: string) { try{const result=await shareContent({ title: "Our VizhaOne hashtag", text: tag });if(result==="copied")toast.success("Hashtag copied") }catch{void 0} }
  return <div className="min-h-screen bg-[#fffafb] pb-20 md:pb-0"><Navbar />
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0519] via-[#9f1239] to-[#e11d48] px-5 py-16 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em]"><WandSparkles className="h-4 w-4" /> Free celebration tool</span>
          <h1 className="font-display text-4xl font-bold sm:text-6xl">Find a hashtag that feels <span className="text-rose-200">uniquely yours.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-rose-100 sm:text-lg">Personal, memorable hashtags for every photo, reel and invitation.</p></div>
      </section>
      <section className="mx-auto -mt-8 max-w-5xl px-5 pb-20 relative z-10">
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl shadow-rose-900/10 sm:p-9">
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-gray-700">Bride / First name<input value={first} onChange={e=>setFirst(e.target.value)} placeholder="e.g. Arun" className="mt-2 w-full rounded-2xl border border-gray-200 px-5 py-4 text-base outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" /></label><label className="text-sm font-bold text-gray-700">Groom / Second name<input value={second} onChange={e=>setSecond(e.target.value)} placeholder="e.g. Priya" className="mt-2 w-full rounded-2xl border border-gray-200 px-5 py-4 text-base outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" /></label></div>
          <p className="mb-3 mt-7 text-sm font-bold text-gray-700">Choose your vibe</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(Object.keys(styleMeta) as Style[]).map(key=>{const meta=styleMeta[key];return <button key={key} onClick={()=>setStyle(key)} className={`rounded-2xl border p-4 text-left transition ${style===key?"border-rose-400 bg-rose-50 shadow-md":"border-gray-200 hover:border-rose-200"}`}><meta.icon className={`mb-3 h-6 w-6 ${style===key?"text-rose-600":"text-gray-400"}`} /><span className="text-sm font-bold text-gray-800">{meta.label}</span></button>})}</div>
        </div>
        <div className="mt-8"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-rose-100 p-2 text-rose-600"><Sparkles className="h-5 w-5" /></div><div><h2 className="text-xl font-black text-gray-900">Your hashtag collection</h2><p className="text-sm text-gray-500">Copying also saves it for your invitation.</p></div></div>
          {tags.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tags.map((tag,index)=><article key={tag} className="group rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className={`mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${styleMeta[style].color} text-white`}><Hash className="h-5 w-5" /></div><p className="break-all text-lg font-black text-gray-900">{tag}</p><p className="mt-1 text-xs text-gray-400">Option {index+1}</p><div className="mt-5 flex gap-2"><button onClick={()=>copy(tag)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-xs font-bold text-white"><Copy className="h-4 w-4"/>Copy</button><button onClick={()=>share(tag)} className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-rose-50 hover:text-rose-600"><Share2 className="h-4 w-4"/></button></div></article>)}</div> : <div className="rounded-3xl border-2 border-dashed border-rose-200 bg-white py-16 text-center"><Hash className="mx-auto h-10 w-10 text-rose-300"/><p className="mt-4 font-bold text-gray-700">Enter both names to reveal your hashtags</p></div>}
        </div>
      </section>
    </main><SiteFooter/><MobileBottomNav/></div>;
}
