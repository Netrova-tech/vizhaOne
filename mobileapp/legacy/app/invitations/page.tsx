import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Download,
  ImagePlus,
  Languages,
  MapPin,
  MessageCircle,
  QrCode,
  Share2,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { apiUrl } from "@/lib/utils";
import {
  saveInvitation,
  type EventType,
  type InvitationData,
} from "@/lib/celebrationApi";

const themes = [
  {
    id: "rose",
    name: "Royal Rose",
    gradient: "from-[#4c0519] via-[#9f1239] to-[#e11d48]",
    free: true,
  },
  {
    id: "marigold",
    name: "Marigold",
    gradient: "from-[#78350f] via-[#d97706] to-[#f59e0b]",
    free: true,
  },
  {
    id: "emerald",
    name: "Emerald",
    gradient: "from-[#052e16] via-[#047857] to-[#10b981]",
    free: true,
  },
  {
    id: "midnight",
    name: "Midnight Gold",
    gradient: "from-slate-950 via-indigo-950 to-slate-900",
    free: false,
  },
];
const empty: InvitationData = {
  eventType: "wedding",
  customEventType: "",
  primaryName: "",
  secondaryName: "",
  hostName: "",
  eventDate: "",
  eventTime: "18:00",
  venue: "",
  mapUrl: "",
  photoUrl: "",
  language: "en",
  theme: "rose",
  hashtag: "",
  message: "",
};
const eventLabels: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  "baby-shower": "Baby Shower",
  other: "Others",
};

