import type { Hall, HallSlot, Vendor, Inquiry, AnalyticsStat } from "@/types";

// ─── Demo Halls ─────────────────────────────────────────────────────────────
export const DEMO_HALLS: Hall[] = [];

// Deterministic pseudo-random: same seed → same result every render
function seededRand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h % 100) / 100;
}

// ─── Generate availability slots for current + next 2 months ────────────────
export function generateDemoSlots(hallId: string): HallSlot[] {
  const slots: HallSlot[] = [];
  const now = new Date();
  for (let d = 0; d < 60; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];

    slots.push({ id: `${hallId}-${dateStr}-m`, hall_id: hallId, date: dateStr, slot: "morning", status: "available" });
    slots.push({ id: `${hallId}-${dateStr}-e`, hall_id: hallId, date: dateStr, slot: "evening", status: "available" });
  }
  return slots;
}


// ─── Demo Vendors (per hall) ─────────────────────────────────────────────────
export const DEMO_VENDORS: Vendor[] = [];

// ─── Demo Inquiries ──────────────────────────────────────────────────────────
export const DEMO_INQUIRIES: Inquiry[] = [];

// ─── Analytics Data ──────────────────────────────────────────────────────────
export const DEMO_ANALYTICS: AnalyticsStat[] = [];

export const HALL_AMENITIES = [
  { key: "has_ac", label: "AC Hall", icon: "❄️", labelTa: "குளிரூட்டல்" },
  { key: "has_parking", label: "Parking", icon: "🚗", labelTa: "பார்க்கிங்" },
  { key: "has_generator", label: "Generator", icon: "⚡", labelTa: "ஜெனரேட்டர்" },
  { key: "has_catering", label: "In-house Catering", icon: "🍛", labelTa: "உணவக வசதி" },
];
