import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const PRODUCTION_API_BASE_URL =
  "https://vizhaone-backend-450892873561.asia-south1.run.app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const configuredBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (configuredBase) {
    return `${configuredBase}${cleanPath}`;
  }

  if (typeof window !== "undefined") {
    const { hostname, port, protocol } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

    // Capacitor serves bundled files from localhost without a port. API calls
    // must go to the hosted backend instead of the embedded static server.
    if (isLocal && !port) {
      return `${PRODUCTION_API_BASE_URL}${cleanPath}`;
    }

    if (isLocal && port !== "5000") {
      return `${protocol}//${hostname}:5000${cleanPath}`;
    }
  }

  return `${PRODUCTION_API_BASE_URL}${cleanPath}`;
}

type PriceValue = number | string | null | undefined;

function toPriceNumber(price: PriceValue): number | null {
  if (price === null || price === undefined || price === "") return null;
  const value = typeof price === "number" ? price : Number(price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function formatPrice(price: number | string): string {
  const value = toPriceNumber(price) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function hasVisiblePrice(price: PriceValue): boolean {
  return toPriceNumber(price) !== null;
}

export function formatPriceOrQuote(price: PriceValue): string {
  const value = toPriceNumber(price);
  return value !== null ? formatPrice(value) : "Contact for quote";
}

export function formatPriceRange(min: PriceValue, max: PriceValue): string {
  const minValue = toPriceNumber(min);
  const maxValue = toPriceNumber(max);
  if (minValue === null && maxValue === null) return "Contact for quote";
  if (maxValue === null || minValue === maxValue) return formatPrice(minValue || maxValue || 0);
  return `${formatPrice(minValue || 0)} - ${formatPrice(maxValue)}`;
}

export function formatServicePrice(service: {
  price?: PriceValue;
  price_min?: PriceValue;
  price_max?: PriceValue;
}): string {
  const startingPrice = toPriceNumber(service.price_min) ?? toPriceNumber(service.price);
  if (startingPrice !== null) return `Starts at ${formatPrice(startingPrice)}`;
  const maximumPrice = toPriceNumber(service.price_max);
  return maximumPrice !== null ? `Up to ${formatPrice(maximumPrice)}` : "Contact for quote";
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function calculateGST(price: number, rate = 18): number {
  return Math.round((price * rate) / 100);
}

export function buildWhatsAppMessage(
  items: { title: string; price: number; quantity: number }[],
  subtotal: number,
  gst: number,
  meta?: {
    customerName?: string;
    customerPhone?: string;
    eventDate?: string;
    eventEndDate?: string;
    eventLocation?: string;
    eventType?: string;
    hallName?: string;
    slot?: string;
  }
): string {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const websiteUrl = (import.meta as any).env.VITE_WEBSITE_URL || "https://vizha-one.vercel.app";
  const eventDateLine =
    meta?.eventEndDate && meta?.eventEndDate !== meta?.eventDate
      ? `${meta?.eventDate || ""} to ${meta.eventEndDate}`
      : `${meta?.eventDate || ""}`;
  const itemList = items
    .map((i, idx) => `${idx + 1}. ${i.title}${i.quantity > 1 ? ` (Qty: ${i.quantity})` : ""}`)
    .join("\n");

  return [
    websiteUrl,
    "",
    "🎉 *New Event Inquiry — VizhaOne*",
    `📅 *Inquiry Date:* ${now}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    "👤 *Customer Details*",
    `Name: ${meta?.customerName || "-"}`,
    `📞 Phone: ${meta?.customerPhone || "-"}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    "📋 *Event Details*",
    `🎊 Event Type: ${meta?.eventType || "-"}`,
    `📍 Venue: ${meta?.eventLocation || "-"}`,
    `📅 Event Date: ${eventDateLine || "-"}`,
    `⏰ Slot: ${meta?.slot ? (meta.slot.charAt(0).toUpperCase() + meta.slot.slice(1)) : "-"}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    "🏛️ *Selected Hall*",
    `${meta?.hallName || "-"}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    `🎯 *Services Requested (${items.length})*`,
    itemList || "-",
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    "",
    "📞 Our team will contact you shortly to discuss availability and booking requirements.",
    "",
    "🌐 Website:",
    websiteUrl,
    "",
    "🏢 *VizhaOne*",
    "Tamil Nadu's Event Planning & Vendor Coordination Platform",
  ].join("\n");
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-[#fff1f2] text-green-800 border-[#e11d48]/20",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}