export default function InvitationGeneratorPage() {
  const [form, setForm] = useState<InvitationData>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState<InvitationData | null>(null);
  const [qr, setQr] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tag = localStorage.getItem("vizha_selected_hashtag");
    if (tag) setForm((v) => ({ ...v, hashtag: tag }));
  }, []);
  const publicWebsite = process.env.NEXT_PUBLIC_WEB_URL || "https://www.vizhaone.com";
  const appPreviewUrl = (slug: string) => `${window.location.origin}/#/invite/${slug}`;
  const publicUrl = saved?.slug ? appPreviewUrl(saved.slug) : "";
  const shareUrl = saved?.slug ? `${publicWebsite}/invite/${saved.slug}` : "";
  const celebrationName =
    form.eventType === "other"
      ? form.customEventType?.trim() || "Your Celebration"
      : eventLabels[form.eventType];
  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("images", file);
      const res = await fetch(apiUrl("/api/uploads/cloudinary"), {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.urls?.[0] || data.images?.[0]?.url;
      if (!url) throw new Error("Image URL missing");
      setForm((v) => ({ ...v, photoUrl: url }));
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  async function publish() {
    setSaving(true);
    try {
      const invitation = await saveInvitation(form);
      if (!invitation.slug) throw new Error("Invitation link was not created. Please try again.");
      setSaved(invitation);
      const url = appPreviewUrl(invitation.slug);
      setQr(
        await QRCode.toDataURL(url, {
          width: 420,
          margin: 2,
          color: { dark: "#881337", light: "#ffffff" },
        }),
      );
      toast.success("Invitation published successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish");
    } finally {
      setSaving(false);
    }
  }
  function renderInvitationImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const c = canvas.getContext("2d");
    if (!c) return "";
    const colors: Record<string, [string, string]> = {
      rose: ["#4c0519", "#e11d48"],
      marigold: ["#78350f", "#f59e0b"],
      emerald: ["#052e16", "#10b981"],
      midnight: ["#020617", "#312e81"],
    };
    const [a, b] = colors[form.theme];
    const g = c.createLinearGradient(0, 0, 1080, 1350);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    c.fillStyle = g;
    c.fillRect(0, 0, 1080, 1350);
    c.strokeStyle = "#ffffff55";
    c.lineWidth = 3;
    c.strokeRect(55, 55, 970, 1240);
    c.textAlign = "center";
    c.fillStyle = "#fff";
    c.font = "600 34px Georgia";
    c.fillText(
      `YOU'RE INVITED TO OUR ${celebrationName.toUpperCase()}`,
      540,
      220,
    );
    c.font = "700 78px Georgia";
    c.fillText(form.primaryName || "Your Name", 540, 430);
    if (form.secondaryName) {
      c.font = "italic 42px Georgia";
      c.fillText("&", 540, 510);
      c.font = "700 78px Georgia";
      c.fillText(form.secondaryName, 540, 610);
    }
    c.font = "500 35px Arial";
    c.fillText(
      form.eventDate
        ? new Date(`${form.eventDate}T00:00:00`).toLocaleDateString("en-IN", {
            dateStyle: "long",
          })
        : "Event date",
      540,
      800,
    );
    c.fillText(form.eventTime || "Event time", 540, 860);
    c.font = "500 30px Arial";
    c.fillText(form.venue || "Venue", 540, 970);
    c.font = "italic 34px Georgia";
    c.fillText(form.hashtag || "#CelebrateWithVizhaOne", 540, 1140);
    c.font = "500 22px Arial";
    c.fillStyle = "#ffffffbb";
    c.fillText("Created with VizhaOne", 540, 1250);
    return canvas.toDataURL("image/png");
  }
  function downloadPng() {
    const image = renderInvitationImage();
    if (!image) return;
    const link = document.createElement("a");
    link.download = `vizhaone-${form.primaryName || "invitation"}.png`;
    link.href = image;
    link.click();
  }
  function downloadPdf() {
    const image = renderInvitationImage();
    if (!image) return;
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return toast.error("Please allow popups to export PDF");
    const img = printWindow.document.createElement("img");
    img.src = image;
    img.style.cssText =
      "display:block;width:100%;max-width:760px;margin:0 auto";
    const style = printWindow.document.createElement("style");
    style.textContent =
      "@page{size:A4 portrait;margin:0}body{margin:0;background:white}img{break-inside:avoid}";
    printWindow.document.head.appendChild(style);
    printWindow.document.body.appendChild(img);
    img.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
  function share() {
    if (!publicUrl) return;
    const text = `You're invited! View our ${celebrationName} invitation: ${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  const theme = themes.find((t) => t.id === form.theme) || themes[0];
  return (
    <div className="min-h-screen bg-[#fffafb] pb-20 md:pb-0">
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-[#4c0519] via-[#881337] to-[#e11d48] px-5 py-14 text-white">
          <div className="mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              Free invitation studio
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold sm:text-6xl">
              Create an invitation people will remember.
            </h1>
            <p className="mt-4 max-w-2xl text-rose-100">
              Design, publish, share and collect guest RSVPs from one beautiful
              event page.
            </p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 font-black text-rose-600">
                  1
                </span>
                <h2 className="text-xl font-black">Choose celebration</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  ["wedding", "birthday", "baby-shower", "other"] as EventType[]
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, eventType: type })}
                    className={`rounded-2xl border p-4 text-sm font-bold transition ${form.eventType === type ? "border-rose-500 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-600"}`}
                  >
                    {eventLabels[type]}
                  </button>
                ))}
              </div>
              {form.eventType === "other" && (
                <label className="mt-5 block text-sm font-bold text-gray-700">
                  Enter your event name
                  <input
                    autoFocus
                    value={form.customEventType || ""}
                    onChange={(e) =>
                      setForm({ ...form, customEventType: e.target.value })
                    }
                    maxLength={60}
                    placeholder="Enter your event name"
                    className="mt-2 w-full rounded-xl border border-rose-200 bg-rose-50/40 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  />
                </label>
              )}
            </div>
            <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 font-black text-rose-600">
                  2
                </span>
                <h2 className="text-xl font-black">Add event details</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    key: "primaryName",
                    label:
                      form.eventType === "wedding"
                        ? "Bride name"
                        : "Celebrant name",
                    placeholder: "Enter name",
                  },
                  {
                    key: "secondaryName",
                    label:
                      form.eventType === "wedding"
                        ? "Groom name"
                        : "Co-host / Family name",
                    placeholder: "Optional",
                  },
                  {
                    key: "hostName",
                    label: "Hosted by",
                    placeholder: "Family name",
                  },
                  {
                    key: "venue",
                    label: "Venue",
                    placeholder: "Hall and city",
                  },
                ].map((x) => (
                  <label
                    key={x.key}
                    className="text-sm font-bold text-gray-700"
                  >
                    {x.label}
                    <input
                      value={String(form[x.key as keyof InvitationData] || "")}
                      onChange={(e) =>
                        setForm({ ...form, [x.key]: e.target.value })
                      }
                      placeholder={x.placeholder}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </label>
                ))}
                <label className="text-sm font-bold text-gray-700">
                  Date
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) =>
                      setForm({ ...form, eventDate: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </label>
                <label className="text-sm font-bold text-gray-700">
                  Time
                  <input
                    type="time"
                    value={form.eventTime}
                    onChange={(e) =>
                      setForm({ ...form, eventTime: e.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </label>
                <label className="text-sm font-bold text-gray-700 sm:col-span-2">
                  Google Maps link
                  <input
                    value={form.mapUrl}
                    onChange={(e) =>
                      setForm({ ...form, mapUrl: e.target.value })
                    }
                    placeholder="https://maps.google.com/..."
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </label>
                <label className="text-sm font-bold text-gray-700">
                  Language
                  <select
                    value={form.language}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        language: e.target.value as "en" | "ta",
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  >
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-gray-700">
                  Hashtag
                  <input
                    value={form.hashtag}
                    onChange={(e) =>
                      setForm({ ...form, hashtag: e.target.value })
                    }
                    placeholder="#OurCelebration"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                  />
                </label>
                <label className="text-sm font-bold text-gray-700 sm:col-span-2">
                  Personal message
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    rows={3}
                    placeholder="We would love to celebrate with you..."
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3"
                  />
                </label>
              </div>
              <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 px-5 py-5 text-sm font-bold text-rose-700">
                <ImagePlus className="h-5 w-5" />
                {uploading ? "Uploading photo..." : "Upload celebration photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) =>
                    e.target.files?.[0] && uploadPhoto(e.target.files[0])
                  }
                />
              </label>
            </div>
            <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 font-black text-rose-600">
                  3
                </span>
                <h2 className="text-xl font-black">Choose design</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((t) => (
                  <button
                    disabled={!t.free}
                    key={t.id}
                    onClick={() => setForm({ ...form, theme: t.id })}
                    className={`relative overflow-hidden rounded-2xl border p-3 text-left ${form.theme === t.id ? "border-rose-500 ring-2 ring-rose-100" : "border-gray-200"} ${!t.free ? "opacity-70" : ""}`}
                  >
                    <div
                      className={`h-20 rounded-xl bg-gradient-to-br ${t.gradient}`}
                    />
                    <p className="mt-2 text-sm font-bold">{t.name}</p>
                    {t.free ? (
                      <span className="text-xs text-emerald-600">Free</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Crown className="h-3 w-3" />
                        Premium — coming soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={publish}
              disabled={saving || uploading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#be123c] to-[#e11d48] px-6 py-5 font-black text-white shadow-xl shadow-rose-200 disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish invitation & create QR"}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-black uppercase tracking-[.2em] text-gray-400">
              Live preview
            </p>
            <div
              ref={previewRef}
              className={`relative min-h-[620px] overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.gradient} p-8 text-center text-white shadow-2xl sm:p-12`}
            >
              <div className="absolute inset-5 rounded-[1.5rem] border border-white/30" />
              <div className="relative flex min-h-[540px] flex-col items-center justify-center">
                {form.photoUrl && (
                  <img
                    src={form.photoUrl}
                    alt="Celebration"
                    className="mb-7 h-32 w-32 rounded-full border-4 border-white/70 object-cover shadow-xl"
                  />
                )}
                <p className="text-xs font-bold uppercase tracking-[.25em] text-white/70">
                  You are invited to our
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold">
                  {celebrationName}
                </h3>
                <div className="my-8 h-px w-24 bg-white/40" />
                <p className="font-display text-5xl font-bold">
                  {form.primaryName || "Your Name"}
                </p>
                {form.secondaryName && (
                  <>
                    <p className="my-3 font-display text-2xl italic text-white/70">
                      &
                    </p>
                    <p className="font-display text-5xl font-bold">
                      {form.secondaryName}
                    </p>
                  </>
                )}
                <div className="mt-10 space-y-3 text-sm font-semibold">
                  <p className="flex items-center justify-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {form.eventDate
                      ? new Date(
                          `${form.eventDate}T00:00:00`,
                        ).toLocaleDateString("en-IN", { dateStyle: "long" })
                      : "Choose your date"}{" "}
                    · {form.eventTime}
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {form.venue || "Your beautiful venue"}
                  </p>
                </div>
                {form.message && (
                  <p className="mt-8 max-w-sm font-display text-base italic text-white/80">
                    “{form.message}”
                  </p>
                )}
                <p className="mt-8 text-lg font-black">
                  {form.hashtag || "#CelebrateWithVizhaOne"}
                </p>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Created with VizhaOne
                </p>
              </div>
            </div>
            {saved && (
              <div className="mt-6 rounded-3xl border border-emerald-200 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-3 text-emerald-700">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100">
                    <Check className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-black">Invitation is live</p>
                    <p className="text-xs text-gray-500">
                      QR opens your RSVP event page
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-[150px_1fr] lg:grid-cols-1 xl:grid-cols-[150px_1fr]">
                  {qr && (
                    <img
                      src={qr}
                      alt="Invitation QR"
                      className="w-full rounded-2xl border p-2"
                    />
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={downloadPng}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
                    </button>
                    <button
                      onClick={downloadPdf}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-800"
                    >
                      <Download className="h-4 w-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={share}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard
                          .writeText(publicUrl)
                          .then(() => toast.success("Link copied"))
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"
                    >
                      <Share2 className="h-4 w-4" />
                      Copy link
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700"
                    >
                      <QrCode className="h-4 w-4" />
                      Open RSVP page
                    </a>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Languages className="h-4 w-4" />
              Tamil and English ready
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
