import { ArrowRight, Building2, Gift, Hash, QrCode, Sparkles, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const tools = [
  {
    href: "/invitations",
    icon: QrCode,
    eyebrow: "Design & share",
    title: "Invitation Maker",
    description: "Create beautiful invitations, download PNG or PDF, share on WhatsApp and collect guest RSVPs with a personal QR code.",
    action: "Create invitation",
    gradient: "from-[#881337] via-[#be123c] to-[#e11d48]",
    glow: "bg-rose-300/30",
  },
  {
    href: "/tools/hashtag-generator",
    icon: Hash,
    eyebrow: "Free creative tool",
    title: "Hashtag Generator",
    description: "Mix two names and instantly discover romantic, funny, traditional and Tamil-style celebration hashtags.",
    action: "Generate hashtags",
    gradient: "from-violet-950 via-violet-700 to-fuchsia-600",
    glow: "bg-fuchsia-300/30",
  },
  {
    href: "/referrals",
    icon: Gift,
    eyebrow: "Share & earn",
    title: "Referral Rewards",
    description: "Invite friends to VizhaOne, earn 10 points for every completed booking and unlock a Rs 999 reward at 100 points.",
    action: "Open rewards wallet",
    gradient: "from-amber-950 via-orange-700 to-amber-500",
    glow: "bg-amber-200/30",
  },
  {
    href: "/vendor-onboarding",
    icon: Building2,
    eyebrow: "Grow your business",
    title: "Add Your Services",
    description: "Register your business, pricing and contact details. Connect with our team on WhatsApp and get onboarded within 24 hours.",
    action: "Register as a vendor",
    gradient: "from-emerald-950 via-teal-700 to-emerald-500",
    glow: "bg-emerald-200/30",
  },
];

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-[#fffafb] pb-20 md:pb-0">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0519] via-[#881337] to-[#e11d48] px-5 py-16 text-white sm:py-24">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-fuchsia-300/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="relative mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em]">
              <WandSparkles className="h-4 w-4" /> VizhaOne Celebration Studio
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-6xl">
              Create, celebrate and earn—all in one place.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-rose-100 sm:text-lg">
              Make your event memorable with free creative tools and rewards designed for every celebration.
            </p>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-9 max-w-7xl px-5 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            {tools.map((tool, index) => (
              <Link
                key={tool.href}
                to={tool.href}
                className={`group relative min-h-[390px] overflow-hidden rounded-[2rem] bg-gradient-to-br ${tool.gradient} p-7 text-white shadow-2xl transition duration-300 hover:-translate-y-2 hover:shadow-rose-900/20 sm:p-9`}
              >
                <div className={`absolute -right-14 -top-14 h-48 w-48 rounded-full ${tool.glow} blur-3xl transition group-hover:scale-125`} />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
                      <tool.icon className="h-7 w-7" />
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-10 text-xs font-black uppercase tracking-[.2em] text-white/65">{tool.eyebrow}</p>
                  <h2 className="mt-3 font-display text-3xl font-bold">{tool.title}</h2>
                  <p className="mt-4 flex-1 text-sm leading-7 text-white/75">{tool.description}</p>
                  <span className="mt-8 inline-flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-black text-gray-900 shadow-lg transition group-hover:gap-4">
                    {tool.action}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-center text-sm font-semibold text-gray-500">
            <Sparkles className="h-4 w-4 text-rose-500" /> Start free. Create something beautiful today.
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
