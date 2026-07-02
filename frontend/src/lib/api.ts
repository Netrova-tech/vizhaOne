/**
 * VizhaOne API Service
 * Handles communication with the backend API
 */

import { apiUrl } from "@/lib/utils";

const API_BASE = apiUrl("/api");

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ─── Bookings API ───────────────────────────────────────────────────────────

export interface BookingPayload {
  hallId: string;
  hallName: string;
  date: string;
  startDate?: string;
  endDate?: string;
  slot: "morning" | "evening" | "fullday";
  price: number;
  name: string;
  mobile: string;
  guests?: string;
  message?: string;
}

export interface Booking extends BookingPayload {
  id: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

export type InquiryStatus = "interested" | "contacted" | "confirmed" | "dropped";

export interface CrmInquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  hallId?: string;
  hallName?: string;
  inquirySource: string;
  status: InquiryStatus;
  notes?: string;
  eventDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  slot?: string;
  expectedGuests?: string;
  created_at?: string;
  createdAt?: string;
}

export interface CrmStats {
  total: number;
  interested: number;
  contacted: number;
  confirmed: number;
  dropped: number;
}

export async function createInquiry(inquiry: Partial<CrmInquiry>): Promise<CrmInquiry> {
  const res = await fetch(`${API_BASE}/admin/crm/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCrmStats(): Promise<CrmStats> {
  const res = await fetch(`${API_BASE}/admin/crm/stats`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCrmInquiries(params: Record<string, string | number>): Promise<{ items: CrmInquiry[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  const res = await fetch(`${API_BASE}/admin/crm/inquiries?${qs.toString()}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<CrmInquiry> {
  const res = await fetch(`${API_BASE}/admin/crm/inquiries/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteCrmInquiry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/crm/inquiries/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
}

export async function getAdminAnalytics(): Promise<{
  stats: CrmStats;
  conversionRate: number;
  statusDistribution: { status: InquiryStatus; count: number }[];
  monthlyInquiries: { month: string; inquiries: number }[];
  hallPerformance: { hallId?: string; hallName?: string; count: number }[];
  inquiryTrend: { date: string; count: number }[];
  customers: { unique: number; repeat: number; newThisMonth: number };
}> {
  const res = await fetch(`${API_BASE}/admin/analytics`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Create a booking in the backend (MongoDB)
 */
export async function createBooking(booking: BookingPayload): Promise<Booking> {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error || `API error: ${res.status}`, res.status);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to create booking:", err);
    throw err;
  }
}

/**
 * Get all bookings from the backend
 */
export async function getBookings(): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error || `API error: ${res.status}`, res.status);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    throw err;
  }
}

/**
 * Update a booking in the backend
 */
export async function updateBookingStatus(
  bookingId: string,
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled"
): Promise<Booking> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to update booking:", err);
    throw err;
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error || `API error: ${res.status}`, res.status);
    }
  } catch (err) {
    console.error("Failed to delete booking:", err);
    throw err;
  }
}

/**
 * Get bookings from localStorage (fallback/offline cache)
 */
export function getLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem("vizha_local_bookings");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save booking to localStorage (offline cache)
 */
export function saveLocalBooking(booking: Booking): void {
  try {
    const existing = getLocalBookings();
    existing.unshift(booking);
    localStorage.setItem("vizha_local_bookings", JSON.stringify(existing));
  } catch (err) {
    console.error("Failed to save booking to localStorage:", err);
  }
}

/**
 * Update booking in localStorage
 */
export function updateLocalBookingStatus(
  bookingId: string,
  status: Booking["status"]
): void {
  try {
    const bookings = getLocalBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], status };
      localStorage.setItem("vizha_local_bookings", JSON.stringify(bookings));
    }
  } catch (err) {
    console.error("Failed to update booking in localStorage:", err);
  }
}

export function deleteLocalBooking(bookingId: string): void {
  try {
    const bookings = getLocalBookings().filter((b) => b.id !== bookingId);
    localStorage.setItem("vizha_local_bookings", JSON.stringify(bookings));
  } catch (err) {
    console.error("Failed to delete booking from localStorage:", err);
  }
}

/**
 * Create booking with both backend and localStorage sync
 * - Tries to save to MongoDB first
 * - Falls back to localStorage if backend is unavailable
 */
export async function createBookingWithSync(
  booking: BookingPayload
): Promise<{ success: boolean; booking: Booking; synced: boolean }> {
  const bookingWithId: Booking = {
    ...booking,
    id: `VZH-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  let synced = false;

  // Try to sync with backend
  try {
    const backendBooking = await createBooking(booking);
    synced = true;
    // Also save to localStorage as cache
    saveLocalBooking(backendBooking);
    return { success: true, booking: backendBooking, synced: true };
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) {
      throw err;
    }
    console.warn("Backend sync failed, using localStorage fallback:", err);
    // Fallback to localStorage
    saveLocalBooking(bookingWithId);
    return { success: true, booking: bookingWithId, synced: false };
  }
}

/**
 * Update booking status with sync
 * - Tries to update in MongoDB first
 * - Falls back to localStorage if backend is unavailable
 */
export async function updateBookingStatusWithSync(
  bookingId: string,
  status: Booking["status"]
): Promise<{ success: boolean; synced: boolean }> {
  try {
    await updateBookingStatus(bookingId, status);
    // Also update localStorage
    updateLocalBookingStatus(bookingId, status);
    return { success: true, synced: true };
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) {
      throw err;
    }
    console.warn("Backend update failed, using localStorage fallback:", err);
    // Fallback to localStorage
    updateLocalBookingStatus(bookingId, status);
    return { success: true, synced: false };
  }
}

/**
 * Get bookings with fallback strategy:
 * - Tries to fetch from backend first
 * - Falls back to localStorage if backend is unavailable
 */
export async function getBookingsWithFallback(): Promise<{
  bookings: Booking[];
  source: "backend" | "localStorage";
}> {
  try {
    const backendBookings = await getBookings();
    return { bookings: backendBookings, source: "backend" };
  } catch (err) {
    console.warn("Failed to fetch from backend, using localStorage:", err);
    const localBookings = getLocalBookings();
    return { bookings: localBookings, source: "localStorage" };
  }
}

// ─── Health Check ────────────────────────────────────────────────────────────

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
