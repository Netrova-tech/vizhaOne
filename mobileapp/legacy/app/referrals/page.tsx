import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Gift,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { fetchReferralWallet, type ReferralWallet } from "@/lib/celebrationApi";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [mobile, setMobile] = useState(
    (user?.mobile || "").replace(/\D/g, "").slice(-10),
  );
  const [wallet, setWallet] = useState<ReferralWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendCode, setFriendCode] = useState(
    localStorage.getItem("vizha_referral_code") || "",
  );
  useEffect(() => {
    if (user?.mobile && !mobile)
      setMobile(user.mobile.replace(/\D/g, "").slice(-10));
  }, [user, mobile]);
  async function load() {
    if (mobile.length !== 10)
      return toast.error("Enter a valid 10-digit mobile number");
    setLoading(true);
    try {
      setWallet(await fetchReferralWallet(mobile));
      localStorage.setItem("vizha_rewards_mobile", mobile);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load wallet");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const saved = localStorage.getItem("vizha_rewards_mobile");
    if (saved?.length === 10) {
      setMobile(saved);
      fetchReferralWallet(saved)
        .then(setWallet)
        .catch(() => undefined);
    }
  }, []);
  function saveFriendCode() {
    const value = friendCode.trim().toUpperCase();
    if (!value) return toast.error("Enter a referral code");
    localStorage.setItem("vizha_referral_code", value);
    setFriendCode(value);
    toast.success("Referral code saved for your next booking");
  }
  async function copyLink() {
    if (!wallet) return;
    const link = `${window.location.origin}/referrals?code=${wallet.code}`;
    await navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  }
  function whatsapp() {
    if (!wallet) return;
    const text = `Plan your celebration with VizhaOne! Use my referral code ${wallet.code} on your first paid booking: ${window.location.origin}/referrals?code=${wallet.code}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (code) {
      setFriendCode(code.toUpperCase());
      localStorage.setItem("vizha_referral_code", code.toUpperCase());
    }
  }, []);
  const progress = Math.min(wallet?.points || 0, 100);
  return (
    <div className="min-h-screen bg-[#fffafb] pb-20 md:pb-0">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#3b0764] via-[#881337] to-[#e11d48] px-5 py-16 text-white">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em]">
              <Gift className="h-4 w-4" />
              VizhaOne Rewards
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold sm:text-6xl">
              Share celebrations.{" "}
              <span className="text-amber-300">Earn rewards.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-white/75">
              Every successful paid referral earns 10 points. Reach 100 points
              and unlock a Rs 999 VizhaOne booking voucher.
            </p>
          </div>
        </section>
        <section className="mx-auto -mt-8 max-w-6xl px-5 pb-20 relative z-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black text-gray-900">
                Open your rewards wallet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Use the mobile number connected to your bookings.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 rounded-xl border border-gray-200 bg-gray-50">
                  <span className="px-4 py-3 font-bold text-gray-500">+91</span>
                  <input
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit mobile"
                    className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none"
                  />
                </div>
                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading ? "Loading..." : "View wallet"}
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black">
                Have a friend's referral code?
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Save it now. It will apply automatically to your next booking.
              </p>
              <div className="mt-5 flex gap-2">
                <input
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                  placeholder="VIZHA1234ABCD"
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 font-bold uppercase outline-none focus:border-violet-400"
                />
                <button
                  onClick={saveFriendCode}
                  className="rounded-xl bg-violet-600 px-5 py-3 font-black text-white"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          {wallet && (
            <>
              <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#4c0519] via-[#9f1239] to-[#e11d48] p-7 text-white shadow-2xl sm:p-9">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.2em] text-rose-200">
                        Available balance
                      </p>
                      <p className="mt-2 text-5xl font-black">
                        {wallet.points}
                        <span className="ml-2 text-lg text-rose-200">
                          points
                        </span>
                      </p>
                    </div>
                    <WalletCards className="h-10 w-10 text-rose-200" />
                  </div>
                  <div className="mt-8">
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span>{progress}/100 points</span>
                      <span>Rs 999 voucher</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-black/20">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-rose-100">
                      {wallet.rewardReady
                        ? "Your reward is ready to redeem!"
                        : `${100 - progress} more points to unlock your reward.`}
                    </p>
                  </div>
                  <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5">
                    <p className="text-xs uppercase tracking-widest text-rose-200">
                      Your referral code
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-2xl font-black tracking-wider">
                        {wallet.code}
                      </p>
                      <button
                        onClick={() =>
                          navigator.clipboard
                            .writeText(wallet.code)
                            .then(() => toast.success("Code copied"))
                        }
                        className="rounded-xl bg-white/15 p-3 hover:bg-white/25"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <button
                      onClick={whatsapp}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-5 text-base font-black text-white shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#1fbd59] sm:text-lg"
                    >
                      <MessageCircle className="h-6 w-6" />
                      Share Referral Link
                    </button>
                    <button
                      onClick={copyLink}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/25"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Referral Link
                    </button>
                  </div>
                </article>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <Users className="h-7 w-7 text-violet-600" />
                    <p className="mt-5 text-3xl font-black">
                      {wallet.totalReferrals}
                    </p>
                    <p className="text-xs font-bold text-gray-500">
                      Successful referrals
                    </p>
                  </div>
                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <TicketCheck className="h-7 w-7 text-emerald-600" />
                    <p className="mt-5 text-3xl font-black">
                      Rs {wallet.rewardValue}
                    </p>
                    <p className="text-xs font-bold text-gray-500">
                      Unlocked value
                    </p>
                  </div>
                  <div className="col-span-2 rounded-3xl border border-amber-100 bg-amber-50 p-6">
                    <Trophy className="h-7 w-7 text-amber-600" />
                    <p className="mt-3 font-black text-amber-950">
                      10 confirmed referrals = 100 points
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Reward is credited only after a referred booking is
                      completed.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-7 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-rose-600" />
                  <h2 className="text-xl font-black">Referral activity</h2>
                </div>
                {wallet.entries.length ? (
                  <div className="mt-5 divide-y">
                    {wallet.entries.map((entry) => (
                      <div
                        key={entry.bookingId}
                        className="flex items-center justify-between gap-3 py-4"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            Friend ending in ••••{" "}
                            {entry.referredMobile.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Booking {entry.bookingId}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${entry.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : entry.status === "reversed" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}
                        >
                          {entry.status} ·{" "}
                          {entry.status === "confirmed" ? "+" : ""}
                          {entry.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                    Share your code to begin earning points.
                  </div>
                )}
              </div>
            </>
          )}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Share2Icon,
                title: "Share your link",
                text: "Send your unique link to friends planning a celebration.",
              },
              {
                icon: ShieldCheck,
                title: "Paid booking",
                text: "Points stay pending until their booking is completed.",
              },
              {
                icon: Gift,
                title: "Unlock Rs 999",
                text: "Reach 100 points and receive a VizhaOne booking voucher.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-6"
              >
                <Icon className="h-6 w-6 text-rose-600" />
                <p className="mt-4 font-black">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
function Share2Icon(props: { className?: string }) {
  return <Sparkles {...props} />;
}
