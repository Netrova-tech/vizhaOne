export type UserRole = "admin" | "hall_admin" | "user";
export type BookingStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PackageType = "basic" | "premium" | "vip";

export interface User {
  id: string;
  role: UserRole;
  name?: string;
  mobile?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  category_name: string;
  category_image?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Service {
  id: string;
  category_id?: string;
  title: string;
  description?: string;
  price: number;
  price_min?: number;
  price_max?: number;
  image_url?: string;
  gallery_urls?: string[];
  vendor_name?: string;
  vendor_mobile?: string;
  pincode?: string;
  location?: string;
  place_name?: string;
  availability_status: boolean;

  created_at?: string;
  categories?: Category;
}

export interface EventPackage {
  id: string;
  name: string;
  description?: string;
  package_type: PackageType;
  total_price?: number;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  services?: Service[];
}

export interface Booking {
  id: string;
  user_id: string;
  service_id?: string;
  package_id?: string;
  event_date?: string;
  event_location?: string;
  quantity: number;
  booking_status: BookingStatus;
  total_price?: number;
  special_requests?: string;
  customer_name?: string;
  customer_mobile?: string;
  created_at: string;
  services?: Service;
  event_packages?: EventPackage;
  users?: User;
  hallName?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  service_id: string;
  created_at: string;
  services?: Service;
}

export interface CartItem {
  service: Service;
  quantity: number;
  selected: boolean;
}

export interface WhatsAppBill {
  customerName: string;
  customerMobile: string;
  items: CartItem[];
  totalPrice: number;
  gst: number;
  grandTotal: number;
  eventDate?: string;
  eventLocation?: string;
}

// ─── Hall types ────────────────────────────────────────────────────────────
export type SlotType = "morning" | "evening" | "fullday";
export type SlotStatus = "available" | "booked" | "blocked";
export type InquiryStatus = "interested" | "contacted" | "confirmed" | "dropped";

export interface Hall {
  id: string;
  name: string;
  description?: string;
  address: string;
  pincode?: string;
  location: string;
  place_name?: string; // city
  price_per_day: number;
  price_morning?: number;
  price_evening?: number;
  capacity: number;
  dining_capacity?: number;
  parking_capacity?: number;
  rooms?: number;
  has_ac: boolean;
  has_parking: boolean;
  has_generator: boolean;
  has_catering: boolean;
  image_url?: string;
  gallery_urls?: string[];
  owner_mobile?: string;
  owner_name?: string;
  rating?: number;
  review_count?: number;
  is_active: boolean;
  created_at?: string;
}

export interface HallSlot {
  id: string;
  hall_id: string;
  date: string; // YYYY-MM-DD
  slot: SlotType;
  status: SlotStatus;
  booking_id?: string;
  note?: string;
}

export interface HallBooking extends Booking {
  hall_id?: string;
  slot?: SlotType;
  halls?: Hall;
}

export interface Vendor {
  id: string;
  hall_id?: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  mobile?: string;
  image_url?: string;
  is_available: boolean;
  created_at?: string;
}

export interface Inquiry {
  id: string;
  hall_id?: string;
  name: string;
  mobile: string;
  event_date?: string;
  event_type?: string;
  expected_guests?: number;
  message?: string;
  status: InquiryStatus;
  created_at: string;
}

export interface AnalyticsStat {
  month: string;
  bookings: number;
  revenue: number;
  inquiries: number;
}

export type Language = "en" | "ta" | "hi" | "ml" | "te";
