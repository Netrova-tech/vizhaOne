"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Camera,
  ChevronDown,
  ChevronRight,
  Download,
  Gift,
  Heart,
  IndianRupee,
  MapPin,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  UtensilsCrossed,
  WandSparkles,
  X,
} from "lucide-react";
import { MobileAppHeader } from "@/components/layout/MobileAppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ExternalImg } from "@/components/ui/ExternalImg";
import { useCatalog } from "@/hooks/useCatalog";
import { apiUrl, formatPriceOrQuote } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
const quick = [
  [
    "Halls",
    Building2,
    "/halls",
    "/hero/slide-mahal.jpg",
    "Venues & marriage halls",
  ],
  [
    "Catering",
    UtensilsCrossed,
    "/services?search=catering",
    "/categories/cat-1.jpg",
    "Food, menus & service",
  ],
  [
    "Photography",
    Camera,
    "/services?search=photography",
    "/categories/cat-8.jpg",
    "Photos & films",
  ],
  [
    "Decoration",
    Sparkles,
    "/services?search=decoration",
    "/categories/cat-6.jpg",
    "Stage & floral decor",
  ],
] as const;
const tools = [
  [
    "Invitation Maker",
    WandSparkles,
    "/invitations",
    "/tools/invitation-maker.png",
    "Design, QR & share",
  ],
  [
    "Hashtag Generator",
    Sparkles,
    "/tools/hashtag-generator",
    "/tools/hashtag-generator.png",
    "Create unique tags",
  ],
  [
    "Referral Rewards",
    Gift,
    "/referrals",
    "/tools/referral-rewards.png",
    "Invite friends & earn",
  ],
] as const;
const slides = [
  {
    image: "/hero/slide-1.jpg",
    eye: "Discover • Book • Celebrate",
    title: "Your entire celebration, in one app.",
    text: "Trusted local vendors, transparent prices and simple booking.",
    href: "/services",
    action: "Explore services",
  },
  {
    image: "/hero/slide-mahal.jpg",
    eye: "Beautiful venues near you",
    title: "Find the perfect hall for your day.",
    text: "Compare capacity, amenities, availability and prices.",
    href: "/halls",
    action: "Browse halls",
  },
  {
    image: "/hero/slide-2.jpg",
    eye: "Make every detail magical",
    title: "Decoration that brings dreams alive.",
    text: "Discover experienced event professionals near you.",
    href: "/services",
    action: "View decorators",
  },
];
const usableLocation = (value: string) =>
  Boolean(
    value &&
    !["detecting", "unable", "allow location", "fetching"].some((word) =>
      value.toLowerCase().includes(word),
    ),
  );
