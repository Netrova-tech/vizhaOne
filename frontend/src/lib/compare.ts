import type { Service } from "@/types";
const KEY = "vizhaone_compare_vendors";
export function getCompareIds(): string[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function toggleCompare(service: Service): { ids: string[]; error?: string } {
  const ids = getCompareIds(); const exists = ids.includes(service.id);
  if (!exists && ids.length >= 3) return { ids, error: "Maximum 3 vendors can be compared" };
  const next = exists ? ids.filter((id) => id !== service.id) : [...ids, service.id];
  localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new Event("vizhaone-compare")); return { ids: next };
}
