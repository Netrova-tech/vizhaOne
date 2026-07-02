"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CalendarCheck,
  ChevronRight,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type QuickAction = {
  label: string;
  to: string;
};

type BookingDraft = {
  eventType?: string;
  location?: string;
  date?: string;
  guests?: string;
  services?: string;
  contact?: string;
};

type BookingStep = "idle" | "event" | "location" | "date" | "guests" | "services" | "contact" | "done";

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Hi, Vanakkam! I am VizhaOne AI. I can help you find halls, services, prices, vendors, and guide your booking inside VizhaOne.",
  },
];

const quickQuestions = [
  "Start booking",
  "Find marriage hall",
  "Need decoration",
  "Check prices",
];

const serviceWords = ["decor", "decoration", "photo", "photography", "catering", "makeup", "bridal", "balloon", "sound", "music", "stage", "service"];
const appWords = [
  "vizha", "vizhaone", "hall", "mahal", "mandap", "venue", "service", "book", "booking", "price", "cost", "rate",
  "vendor", "owner", "contact", "whatsapp", "marriage", "birthday", "function", "event", "admin", "login",
  "திருமணம்", "மண்டபம்", "விலை", "சேவை", "புக்", "హాల్", "వేదిక", "ధర", "సేవ", "బుకింగ్",
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function detectLanguage(input: string): "ta" | "te" | "en" {
  if (/[\u0B80-\u0BFF]/.test(input) || /vanakkam|epdi|enna|booking pann|pannanum|venum|iruka/.test(normalize(input))) return "ta";
  if (/[\u0C00-\u0C7F]/.test(input) || /telugu|booking chey|kavali|undi|dhara/.test(normalize(input))) return "te";
  return "en";
}

function line(lang: "ta" | "te" | "en", en: string, ta: string, te: string) {
  if (lang === "ta") return ta;
  if (lang === "te") return te;
  return en;
}

function isVizhaOneRelated(input: string) {
  const message = normalize(input);
  return appWords.some((word) => message.includes(word));
}

function getBookingReply(step: BookingStep, input: string, draft: BookingDraft, lang: "ta" | "te" | "en") {
  const nextDraft = { ...draft };

  if (step === "idle") {
    return {
      step: "event" as BookingStep,
      draft: nextDraft,
      text: line(
        lang,
        "Sure. I will guide your booking. What is the event type? Example: marriage, birthday, engagement, reception.",
        "Sure. Booking ku guide panren. Event type enna? Example: marriage, birthday, engagement, reception.",
        "Sure. Booking guide chestanu. Event type enti? Example: marriage, birthday, engagement, reception."
      ),
    };
  }

  if (step === "event") {
    nextDraft.eventType = input;
    return {
      step: "location" as BookingStep,
      draft: nextDraft,
      text: line(lang, "Great. Which city or area do you prefer?", "Super. Endha city/area venum?", "Great. Mee city/area ekkada kavali?"),
    };
  }

  if (step === "location") {
    nextDraft.location = input;
    return {
      step: "date" as BookingStep,
      draft: nextDraft,
      text: line(lang, "Please share the event date or approximate month.", "Event date illa approximate month sollunga.", "Event date leda approximate month cheppandi."),
    };
  }

  if (step === "date") {
    nextDraft.date = input;
    return {
      step: "guests" as BookingStep,
      draft: nextDraft,
      text: line(lang, "How many guests are expected?", "Approx ethana guests varuvanga?", "Approx guests entha mandi?"),
    };
  }

  if (step === "guests") {
    nextDraft.guests = input;
    return {
      step: "services" as BookingStep,
      draft: nextDraft,
      text: line(
        lang,
        "Which services do you need? Example: hall only, decoration, catering, photography, bridal, sound.",
        "Enna services venum? Example: hall only, decoration, catering, photography, bridal, sound.",
        "Ye services kavali? Example: hall only, decoration, catering, photography, bridal, sound."
      ),
    };
  }

  if (step === "services") {
    nextDraft.services = input;
    return {
      step: "contact" as BookingStep,
      draft: nextDraft,
      text: line(
        lang,
        "Almost done. Share your mobile number, or open Plan Event to continue inside VizhaOne.",
        "Almost done. Unga mobile number share pannunga, illa Plan Event open panni continue pannunga.",
        "Almost done. Mee mobile number share cheyyandi, leda Plan Event open chesi continue cheyyandi."
      ),
    };
  }

  nextDraft.contact = input;
  return {
    step: "done" as BookingStep,
    draft: nextDraft,
    text: line(
      lang,
      `Thank you. I collected: ${nextDraft.eventType || "-"} in ${nextDraft.location || "-"}, date ${nextDraft.date || "-"}, ${nextDraft.guests || "-"} guests, services: ${nextDraft.services || "-"}. Please use Plan Event or WhatsApp/call vendors to confirm availability and final price.`,
      `Thank you. Details collect panniten: ${nextDraft.eventType || "-"}, place ${nextDraft.location || "-"}, date ${nextDraft.date || "-"}, guests ${nextDraft.guests || "-"}, services: ${nextDraft.services || "-"}. Plan Event use pannunga or vendor ku WhatsApp/call panni confirm pannunga.`,
      `Thank you. Details collect chesanu: ${nextDraft.eventType || "-"}, place ${nextDraft.location || "-"}, date ${nextDraft.date || "-"}, guests ${nextDraft.guests || "-"}, services: ${nextDraft.services || "-"}. Plan Event use cheyyandi or vendor ki WhatsApp/call cheyyandi.`
    ),
  };
}

function getAssistantReply(input: string): { text: string; actions?: QuickAction[]; startBooking?: boolean } {
  const message = normalize(input);
  const lang = detectLanguage(input);

  if (!message) {
    return { text: line(lang, "Please ask about VizhaOne booking, halls, services, or prices.", "VizhaOne booking, halls, services, price pathi kelunga.", "VizhaOne booking, halls, services, prices gurinchi adagandi.") };
  }

  if (message.includes("thank")) {
    return { text: line(lang, "You are welcome. Happy to help with your VizhaOne booking.", "Welcome. Unga VizhaOne booking ku help panna happy.", "Welcome. Mee VizhaOne booking ki help cheyadam santosham.") };
  }

  if (message.includes("start booking") || message.includes("book") || message.includes("booking") || message.includes("புக்") || message.includes("బుకింగ్")) {
    return { startBooking: true, text: "" };
  }

  if (!isVizhaOneRelated(input)) {
    return {
      text: line(
        lang,
        "I can help only with VizhaOne related topics: halls, services, prices, vendors, booking, and event planning. Please ask about your event requirement.",
        "Naan VizhaOne related topics mattum help pannuven: halls, services, price, vendors, booking, event planning. Unga event requirement kelunga.",
        "Nenu VizhaOne related topics matrame help chestanu: halls, services, prices, vendors, booking, event planning. Mee event requirement adagandi."
      ),
    };
  }

  if (message.includes("vizhaone") || message.includes("vizha one") || message.includes("what is")) {
    return {
      text: line(
        lang,
        "VizhaOne helps users discover event halls and trusted services, compare prices, and contact vendors for functions like marriage, birthday, engagement, and reception.",
        "VizhaOne la users halls, trusted services, prices compare, vendor contact ellam pannalam. Marriage, birthday, engagement, reception ku useful.",
        "VizhaOne lo users event halls, trusted services, prices compare chesi vendors ni contact cheyyachu. Marriage, birthday, engagement, reception ki useful."
      ),
      actions: [{ label: "View Halls", to: "/halls" }, { label: "View Services", to: "/services" }],
    };
  }

  if (message.includes("hall") || message.includes("mahal") || message.includes("mandap") || message.includes("venue") || message.includes("மண்டபம்") || message.includes("హాల్")) {
    return {
      text: line(
        lang,
        "For halls, check location, guest capacity, photos, AC/parking, price/day, and availability. I can also guide a booking conversation.",
        "Hall ku location, capacity, photos, AC/parking, price/day check pannunga. Booking conversation la naan guide pannuren.",
        "Halls kosam location, capacity, photos, AC/parking, price/day check cheyyandi. Booking conversation lo nenu guide chestanu."
      ),
      actions: [{ label: "View Halls", to: "/halls" }, { label: "Start Booking", to: "/calculator" }],
    };
  }

  if (serviceWords.some((word) => message.includes(word)) || message.includes("சேவை") || message.includes("సేవ")) {
    return {
      text: line(
        lang,
        "VizhaOne services include decoration, catering, photography, bridal, balloons, sound, and event support. Open Details, then Call or WhatsApp the vendor.",
        "VizhaOne services la decoration, catering, photography, bridal, balloons, sound iruku. Details open pannitu Call or WhatsApp pannunga.",
        "VizhaOne services lo decoration, catering, photography, bridal, balloons, sound unnayi. Details open chesi Call or WhatsApp cheyyandi."
      ),
      actions: [{ label: "View Services", to: "/services" }, { label: "Categories", to: "/categories" }],
    };
  }

  if (message.includes("price") || message.includes("cost") || message.includes("rate") || message.includes("விலை") || message.includes("ధర")) {
    return {
      text: line(
        lang,
        "Prices appear on cards when admin/vendor adds them. If a card says Contact for quote, use WhatsApp or Call to confirm final price and availability.",
        "Admin/vendor price add panna cards la price varum. Contact for quote na WhatsApp/Call panni final price confirm pannunga.",
        "Admin/vendor price add chesthe cards lo price kanipistundi. Contact for quote ante WhatsApp/Call chesi final price confirm cheyyandi."
      ),
      actions: [{ label: "Compare Halls", to: "/halls" }, { label: "Compare Services", to: "/services" }],
    };
  }

  return {
    text: line(
      lang,
      "Tell me your event type, city, date, guest count, and needed services. I will guide you to the right VizhaOne page.",
      "Unga event type, city, date, guest count, services sollunga. Correct VizhaOne page ku guide pannuren.",
      "Mee event type, city, date, guest count, services cheppandi. Correct VizhaOne page ki guide chestanu."
    ),
    actions: [{ label: "Plan Event", to: "/calculator" }, { label: "FAQ", to: "/faq" }],
  };
}

export function VizhaOneAssistant() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [actions, setActions] = useState<QuickAction[]>([{ label: "Plan Event", to: "/calculator" }, { label: "View Halls", to: "/halls" }]);
  const [bookingStep, setBookingStep] = useState<BookingStep>("idle");
  const [draft, setDraft] = useState<BookingDraft>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onScroll() {
      if (!open && window.scrollY > 220) setShowNudge(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = window.setTimeout(() => setShowNudge(true), 3500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function push(userText: string, assistantText: string) {
    setMessages((current) => [...current, { role: "user", text: userText }, { role: "assistant", text: assistantText }]);
  }

  function startBookingFlow(userText = "Start booking") {
    const lang = detectLanguage(userText);
    const reply = getBookingReply("idle", userText, draft, lang);
    push(userText, reply.text);
    setBookingStep(reply.step);
    setDraft(reply.draft);
    setActions([{ label: "Plan Event", to: "/calculator" }, { label: "View Halls", to: "/halls" }]);
  }

  function ask(question: string) {
    const clean = question.trim();
    if (!clean) return;

    const lang = detectLanguage(clean);
    if (bookingStep !== "idle" && bookingStep !== "done") {
      const reply = getBookingReply(bookingStep, clean, draft, lang);
      push(clean, reply.text);
      setBookingStep(reply.step);
      setDraft(reply.draft);
      if (reply.step === "done") setActions([{ label: "Open Plan Event", to: "/calculator" }, { label: "View Services", to: "/services" }]);
      setInput("");
      return;
    }

    const reply = getAssistantReply(clean);
    if (reply.startBooking) startBookingFlow(clean);
    else {
      push(clean, reply.text);
      setActions(reply.actions || []);
    }
    setInput("");
  }

  return (
    <div className="fixed bottom-24 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl shadow-rose-950/15">
          <div className="bg-[#991b1b] px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black">VizhaOne AI</p>
                  <p className="flex items-center gap-1 text-[11px] text-white/80">
                    <ShieldCheck className="h-3 w-3" /> Only VizhaOne booking help
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Close VizhaOne AI">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto bg-rose-50/40 px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "bg-[#e11d48] text-white" : "bg-white text-gray-700 shadow-sm ring-1 ring-rose-100"}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-rose-100 bg-white px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button key={question} type="button" onClick={() => question === "Start booking" ? startBookingFlow(question) : ask(question)} className="rounded-full border border-rose-100 px-3 py-1.5 text-[11px] font-semibold text-[#be123c] transition hover:bg-rose-50">
                  {question}
                </button>
              ))}
            </div>

            {actions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Link key={`${action.label}-${action.to}`} to={action.to} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200">
                    <CalendarCheck className="h-3.5 w-3.5 text-[#e11d48]" />
                    {action.label}
                  </Link>
                ))}
              </div>
            )}

            <form onSubmit={(event) => { event.preventDefault(); ask(input); }} className="flex items-center gap-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={bookingStep !== "idle" && bookingStep !== "done" ? "Reply with booking detail..." : "Ask about booking, halls, services..."} className="h-11 min-w-0 flex-1 rounded-xl border border-rose-100 bg-gray-50 px-3 text-sm outline-none transition focus:border-[#e11d48] focus:bg-white" />
              <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e11d48] text-white transition hover:bg-[#be123c]" aria-label="Send message">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {!open && showNudge && (
        <button type="button" onClick={() => { setOpen(true); setShowNudge(false); }} className="mb-3 max-w-[260px] rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-xl ring-1 ring-rose-100">
          <span className="block text-[#be123c]">How can I help you?</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">Book hall or service through VizhaOne AI <ChevronRight className="h-3.5 w-3.5" /></span>
        </button>
      )}

      <button type="button" onClick={() => { setOpen((value) => !value); setShowNudge(false); }} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[#e11d48] px-4 text-sm font-bold text-white shadow-xl shadow-rose-900/20 transition hover:bg-[#be123c]" aria-label="Open VizhaOne AI">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </span>
        <span className="hidden sm:inline">{open ? "Close" : "VizhaOne AI"}</span>
        {!open && <Sparkles className="h-4 w-4 text-rose-100" />}
      </button>
    </div>
  );
}