const featuredTabs = ["All", "Halls", "Catering", "Photography", "Decoration"] as const;
const budgetBands = [
  ["Under \u20b925K", "25000"],
  ["\u20b925K - \u20b950K", "50000"],
  ["\u20b950K - \u20b91L", "100000"],
  ["\u20b91L+", "1000000"],
] as const;
export default function MobileHomePage() {
  const navigate = useNavigate();
  const { halls, categories, services, loading } = useCatalog();
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Detecting your location...");
  const [locating, setLocating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [distance, setDistance] = useState(200);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [category, setCategory] = useState("");
  const [featuredTab, setFeaturedTab] = useState<(typeof featuredTabs)[number]>("All");
  const [update, setUpdate] = useState<{
    version: string;
    message: string;
    storeUrl: string;
    force: boolean;
  } | null>(null);
  const touch = useRef<number | null>(null);
  const autoLocated = useRef(false);
  useEffect(() => {
    const id = setInterval(
      () => setSlide((v) => (v + 1) % slides.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("vizha_current_location") || "null",
      );
      if (saved?.label) setLocation(saved.label);
    } catch {
      void 0;
    }
  }, []);
  const locate = useCallback(async () => {
    setLocating(true);
    try {
      let latitude: number, longitude: number;
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        let permission = await Geolocation.checkPermissions();
        if (
          permission.location === "prompt" ||
          permission.location === "prompt-with-rationale"
        )
          permission = await Geolocation.requestPermissions();
        if (permission.location === "denied") throw new Error("denied");
        const p = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 300000,
        });
        latitude = p.coords.latitude;
        longitude = p.coords.longitude;
      } catch (nativeError) {
        if (nativeError instanceof Error && nativeError.message === "denied")
          throw nativeError;
        if (!navigator.geolocation) throw nativeError;
        const p = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 300000,
          }),
        );
        latitude = p.coords.latitude;
        longitude = p.coords.longitude;
      }
      let detected = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          { headers: { "Accept-Language": "en" } },
        );
        if (res.ok) {
          const data = await res.json();
          detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state_district ||
            detected;
        }
      } catch {
        void 0;
      }
      localStorage.setItem(
        "vizha_current_location",
        JSON.stringify({ latitude, longitude, label: detected }),
      );
      setLocation(detected);
      const raw = localStorage.getItem("vizha_demo_user");
      if (raw) {
        const session = {
          ...JSON.parse(raw),
          location: detected,
          latitude,
          longitude,
        };
        localStorage.setItem("vizha_demo_user", JSON.stringify(session));
        window.dispatchEvent(new Event("vizha_auth_change"));
      }
    } catch (e) {
      const denied =
        e instanceof Error &&
        (e.message === "denied" ||
          e.message.toLowerCase().includes("permission"));
      setLocation(
        denied
          ? "Allow location permission · Tap to retry"
          : "Location unavailable · Tap to retry",
      );
    } finally {
      setLocating(false);
    }
  }, []);
  useEffect(() => {
    if (!autoLocated.current && user) {
      autoLocated.current = true;
      void locate();
    }
  }, [locate, user]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [{ Capacitor }, { App }] = await Promise.all([
          import("@capacitor/core"),
          import("@capacitor/app"),
        ]);
        if (!Capacitor.isNativePlatform()) return;
        const [info, response] = await Promise.all([
          App.getInfo(),
          fetch(apiUrl("/api/app-config"), { cache: "no-store" }),
        ]);
        if (!response.ok) return;
        const config = (await response.json()).android;
        const installed = Number(info.build || 0),
          latest = Number(config?.latestVersionCode || 0);
        if (active && latest > installed)
          setUpdate({
            version: String(config.latestVersionName || latest),
            message: String(
              config.message || "A new VizhaOne update is available.",
            ),
            storeUrl: String(config.storeUrl),
            force: Boolean(config.forceUpdate),
          });
      } catch {
        void 0;
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);
  function searchServices(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    const query = search.trim();
    if (query) p.set("search", query);
    if (category) p.set("category", category);
    p.set("distance", String(Math.min(1000, Math.max(1, distance))));
    p.set("maxPrice", String(Math.min(1000000, Math.max(0, maxPrice))));
    navigate(`/services?${p.toString()}`);
  }
  const featuredItems = [
    ...halls.slice(0, 5).map((hall) => ({
      id: hall.id,
      type: "hall" as const,
      title: hall.name,
      location: hall.location || hall.place_name || "Near you",
      image: hall.image_url || "/hero/slide-mahal.jpg",
      price: hall.price_per_day || hall.price_morning || hall.price_evening || 0,
      category: "Halls",
      rating: hall.rating || 4.7,
      reviews: hall.review_count || 0,
    })),
    ...services.slice(0, 10).map((service) => ({
      id: service.id,
      type: "service" as const,
      title: service.title,
      location: service.location || service.place_name || "Near you",
      image: service.image_url || "/hero/slide-2.jpg",
      price: service.price_min || service.price || 0,
      category: service.categories?.category_name || "Service",
      rating: 4.7,
      reviews: 0,
    })),
  ];
  const visibleFeatured = featuredItems.filter((item) => {
    if (featuredTab === "All") return true;
    return `${item.category} ${item.title}`.toLowerCase().includes(featuredTab.toLowerCase());
  });
  return (
    <div className="native-mobile-page min-h-dvh bg-[#fffafb] pb-24">
      <MobileAppHeader />
      {update && (
        <div
          className="fixed inset-0 z-[180] grid place-items-end bg-black/55 p-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))]"
          role="dialog"
          aria-modal="true"
          aria-label="VizhaOne update available"
        >
          <section className="w-full rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-[#7c1749] text-white shadow-lg">
                <Download className="h-7 w-7" />
              </span>
              {!update.force && (
                <button
                  type="button"
                  onClick={() => setUpdate(null)}
                  aria-label="Remind me later"
                  className="rounded-full bg-gray-100 p-2 text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-rose-600">
              New version {update.version}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              Update VizhaOne
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {update.message}
            </p>
            <a
              href={update.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 text-sm font-black text-white shadow-lg shadow-rose-200"
            >
              <Download className="h-4 w-4" />
              Update from Play Store
            </a>
            {!update.force && (
              <button
                type="button"
                onClick={() => setUpdate(null)}
                className="mt-2 w-full py-3 text-xs font-bold text-gray-500"
              >
                Remind me later
              </button>
            )}
          </section>
        </div>
      )}
      <main className="px-4 pt-[88px]">
        <button
          onClick={locate}
          className="mb-4 flex w-full items-center gap-2 text-left"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <small className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Your location
            </small>
            <strong className="block truncate text-sm">
              {locating ? "Fetching current location..." : location}
            </strong>
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
        <section
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const d = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(d) > 45)
              setSlide(
                (v) => (v + (d < 0 ? 1 : slides.length - 1)) % slides.length,
              );
            touch.current = null;
          }}
          className="relative h-[292px] overflow-hidden rounded-[26px] text-white shadow-xl"
        >
          {slides.map((s, i) => (
            <img
              key={s.image}
              src={s.image}
              alt="Celebration"
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${i === slide ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
          <div className="relative flex h-full flex-col justify-center p-6">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-rose-100">
              {slides[slide].eye}
            </p>
            <h1 className="mt-2 max-w-[290px] text-[29px] font-black leading-[1.08] tracking-[-.04em]">
              {slides[slide].title}
            </h1>
            <p className="mt-3 max-w-[285px] text-sm leading-5 text-white/85">
              {slides[slide].text}
            </p>
            <Link
              to={slides[slide].href}
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-rose-700"
            >
              {slides[slide].action}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="absolute bottom-4 right-5 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full ${i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </section>
        <form
          onSubmit={searchServices}
          className="mt-4 rounded-3xl border border-rose-200 bg-white p-2 shadow-[0_10px_30px_rgba(136,19,55,.12)]"
        >
          <div className="flex items-center gap-1">
            <Search className="ml-2 h-5 w-5 flex-none text-rose-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Makeup, bridal, vendor or city..."
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm font-bold text-gray-950 outline-none placeholder:font-medium placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-label="Search filters"
              className={`grid h-11 w-11 place-items-center rounded-xl ${filtersOpen ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <button className="rounded-xl bg-rose-600 px-4 py-3 text-xs font-black text-white">
              Search
            </button>
          </div>
          {filtersOpen && (
            <div className="border-t border-rose-100 px-2 pb-2 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-black text-gray-700">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-950"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[10px] font-black text-gray-700">
                  Maximum price
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-950"
                  >
                    <option value="25000">Up to ₹25K</option>
                    <option value="50000">Up to ₹50K</option>
                    <option value="100000">Up to ₹1L</option>
                    <option value="500000">Up to ₹5L</option>
                    <option value="1000000">Up to ₹10L</option>
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-[10px] font-black text-gray-700">
                <span className="flex justify-between">
                  <span>Distance from {location}</span>
                  <b className="text-rose-700">{distance} km</b>
                </span>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="mt-2 w-full accent-rose-600"
                />
                <span className="flex justify-between text-[9px] font-bold text-gray-500">
                  <span>1 km</span>
                  <span>1000 km</span>
                </span>
              </label>
            </div>
          )}
        </form>
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-500">Handpicked for you</p>
              <h2 className="mt-1 text-[21px] font-black tracking-tight">Featured on VizhaOne</h2>
            </div>
            <Link to="/services" className="text-[11px] font-black text-rose-600">See all</Link>
          </div>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {featuredTabs.map((tab) => <button key={tab} type="button" onClick={() => setFeaturedTab(tab)} className={`min-h-9 shrink-0 rounded-xl px-4 text-[11px] font-black transition ${featuredTab === tab ? "bg-[#e9004f] text-white shadow-md shadow-rose-200" : "border border-rose-100 bg-white text-gray-600"}`}>{tab}</button>)}
          </div>
          <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {(visibleFeatured.length ? visibleFeatured : featuredItems).slice(0, 8).map((item) => (
              <Link key={`${item.type}-${item.id}`} to={`/${item.type === "hall" ? "halls" : "services"}/${item.id}`} className="w-[47vw] max-w-[190px] flex-none snap-start overflow-hidden rounded-[20px] border border-rose-100 bg-white shadow-[0_8px_24px_rgba(61,8,37,.10)]">
                <div className="relative h-32 overflow-hidden">
                  <ExternalImg src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-rose-500 shadow"><Heart className="h-4 w-4" /></span>
                </div>
                <div className="p-3">
                  <h3 className="truncate text-[13px] font-black text-gray-950">{item.title}</h3>
                  <p className="mt-1 text-[10px] font-bold text-amber-500">\u2605 {item.rating.toFixed(1)} <span className="font-medium text-gray-400">({item.reviews} reviews)</span></p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-gray-500"><MapPin className="h-3 w-3 text-rose-500" />{item.location}</p>
                  <p className="mt-2 truncate text-xs font-black text-gray-900">{formatPriceOrQuote(item.price)}</p>
                  <span className="mt-3 flex min-h-9 items-center justify-center gap-1 rounded-xl border border-rose-300 text-[10px] font-black text-rose-600">View details <ArrowRight className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-500">
                What are you planning?
              </p>
              <h2 className="mt-1 text-[22px] font-black tracking-tight">
                Popular services
              </h2>
            </div>
            <Link
              to="/categories"
              className="rounded-full bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-600"
            >
              View all
            </Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {quick.map(([label, Icon, href, image, hint]) => (
              <Link
                key={label}
                to={href}
                className="group relative h-36 w-[44vw] max-w-[180px] flex-none snap-start overflow-hidden rounded-[20px] bg-gray-900 shadow-md"
              >
                <img
                  src={image}
                  alt={label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-active:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-rose-600 shadow">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="absolute bottom-3 left-3 right-3 text-white">
                  <strong className="block text-sm">{label}</strong>
                  <small className="mt-0.5 block text-[9px] text-white/75">
                    {hint}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-500">
              Made for your celebration
            </p>
            <h2 className="mt-1 text-[22px] font-black tracking-tight">
              Create & celebrate
            </h2>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-[#3d0825] via-[#650c3a] to-[#8f174e] p-3 shadow-lg">
            <p className="px-1 pb-3 text-base font-black text-white">Make your celebration special</p>
            <div className="grid grid-cols-3 gap-2">
            {tools.map(([label, Icon, href, image, hint], index) => (
              <Link
                key={label}
                to={href}
                className="relative flex min-h-32 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-2 py-3 text-center text-gray-950 shadow-md"
              >
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${index === 1 ? "bg-cyan-50 text-cyan-600" : "bg-rose-50 text-rose-600"}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-2">
                  <strong className="block text-[11px] leading-4">{label}</strong>
                  <small className="mt-1 block text-[8px] leading-3 text-gray-500">
                    {hint}
                  </small>
                </span>
              </Link>
            ))}
            </div>
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-3 flex justify-between">
            <h2 className="text-[22px] font-black">Featured halls</h2>
            <Link to="/halls" className="text-xs font-bold text-rose-600">
              See all
            </Link>
          </div>
          {!loading && !halls.length ? (
            <Link
              to="/halls"
              className="flex items-center gap-4 rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 p-5"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-rose-600 shadow-sm">
                <Building2 className="h-7 w-7" />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">
                  Discover halls near you
                </strong>
                <small className="mt-1 block text-[10px] leading-4 text-gray-500">
                  Browse venues by location, capacity and price.
                </small>
              </span>
              <ChevronRight className="h-5 w-5 text-rose-500" />
            </Link>
          ) : (
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {loading
                ? [1, 2].map((n) => (
                    <div
                      key={n}
                      className="h-56 w-[78vw] flex-none animate-pulse rounded-3xl bg-rose-100"
                    />
                  ))
                : halls.slice(0, 5).map((h) => (
                    <Link
                      key={h.id}
                      to={`/halls/${h.id}`}
                      className="w-[78vw] max-w-[310px] flex-none snap-center overflow-hidden rounded-3xl border bg-white shadow-sm"
                    >
                      <ExternalImg
                        src={h.image_url || "/hero/slide-mahal.jpg"}
                        alt={h.name}
                        className="h-36 w-full object-cover"
                      />
                      <div className="p-4">
                        <h3 className="truncate text-sm font-black">
                          {h.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {h.location || h.place_name || "Tamil Nadu"}
                        </p>
                        <p className="mt-3 text-sm font-black text-rose-600">
                          {formatPriceOrQuote(
                            h.price_per_day ||
                              h.price_morning ||
                              h.price_evening,
                          )}
                        </p>
                      </div>
                    </Link>
                  ))}
            </div>
          )}
        </section>
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-500">Real celebrations. Real ideas.</p><h2 className="mt-1 text-[21px] font-black">Get inspired</h2></div><Link to="/reels" className="text-[11px] font-black text-rose-600">See all</Link></div>
          <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {services.slice(0, 6).map((service) => <Link key={`inspire-${service.id}`} to="/reels" className="relative h-44 w-[31vw] max-w-[132px] flex-none snap-start overflow-hidden rounded-[18px] bg-gray-900 shadow-md"><ExternalImg src={service.image_url || "/hero/slide-3.jpg"} alt={service.title} className="h-full w-full object-cover"/><span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/5"/><span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-600"><Play className="h-3.5 w-3.5 fill-current"/></span><span className="absolute inset-x-2 bottom-3 line-clamp-2 text-[10px] font-black leading-4 text-white">{service.title}</span></Link>)}
          </div>
        </section>
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[19px] font-black">Plan your celebration budget</h2><Link to="/planner/budget" className="text-[11px] font-black text-rose-600">See all</Link></div>
          <div className="grid grid-cols-4 gap-2">{budgetBands.map(([label, value]) => <Link key={value} to={`/services?maxPrice=${value}`} className="flex min-h-12 items-center justify-center rounded-xl bg-white px-1 text-center text-[9px] font-black text-gray-700 shadow-sm ring-1 ring-rose-100"><IndianRupee className="mr-0.5 h-3 w-3 text-rose-500"/>{label.replace("\u20b9", "")}</Link>)}</div>
        </section>
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">
                Near {location}
              </p>
              <h2 className="mt-1 text-[22px] font-black text-gray-950">
                All categories
              </h2>
            </div>
            <Link
              to="/categories"
              className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categories.slice(0, 12).map((cat, i) => {
              const fallback =
                services.find((s) => s.category_id === cat.id)?.image_url ||
                `/categories/cat-${(i % 17) + 1}.jpg`;
              return (
                <Link
                  key={cat.id}
                  to={`/services?category=${cat.id}&distance=200`}
                  className="group relative h-28 overflow-hidden rounded-2xl border border-white bg-gray-900 shadow-[0_8px_20px_rgba(40,15,25,.16)]"
                >
                  <img
                    src={cat.category_image || fallback}
                    onError={(event) => {
                      if (
                        event.currentTarget.src !==
                        new URL(fallback, window.location.href).href
                      )
                        event.currentTarget.src = fallback;
                    }}
                    alt={cat.category_name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-active:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <span className="absolute inset-x-1 bottom-2 line-clamp-2 text-center text-[11px] font-black leading-4 text-white drop-shadow">
                    {cat.category_name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <Link
          to="/vendor-onboarding"
          className="relative mt-7 flex min-h-36 items-center gap-3 overflow-hidden rounded-[24px] bg-gradient-to-r from-gray-950 via-[#280818] to-[#760b3e] p-5 text-white shadow-xl"
        >
          <span className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-rose-500/20 blur-2xl" />
          <span className="relative flex-1"><small className="text-[10px] font-bold uppercase tracking-widest text-rose-200">Are you a celebration vendor?</small><strong className="mt-1 block max-w-[240px] text-xl leading-6">Grow your business with VizhaOne</strong><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[11px] font-black text-gray-950">List your business <ArrowRight className="h-4 w-4"/></span></span>
          <Building2 className="relative h-14 w-14 text-rose-200" />
        </Link>
      </main>
      <MobileBottomNav />
    </div>
  );
}
