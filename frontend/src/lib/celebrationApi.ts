import { apiUrl } from "@/lib/utils";

export type EventType = "wedding" | "birthday" | "baby-shower" | "other";
export interface InvitationData {
  id?: string; slug?: string; eventType: EventType; customEventType?: string; primaryName: string; secondaryName?: string;
  hostName?: string; eventDate: string; eventTime: string; venue: string; mapUrl?: string;
  photoUrl?: string; language: "en" | "ta"; theme: string; hashtag?: string; message?: string;
  premium?: boolean; rsvps?: RsvpData[];
}
export interface RsvpData { name: string; mobile?: string; attending: boolean; guests: number; mealPreference: "veg" | "non-veg" | "unspecified"; message?: string; }
export interface ReferralEntry { bookingId: string; referredMobile: string; points: number; status: "pending" | "confirmed" | "reversed"; createdAt: string; }
export interface ReferralWallet { code: string; ownerMobile: string; points: number; totalReferrals: number; rewardReady: boolean; rewardValue: number; entries: ReferralEntry[]; }

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong");
  return body as T;
}
export async function saveInvitation(data: InvitationData) {
  return json<InvitationData>(await fetch(apiUrl("/api/invitations"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}
export async function fetchInvitation(slug: string) { return json<InvitationData>(await fetch(apiUrl(`/api/invitations/${slug}`))); }
export async function submitRsvp(slug: string, data: RsvpData) {
  return json<{ success: boolean }>(await fetch(apiUrl(`/api/invitations/${slug}/rsvp`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }));
}
export async function fetchReferralWallet(mobile: string) { return json<ReferralWallet>(await fetch(apiUrl(`/api/referrals/wallet/${mobile}`))); }
