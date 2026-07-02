"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Plus, Edit, Trash2,
  X, Upload, Loader2,
  Image as ImageIcon, Save, BarChart2, MessageSquare, Building2, Users, Phone, Calendar, Download
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { apiUrl, formatDate, getStatusLabel } from "@/lib/utils";
import { CategoryIcon } from "@/lib/iconMap";
import { DEMO_CATEGORIES } from "@/data/demo";
import type { Service, Category, Booking, BookingStatus, Hall } from "@/types";
import { deleteBooking, deleteLocalBooking, updateLocalBookingStatus } from "@/lib/api";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

type Tab = "dashboard" | "services" | "bookings" | "categories" | "halls" | "users" | "profile";

type SignupRecord = { mobile: string; joinedAt: string; };

const BOOKING_STATUSES: BookingStatus[] = ["pending", "approved", "in_progress", "completed", "cancelled"];

type CatalogResponse = {
  categories?: Category[];
  services?: Service[];
  halls?: Hall[];
};

type PincodeLookupResponse = Array<{
  Status?: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
  }> | null;
}>;

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(url), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const raw = await response.text();
  let result: unknown = null;
  try {
    result = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`API returned non-JSON response for ${url}`);
  }

  if (!response.ok) {
    const error = result && typeof result === "object" && "error" in result ? String(result.error) : "";
    throw new Error(error || `Request failed: ${response.status}`);
  }

  return result as T;
}

async function lookupPlaceByPincode(pincode: string): Promise<{ place: string; district: string } | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const result = await response.json() as PincodeLookupResponse;
    const office = result[0]?.PostOffice?.[0];

    if (result[0]?.Status !== "Success" || !office) return null;

    return {
      place: office.Name || "",
      district: office.District || "",
    };
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const { user, isAdmin, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Restricted access. Admins only!");
      navigate("/auth/login?role=admin");
    }
  }, [loading, isAdmin, navigate]);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [signups, setSignups] = useState<SignupRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES as Category[]);
  const [halls, setHalls] = useState<Hall[]>([]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [servicesPage, setServicesPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [hallsPage, setHallsPage] = useState(1);
  const itemsPerPage = 5;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const categoriesPerPage = isMobile ? 6 : 10;
  const servicesPerPage = isMobile ? 5 : 6;
  const hallsPerPage = isMobile ? 5 : 6;

  const totalServicesPages = Math.ceil(services.length / servicesPerPage);
  const paginatedServices = services.slice((servicesPage - 1) * servicesPerPage, servicesPage * servicesPerPage);

  const totalBookingsPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = bookings.slice((bookingsPage - 1) * itemsPerPage, bookingsPage * itemsPerPage);

  const totalCategoriesPages = Math.ceil(categories.length / categoriesPerPage);
  const paginatedCategories = categories.slice((categoriesPage - 1) * categoriesPerPage, categoriesPage * categoriesPerPage);

  const totalHallsPages = Math.ceil(halls.length / hallsPerPage);
  const paginatedHalls = halls.slice((hallsPage - 1) * hallsPerPage, hallsPage * hallsPerPage);

  const [profileForm, setProfileForm] = useState({ name: "", mobile: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Hydrate from localStorage after first render (client only)
  useEffect(() => {
    setMounted(true);
    const freshVersion = "2026-06-03-empty-with-categories-v2";
    if (localStorage.getItem("vizha_fresh_version") !== freshVersion) {
      [
        "vizha_admin_services",
        "vizha_admin_halls",
        "vizha_local_bookings",
        "vizha_signups",
      ].forEach((key) => localStorage.removeItem(key));
      Object.keys(localStorage)
        .filter((key) => key.startsWith("vizha_hall_services_"))
        .forEach((key) => localStorage.removeItem(key));
      localStorage.setItem("vizha_fresh_version", freshVersion);
    }
    try {
      const raw = localStorage.getItem("vizha_admin_services");
      if (raw) setServices(JSON.parse(raw));
    } catch { /* keep empty */ }
    try {
      const raw = localStorage.getItem("vizha_admin_categories");
      if (raw) setCategories(JSON.parse(raw));
    } catch { /* keep empty */ }
    try {
      const raw = localStorage.getItem("vizha_admin_halls");
      if (raw) setHalls(JSON.parse(raw));
    } catch { /* keep empty */ }
    try {
      const raw = localStorage.getItem("vizha_signups");
      if (raw) setSignups(JSON.parse(raw));
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem("vizha_local_bookings");
      if (raw) setBookings(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const [showAddService, setShowAddService] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ category_name: "", category_image: "", description: "" });
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string>("");
  const catFileRef = useRef<HTMLInputElement | null>(null);

  const [showHallModal, setShowHallModal] = useState(false);
  const [editHall, setEditHall] = useState<Hall | null>(null);
  const [hallImgFiles, setHallImgFiles] = useState<File[]>([]);
  const [hallImgPreviews, setHallImgPreviews] = useState<string[]>([]);
  const hallFileRef = useRef<HTMLInputElement>(null);
  const [hallForm, setHallForm] = useState({
    name: "", address: "", pincode: "", location: "", place_name: "", description: "",
    price_per_day: "", price_morning: "", price_evening: "",
    capacity: "", rooms: "", owner_name: "", owner_mobile: "",
    has_ac: false, has_parking: false, has_generator: false, has_catering: false,
    image_url: "", is_active: true,
  });
  // Services linked to the hall being edited
  const [hallServices, setHallServices] = useState<string[]>([]);
  // Quick-add service inline inside hall modal
  const [showQuickAddService, setShowQuickAddService] = useState(false);
  const [quickSvcForm, setQuickSvcForm] = useState({ title: "", price: "", vendor_name: "", vendor_mobile: "", category_id: "" });
  const [quickSvcImageFiles, setQuickSvcImageFiles] = useState<File[]>([]);
  const [quickSvcImagePreviews, setQuickSvcImagePreviews] = useState<string[]>([]);
  const quickSvcFileRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage whenever data changes
  useEffect(() => { try { localStorage.setItem("vizha_admin_services",   JSON.stringify(services));   } catch { toast.error("Storage full — remove some items"); } }, [services]);
  useEffect(() => { try { localStorage.setItem("vizha_admin_categories", JSON.stringify(categories)); } catch { /* ignore */ } }, [categories]);
  useEffect(() => { try { localStorage.setItem("vizha_admin_halls",      JSON.stringify(halls));      } catch { toast.error("Storage full — use image URLs instead of uploads"); } }, [halls]);

  const [form, setForm] = useState({
    title: "", description: "", price_min: "", price_max: "", category_id: "",
    vendor_name: "", vendor_mobile: "", pincode: "", location: "", place_name: "", availability_status: true,
    image_urls: "",
  });

  useEffect(() => {
    setProfileForm({
      name: user?.name || "Admin User",
      mobile: user?.mobile || "",
    });
  }, [user]);

  useEffect(() => {
    async function loadData() {
      try {
        const localCategories = (() => {
          try {
            const raw = localStorage.getItem("vizha_admin_categories");
            return raw ? JSON.parse(raw) as Category[] : [];
          } catch {
            return [];
          }
        })();
        const [catalog, backendBookings] = await Promise.all([
          apiJson<CatalogResponse>("/api/catalog"),
          apiJson<Booking[]>("/api/bookings"),
        ]);
        if (catalog.services) setServices(catalog.services);
        if (catalog.categories?.length) {
          setCategories(catalog.categories);
        } else if (localCategories.length) {
          const migratedCategories = await Promise.all(
            localCategories.map((category, index) =>
              apiJson<Category>("/api/catalog/categories", {
                method: "POST",
                body: JSON.stringify({
                  ...category,
                  id: category.id || `cat-${Date.now()}-${index}`,
                  sort_order: category.sort_order ?? index,
                }),
              }).catch(() => category)
            )
          );
          setCategories(migratedCategories);
        } else if (catalog.categories) {
          setCategories(catalog.categories);
        }
        if (catalog.halls) setHalls(catalog.halls);
        setBookings(backendBookings);
      } catch {
        // keep local/demo data if the backend is unavailable
        try {
          const raw = localStorage.getItem("vizha_local_bookings");
          if (raw) setBookings(JSON.parse(raw));
        } catch { /* ignore */ }
      }
    }
    loadData();
  }, []);

  function openAddForm() {
    setForm({ title: "", description: "", price_min: "", price_max: "", category_id: "", vendor_name: "", vendor_mobile: "", pincode: "", location: "", place_name: "", availability_status: true, image_urls: "" });
    setImageFiles([]);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setEditService(null);
    setShowAddService(true);
  }

  function openEditForm(service: Service) {
    const gallery = service.gallery_urls?.length ? service.gallery_urls : service.image_url ? [service.image_url] : [];
    setForm({
      title: service.title,
      description: service.description || "",
      price_min: String(service.price_min ?? service.price),
      price_max: String(service.price_max ?? service.price),
      category_id: service.category_id || "",
      vendor_name: service.vendor_name || "",
      vendor_mobile: service.vendor_mobile || "",
      pincode: service.pincode || "",
      location: service.location || "",
      place_name: service.place_name || "",
      availability_status: service.availability_status,
      image_urls: "",
    });
    setImagePreviews(gallery);
    setImageFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setEditService(service);
    setShowAddService(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    const remainingSlots = 5 - imagePreviews.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 photos allowed");
      e.target.value = "";
      return;
    }
    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} allowed`);
    }
    filesToAdd.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageFiles((prev) => [...prev, file]);
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeServiceImage(index: number) {
    const removedPreview = imagePreviews[index];
    if (removedPreview?.startsWith("data:")) {
      const fileIndex = imagePreviews.slice(0, index + 1).filter((preview) => preview.startsWith("data:")).length - 1;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImagesToCloudinary(files: File[]): Promise<string[]> {
    if (files.length === 0) return [];

    async function uploadTo(url: string) {
      const body = new FormData();
      files.forEach((file) => body.append("images", file));

      const response = await fetch(url, {
        method: "POST",
        body,
      });
      const raw = await response.text();
      let result: { images?: { url: string }[]; error?: string } | null = null;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }

      if (!response.ok) {
        throw new Error(result?.error || "Cloudinary upload failed");
      }

      return result;
    }

    const primary = await uploadTo(apiUrl("/api/uploads/cloudinary"));
    const fallback =
      primary ||
      (typeof window !== "undefined"
        ? await uploadTo(`${window.location.protocol}//${window.location.hostname}:5000/api/uploads/cloudinary`)
        : null);

    if (!fallback) {
      throw new Error("Upload API returned non-JSON response. Please check backend is running on port 5000.");
    }

    return (fallback.images || []).map((image: { url: string }) => image.url);
  }

  async function handleSaveService() {
    const urlImages = form.image_urls
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);
    const selectedPhotoCount = imagePreviews.length + urlImages.length;

    if (!form.title) {
      toast.error("Service title is required");
      return;
    }
    if (selectedPhotoCount < 1) {
      toast.error("Please add at least 1 service photo");
      return;
    }
    if (selectedPhotoCount > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    setSaving(true);

    try {
      const existingPreviewUrls = imagePreviews.filter((preview) => !preview.startsWith("data:"));
      const uploadedUrls = await uploadImagesToCloudinary(imageFiles);
      const galleryUrls = [...existingPreviewUrls, ...uploadedUrls, ...urlImages].slice(0, 5);
      const cat = categories.find((c) => c.id === form.category_id);

      const payload: Partial<Service> = {
        title: form.title,
        description: form.description,
        price: form.price_min ? Number(form.price_min) : 0,
        price_min: form.price_min ? Number(form.price_min) : undefined,
        price_max: form.price_max ? Number(form.price_max) : undefined,
        category_id: form.category_id || undefined,
        vendor_name: form.vendor_name,
        vendor_mobile: form.vendor_mobile,
        pincode: form.pincode,
        location: form.location,
        place_name: form.place_name,
        availability_status: form.availability_status,
        image_url: galleryUrls[0] || "",
        gallery_urls: galleryUrls,
      };

      if (editService) {
        const updatedService = await apiJson<Service>(`/api/catalog/services/${editService.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setServices((prev) => prev.map((s) => s.id === editService.id ? { ...updatedService, categories: cat } : s));
        toast.success("Service updated!");
      } else {
        const newService = await apiJson<Service>("/api/catalog/services", {
          method: "POST",
          body: JSON.stringify({
            id: `svc-${Date.now()}`,
            created_at: new Date().toISOString(),
            ...payload,
          }),
        });
        setServices((prev) => [{ ...newService, categories: cat }, ...prev]);
        toast.success("Service added!");
      }
      setImageFiles([]);
      setShowAddService(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cloudinary upload or save failed");
    }
    setSaving(false);
  }

  async function handleDeleteService(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(apiUrl(`/api/catalog/services/${id}`), { method: "DELETE" }).then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      });
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Service delete failed");
    }
  }

  function openAddCat() {
    setEditCat(null);
    setCatForm({ category_name: "", category_image: "", description: "" });
    setCatImageFile(null);
    setCatImagePreview("");
    setShowCatModal(true);
  }
  function openEditCat(cat: Category) {
    setEditCat(cat);
    setCatForm({ category_name: cat.category_name, category_image: cat.category_image || "", description: cat.description || "" });
    setCatImageFile(null);
    setCatImagePreview(cat.category_image || "");
    setShowCatModal(true);
  }
  async function handleSaveCat() {
    if (!catForm.category_name) { toast.error("Category name required"); return; }
    try {
      let imageUrl = catForm.category_image;

      // Upload image file if selected
      if (catImageFile) {
        const uploadedUrls = await uploadImagesToCloudinary([catImageFile]);
        if (uploadedUrls.length > 0) imageUrl = uploadedUrls[0];
      }

      const payload = { category_name: catForm.category_name, category_image: imageUrl, description: catForm.description };

      if (editCat) {
        const updatedCat = await apiJson<Category>(`/api/catalog/categories/${editCat.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setCategories((prev) => prev.map((c) => c.id === editCat.id ? updatedCat : c));
        toast.success("Category updated!");
      } else {
        const newCat = await apiJson<Category>("/api/catalog/categories", {
          method: "POST",
          body: JSON.stringify({
            id: `cat-${Date.now()}`,
            sort_order: categories.length,
            ...payload,
          }),
        });
        setCategories((prev) => [...prev, newCat]);
        toast.success("Category added!");
      }
      setShowCatModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Category save failed");
    }
  }
  async function handleDeleteCat(cat: Category) {
    if (!confirm(`Delete "${cat.category_name}"?`)) return;
    try {
      await fetch(apiUrl(`/api/catalog/categories/${cat.id}`), { method: "DELETE" }).then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      });
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success("Category deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Category delete failed");
    }
  }
  async function handleDeleteHall(id: string) {
    if (!confirm("Delete this hall?")) return;
    try {
      await fetch(apiUrl(`/api/catalog/halls/${id}`), { method: "DELETE" }).then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      });
      setHalls((prev: Hall[]) => prev.filter((h: Hall) => h.id !== id));
      toast.success("Hall deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hall delete failed");
    }
  }

  function openAddHall() {
    setEditHall(null);
    setHallImgFiles([]);
    setHallImgPreviews([]);
    setHallServices([]);
    setShowQuickAddService(false);
    setQuickSvcForm({ title: "", price: "", vendor_name: "", vendor_mobile: "", category_id: "" });
    setQuickSvcImageFiles([]);
    setQuickSvcImagePreviews([]);
    setHallForm({ name: "", address: "", pincode: "", location: "", place_name: "", description: "", price_per_day: "", price_morning: "", price_evening: "", capacity: "", rooms: "", owner_name: "", owner_mobile: "", has_ac: false, has_parking: false, has_generator: false, has_catering: false, image_url: "", is_active: true });
    setShowHallModal(true);
  }

  function openEditHall(hall: Hall) {
    setEditHall(hall);
    setHallImgFiles([]);
    setHallImgPreviews(hall.gallery_urls?.length ? hall.gallery_urls : hall.image_url ? [hall.image_url] : []);
    setShowQuickAddService(false);
    setQuickSvcForm({ title: "", price: "", vendor_name: "", vendor_mobile: "", category_id: "" });
    setQuickSvcImageFiles([]);
    setQuickSvcImagePreviews([]);
    // Load previously saved linked service IDs for this hall
    setHallServices([]);
    fetch(apiUrl(`/api/catalog/hall-services/${hall.id}`))
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch");
      })
      .then((linkedIds) => {
        setHallServices(linkedIds || []);
        localStorage.setItem(`vizha_hall_services_${hall.id}`, JSON.stringify(linkedIds || []));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(`vizha_hall_services_${hall.id}`);
          setHallServices(raw ? JSON.parse(raw) : []);
        } catch { setHallServices([]); }
      });
    setHallForm({
      name: hall.name, address: hall.address, pincode: hall.pincode || "", location: hall.location, place_name: hall.place_name || "",
      description: hall.description || "", price_per_day: String(hall.price_per_day),
      price_morning: String(hall.price_morning || ""), price_evening: String(hall.price_evening || ""),
      capacity: String(hall.capacity), rooms: String(hall.rooms || ""),
      owner_name: hall.owner_name || "", owner_mobile: hall.owner_mobile || "",
      has_ac: hall.has_ac, has_parking: hall.has_parking,
      has_generator: hall.has_generator, has_catering: hall.has_catering,
      image_url: hall.image_url || "", is_active: hall.is_active,
    });
    setShowHallModal(true);
  }

  function handleHallImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    const remainingSlots = 5 - hallImgPreviews.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 hall photos allowed");
      e.target.value = "";
      return;
    }
    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more hall photo${remainingSlots === 1 ? "" : "s"} allowed`);
    }
    filesToAdd.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setHallImgFiles((prev) => [...prev, file]);
        setHallImgPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeHallImage(index: number) {
    const removedPreview = hallImgPreviews[index];
    if (removedPreview?.startsWith("data:")) {
      const fileIndex = hallImgPreviews.slice(0, index + 1).filter((preview) => preview.startsWith("data:")).length - 1;
      setHallImgFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setHallImgPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleQuickServiceImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    const remainingSlots = 5 - quickSvcImagePreviews.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 photos allowed");
      e.target.value = "";
      return;
    }
    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} allowed`);
    }
    filesToAdd.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setQuickSvcImageFiles((prev) => [...prev, file]);
        setQuickSvcImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeQuickServiceImage(index: number) {
    const removedPreview = quickSvcImagePreviews[index];
    if (removedPreview?.startsWith("data:")) {
      const fileIndex = quickSvcImagePreviews.slice(0, index + 1).filter((preview) => preview.startsWith("data:")).length - 1;
      setQuickSvcImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setQuickSvcImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveHall() {
    if (!hallForm.name || !hallForm.capacity || !hallForm.price_per_day) {
      toast.error("Name, capacity, and price/day are required"); return;
    }
    const hallUrlImages = hallForm.image_url
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);
    
    setSaving(true);
    try {
      const existingPreviewUrls = hallImgPreviews.filter((preview) => !preview.startsWith("data:"));
      const uploadedUrls = await uploadImagesToCloudinary(hallImgFiles);
      const hallGalleryUrls = [...existingPreviewUrls, ...uploadedUrls, ...hallUrlImages].slice(0, 5);

      if (hallGalleryUrls.length < 1) {
        toast.error("Please add at least 1 hall photo"); return;
      }
      if (hallGalleryUrls.length > 5) {
        toast.error("Maximum 5 hall photos allowed"); return;
      }
      const finalImg = hallGalleryUrls[0] || "";
      const payload: Partial<Hall> = {
        name: hallForm.name,
        address: hallForm.address,
        pincode: hallForm.pincode,
        location: hallForm.location,
        place_name: hallForm.place_name,
        description: hallForm.description,
        price_per_day: hallForm.price_per_day ? Number(hallForm.price_per_day) : 0,
        price_morning: hallForm.price_morning ? Number(hallForm.price_morning) : undefined,
        price_evening: hallForm.price_evening ? Number(hallForm.price_evening) : undefined,
        capacity: parseInt(hallForm.capacity),
        rooms: hallForm.rooms ? parseInt(hallForm.rooms) : undefined,
        owner_name: hallForm.owner_name,
        owner_mobile: hallForm.owner_mobile,
        has_ac: hallForm.has_ac,
        has_parking: hallForm.has_parking,
        has_generator: hallForm.has_generator,
        has_catering: hallForm.has_catering,
        image_url: finalImg,
        gallery_urls: hallGalleryUrls,
        is_active: hallForm.is_active,
      };

      if (editHall) {
        const updatedHall = await apiJson<Hall>(`/api/catalog/halls/${editHall.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setHalls((prev: Hall[]) => prev.map((h: Hall) => h.id === editHall.id ? updatedHall : h));
        localStorage.setItem(`vizha_hall_services_${editHall.id}`, JSON.stringify(hallServices));
        await fetch(apiUrl("/api/catalog/hall-services"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hallId: editHall.id, serviceIds: hallServices }),
        }).catch((err) => console.warn("Failed to sync linked services to DB:", err));
        toast.success("Hall updated!");
      } else {
        const newHall = await apiJson<Hall>("/api/catalog/halls", {
          method: "POST",
          body: JSON.stringify({
            id: `hall-${Date.now()}`,
            rating: 4.5,
            review_count: 0,
            created_at: new Date().toISOString(),
            ...payload,
          }),
        });
        setHalls((prev: Hall[]) => [newHall, ...prev]);
        localStorage.setItem(`vizha_hall_services_${newHall.id}`, JSON.stringify(hallServices));
        await fetch(apiUrl("/api/catalog/hall-services"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hallId: newHall.id, serviceIds: hallServices }),
        }).catch((err) => console.warn("Failed to sync linked services to DB:", err));
        toast.success("Hall added!");
      }
      setHallImgFiles([]);
      setShowHallModal(false);
      setShowQuickAddService(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save hall");
    } finally {
      setSaving(false);
    }
  }

  async function updateBookingStatus(id: string, status: BookingStatus) {
    let synced = true;
    try {
      const res = await fetch(apiUrl(`/api/bookings/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const error = new Error(body.error || "Failed to update booking status on backend");
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
      updateLocalBookingStatus(id, status);
    } catch (err) {
      const statusCode = err && typeof err === "object" && "status" in err ? (err as { status?: number }).status : undefined;
      if (statusCode && statusCode < 500) {
        toast.error(err instanceof Error ? err.message : "Failed to update booking status");
        return;
      }
      synced = false;
      console.warn("Backend update failed, updating locally only:", err);
      updateLocalBookingStatus(id, status);
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status,
              booking_status: status,
            }
          : b
      )
    );
    toast.success(`Booking ${getStatusLabel(status)}${synced ? "" : " locally"}`);
  }

  async function handleDeleteBooking(id: string) {
    if (!window.confirm("Delete this booking permanently?")) return;

    try {
      await deleteBooking(id);
      deleteLocalBooking(id);
      setBookings((prev) => prev.filter((booking) => booking.id !== id));
      toast.success("Booking deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking delete failed");
    }
  }

  async function handleSaveProfile() {
    if (!profileForm.name.trim() || !profileForm.mobile.trim()) {
      toast.error("Name and phone number are required");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch(apiUrl("/api/auth/admin-profile"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          mobile: profileForm.mobile.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Profile update failed");
      }

      localStorage.setItem("vizha_demo_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("vizha_auth_change"));
      await refreshUser();
      toast.success("Admin profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  function exportSignupsCSV() {
    const rows = [["Mobile", "Joined At"], ...signups.map((u) => [u.mobile, new Date(u.joinedAt).toLocaleString("en-IN")])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vizhaone-users.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: "Total Users",    value: mounted ? signups.length : 0,                          icon: Users,      color: "rose"   },
    { label: "Total Services", value: mounted ? services.length : 0,                         icon: Package,    color: "green"  },
    { label: "Total Bookings", value: mounted ? bookings.length : 0,                         icon: ShoppingBag,color: "blue"   },
    { label: "Active Halls",   value: mounted ? halls.filter((h) => h.is_active).length : 0, icon: Building2,  color: "rose" },
  ];

  const colorMap: Record<string, string> = {
    green: "bg-[#fff1f2] text-[#be123c]",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  };

  const serviceUrlImages = form.image_urls
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
  const servicePhotoCount = imagePreviews.length + serviceUrlImages.length;
  const hallUrlImages = hallForm.image_url
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
  const hallPhotoCount = hallImgPreviews.length + hallUrlImages.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Opening admin panel...</h1>
        <p className="mt-2 text-sm text-gray-500">Please verify admin access if this takes more than a moment.</p>
        <Link
          to="/auth/login?role=admin"
          className="mt-5 rounded-2xl bg-[#e11d48] px-5 py-2.5 text-sm font-bold text-white"
        >
          Admin Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-2xl font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm leading-snug max-w-[220px] sm:max-w-none">Manage services, bookings, vendors and halls</p>
          </div>
          <button
            onClick={openAddForm}
            className="shrink-0 flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#e11d48] text-white rounded-xl font-semibold text-sm hover:bg-[#be123c] transition-colors shadow-lg shadow-[#e11d48]/20 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>

        {/* Quick nav to sub-pages */}
        <div className="grid grid-cols-2 sm:flex gap-2 mb-4 sm:mb-5">
          <Link to="/admin/analytics"
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Link>
          <Link to="/admin/inquiries"
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
            <MessageSquare className="h-4 w-4" /> Inquiries CRM
          </Link>
          <Link to="/halls"
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors">
            <Building2 className="h-4 w-4" /> View Halls
          </Link>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 sm:flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-5 sm:mb-6">
          {([
            { key: "dashboard",  icon: LayoutDashboard, label: "Dashboard"  },
            { key: "services",   icon: Package,         label: "Services"   },
            { key: "bookings",   icon: ShoppingBag,     label: "Bookings"   },
            { key: "categories", icon: TrendingUp,      label: "Categories" },
            { key: "halls",      icon: Building2,       label: "Halls"      },
            { key: "profile",    icon: Phone,           label: "Profile"    },
          ] as { key: Tab; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-w-0 ${
                tab === key
                  ? "bg-[#e11d48] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* ─── Dashboard Tab ─── */}
        {tab === "dashboard" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-premium p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-[#e11d48]" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-premium p-5">
                <h3 className="font-bold text-gray-900 mb-4">Recent Services</h3>
                <div className="space-y-3">
                  {services.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#fff1f2] flex items-center justify-center flex-shrink-0">
                        <CategoryIcon icon={s.categories?.icon} image={s.categories?.category_image} className="h-5 w-5 text-[#e11d48]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{s.title}</p>
                        <p className="text-xs text-gray-500">{s.location}</p>
                      </div>
                      <span className="text-sm font-bold text-[#be123c]">Price on request</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium p-5">
                <h3 className="font-bold text-gray-900 mb-4">Category Distribution</h3>
                <div className="space-y-2">
                  {categories.slice(0, 6).map((cat) => {
                    const count = services.filter((s) => s.category_id === cat.id).length;
                    const pct = services.length ? Math.round((count / services.length) * 100) : 0;
                    return (
                      <div key={cat.id} className="flex items-center gap-3">
                        <div className="h-6 w-6 text-[#e11d48]">
                          <CategoryIcon icon={cat.icon} image={cat.category_image} className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 font-medium">{cat.category_name}</span>
                            <span className="text-gray-500">{count} services</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#e11d48] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Services Tab ─── */}
        {tab === "services" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{services.length} total services</p>
              <button onClick={openAddForm}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#e11d48] text-white rounded-xl text-sm font-semibold hover:bg-[#be123c] transition-colors">
                <Plus className="h-4 w-4" /> Add Service
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedServices.map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card-premium overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gradient-to-br from-[#fff1f2] to-[#fff1f2]">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-4xl">
                        <CategoryIcon icon={service.categories?.icon} image={service.categories?.category_image} className="h-12 w-12 text-[#e11d48]" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${service.availability_status ? "bg-[#e11d48] text-white" : "bg-red-500 text-white"}`}>
                      {service.availability_status ? "Available" : "Unavailable"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{service.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{service.vendor_name} • {service.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#be123c]">Price on request</span>
                      <div className="flex gap-2">
                        <button onClick={() => openEditForm(service)}
                          className="h-8 w-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteService(service.id, service.title)}
                          className="h-8 w-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalServicesPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                  disabled={servicesPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-gray-700">Page {servicesPage} of {totalServicesPages}</span>
                <button
                  onClick={() => setServicesPage((p) => Math.min(totalServicesPages, p + 1))}
                  disabled={servicesPage === totalServicesPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Bookings Tab ─── */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No bookings yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedBookings.map((booking) => {
                    const title = booking.hallName || (booking as any).services?.title || "Service";
                    const customerName = (booking as any).name || booking.customer_name || "Guest";
                    const customerMobile = (booking as any).mobile || booking.customer_mobile || "";
                    const eventDate = (booking as any).date || booking.event_date || "";
                    const eventSlot = (booking as any).slot || "";
                    const bookingStatus = (booking as any).status || booking.booking_status || "pending";
                    return (
                      <div key={booking.id} className="card-premium p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900">{title}</p>
                            <p className="text-xs text-gray-500">{customerName} • {customerMobile}</p>
                            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-4 mt-3">
                              {eventDate && <p className="text-xs text-gray-500">📅 Date: {formatDate(eventDate)}</p>}
                              {eventSlot && <p className="text-xs text-gray-500">⏰ Slot: {eventSlot.charAt(0).toUpperCase() + eventSlot.slice(1)}</p>}
                              {booking.event_location && <p className="text-xs text-gray-500">📍 Location: {booking.event_location}</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] sm:flex sm:items-center gap-2 w-full sm:w-auto">
                            <select
                              value={bookingStatus}
                              onChange={(e) => updateBookingStatus(booking.id, e.target.value as BookingStatus)}
                              className="w-full sm:w-auto text-xs border border-gray-200 rounded-xl px-3 py-2 sm:py-1.5 focus:outline-none focus:border-[#e11d48] bg-white"
                            >
                              {BOOKING_STATUSES.map((s) => (
                                <option key={s} value={s}>{getStatusLabel(s)}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="inline-flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              aria-label="Delete booking"
                              title="Delete booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalBookingsPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                      disabled={bookingsPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-gray-700">Page {bookingsPage} of {totalBookingsPages}</span>
                    <button
                      onClick={() => setBookingsPage((p) => Math.min(totalBookingsPages, p + 1))}
                      disabled={bookingsPage === totalBookingsPages}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Categories Tab ─── */}
        {tab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{categories.length} categories</p>
              <button onClick={openAddCat}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#e11d48] text-white rounded-xl text-sm font-semibold hover:bg-[#be123c] transition-colors">
                <Plus className="h-4 w-4" /> Add Category
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {paginatedCategories.map((cat) => (
                <div key={cat.id} className="card-premium p-4 text-center relative group">
                  <div className="h-12 w-12 mx-auto mb-2 text-[#e11d48]">
                    <CategoryIcon icon={cat.icon} image={cat.category_image} className="h-12 w-12" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{cat.category_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {services.filter((s) => s.category_id === cat.id).length} services
                  </p>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditCat(cat)}
                      className="h-7 w-7 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-colors">
                      <Edit className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDeleteCat(cat)}
                      className="h-7 w-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalCategoriesPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCategoriesPage((p) => Math.max(1, p - 1))}
                  disabled={categoriesPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-gray-700">Page {categoriesPage} of {totalCategoriesPages}</span>
                <button
                  onClick={() => setCategoriesPage((p) => Math.min(totalCategoriesPages, p + 1))}
                  disabled={categoriesPage === totalCategoriesPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Users / Traction Tab ─── */}
        {tab === "users" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-rose-500" />
                  User Signups — Traction
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {signups.length > 0
                    ? `${signups.length} user${signups.length > 1 ? "s" : ""} joined so far 🎊`
                    : "No signups yet — share your site to get users!"}
                </p>
              </div>
              {signups.length > 0 && (
                <button
                  onClick={exportSignupsCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Users", value: signups.length, color: "bg-rose-100 text-rose-700", emoji: "👥" },
                { label: "This Week", value: signups.filter((u) => new Date(u.joinedAt) > new Date(Date.now() - 7 * 864e5)).length, color: "bg-orange-100 text-orange-700", emoji: "📅" },
                { label: "Today", value: signups.filter((u) => new Date(u.joinedAt).toDateString() === new Date().toDateString()).length, color: "bg-[#fff1f2] text-[#be123c]", emoji: "🌟" },
              ].map((s) => (
                <div key={s.label} className="card-premium p-4 text-center">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Users list */}
            {signups.length === 0 ? (
              <div className="card-premium p-12 text-center">
                <div className="text-5xl mb-4">📱</div>
                <h3 className="font-bold text-gray-700 mb-2">No users yet</h3>
                <p className="text-sm text-gray-500 mb-4">Share your website link with people. When they sign up, you will see their numbers here.</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fff1f2] border border-[#e11d48]/20 rounded-xl text-sm text-[#be123c] font-semibold">
                  🔗 Share your .com link to get started
                </div>
              </div>
            ) : (
              <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Mobile</span>
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined</span>
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {signups.map((user, i) => (
                        <motion.tr key={user.mobile} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="hover:bg-rose-50/30 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-medium text-xs">{i + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {user.mobile.slice(-2)}
                              </div>
                              <span className="font-semibold text-gray-800">{user.mobile}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs">
                            {new Date(user.joinedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-5 py-3.5">
                            <a
                              href={`https://wa.me/${user.mobile.replace("+", "").replace(/\s/g, "")}?text=Hi! Thanks for joining VizhaOne 🎊 We are Tamil Nadu's #1 event management app. Can we help you plan your next event?`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e11d48] text-white rounded-xl text-xs font-semibold hover:bg-[#e11d48] transition-colors"
                            >
                              💬 WhatsApp
                            </a>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Data stored locally. Connect Supabase later to sync across devices.</p>
                  <span className="text-xs font-semibold text-rose-500">{signups.length} total</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Halls Tab ─── */}
        {tab === "profile" && (
          <div className="max-w-2xl">
            <div className="card-premium overflow-hidden">
              <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-6 text-white">
                <h2 className="text-xl font-bold">Admin Profile</h2>
                <p className="mt-1 text-sm text-white/75">Update the profile details shown in the admin portal.</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Name</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Admin User"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#e11d48] text-white rounded-xl text-sm font-bold hover:bg-[#be123c] disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "halls" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{halls.length} halls</p>
              <button onClick={openAddHall}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#e11d48] text-white rounded-xl text-sm font-semibold hover:bg-[#be123c] transition-colors">
                <Plus className="h-4 w-4" /> Add Hall
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedHalls.map((hall) => (
                <motion.div key={hall.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-rose-100 to-rose-50">
                    {hall.image_url ? (
                      <img src={hall.image_url} alt={hall.name} className="object-cover w-full h-full"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-4xl">🏛️</div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${hall.is_active ? "bg-[#e11d48] text-white" : "bg-red-500 text-white"}`}>
                      {hall.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{hall.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">📍 {hall.address} • {hall.capacity} guests</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#be123c]">Price on request</span>
                      <div className="flex gap-2">
                        <button onClick={() => openEditHall(hall)}
                          className="h-8 w-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteHall(hall.id)}
                          className="h-8 w-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalHallsPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setHallsPage((p) => Math.max(1, p - 1))}
                  disabled={hallsPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-gray-700">Page {hallsPage} of {totalHallsPages}</span>
                <button
                  onClick={() => setHallsPage((p) => Math.min(totalHallsPages, p + 1))}
                  disabled={hallsPage === totalHallsPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Add/Edit Hall Modal ─── */}
      <MobileBottomNav />

      <AnimatePresence>
        {showHallModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowHallModal(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">

              {/* Header */}
              <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-5 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {editHall ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editHall ? "Edit Hall" : "Add New Hall"}
                </h3>
                <button onClick={() => setShowHallModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">

                {/* Image upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Hall Photos *</label>
                    <span className={`text-xs font-bold ${hallPhotoCount >= 1 ? "text-emerald-600" : "text-rose-600"}`}>
                      {hallPhotoCount}/5 photos
                    </span>
                  </div>
                  <div onClick={() => hallFileRef.current?.click()}
                    className="relative min-h-36 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-rose-400 transition-colors p-3">
                    {hallImgPreviews.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {hallImgPreviews.map((preview, index) => (
                          <div key={`${preview}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                            <img src={preview} alt={`Hall photo ${index + 1}`} className="object-cover w-full h-full" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHallImage(index);
                              }}
                              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {hallImgPreviews.length < 5 && (
                          <div className="aspect-square rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-1">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs font-semibold">Add more</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ImageIcon className="h-8 w-8" />
                        <p className="text-sm">Click to upload 1 to 5 hall photos</p>
                        <p className="text-xs">JPG, PNG, WebP up to 5MB each</p>
                      </div>
                    )}
                  </div>
                  <input ref={hallFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleHallImageChange} />
                  <p className="text-xs text-gray-500 mt-2 mb-1 font-semibold">Or paste hall image URLs, one per line:</p>
                  <textarea
                    rows={3}
                    placeholder={"https://images.unsplash.com/hall-1...\nhttps://images.unsplash.com/hall-2..."}
                    value={hallForm.image_url}
                    onChange={(e) => {
                      const urls = e.target.value
                      .split(/\r?\n|,/)
                      .map((url) => url.trim())
                      .filter(Boolean);
                      if (hallImgPreviews.length + urls.length > 5) {
                        toast.error("Maximum 5 hall photos allowed");
                        return;
                      }
                      setHallForm({ ...hallForm, image_url: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                  <p className="text-xs text-amber-600 mt-1">Minimum 1 hall photo is compulsory. Maximum 5 photos can be saved.</p>
                </div>

                {/* Name + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hall Name *</label>
                    <input value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                      placeholder="Sri Murugan Grand Hall"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode *</label>
                    <input
                      inputMode="numeric"
                      value={hallForm.pincode}
                      onChange={async (e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setHallForm((prev) => ({ ...prev, pincode }));
                        if (pincode.length === 6) {
                          const res = await lookupPlaceByPincode(pincode);
                          if (res) {
                            setHallForm((prev) => prev.pincode === pincode ? { ...prev, location: res.district, place_name: res.place } : prev);
                          } else {
                            toast.error("No place found for this pincode");
                          }
                        }
                      }}
                      placeholder="625001"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Place Name</label>
                    <input
                      value={hallForm.place_name}
                      onChange={(e) => setHallForm({ ...hallForm, place_name: e.target.value })}
                      placeholder="e.g. Madurai H.O."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">District *</label>
                    <input
                      value={hallForm.location}
                      onChange={(e) => setHallForm({ ...hallForm, location: e.target.value })}
                      placeholder="e.g. Madurai"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Address *</label>
                  <input value={hallForm.address} onChange={(e) => setHallForm({ ...hallForm, address: e.target.value })}
                    placeholder="15, Anna Nagar, Madurai"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={hallForm.description} onChange={(e) => setHallForm({ ...hallForm, description: e.target.value })}
                    rows={2} placeholder="Describe the hall..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Price/Day (₹) *", key: "price_per_day", placeholder: "85000" },
                    { label: "Morning Slot (₹)", key: "price_morning", placeholder: "45000" },
                    { label: "Evening Slot (₹)", key: "price_evening", placeholder: "50000" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {label}
                        {key !== "price_per_day" && <span className="ml-1 font-medium text-gray-400">(Optional)</span>}
                      </label>
                      <input type="number" value={hallForm[key as keyof typeof hallForm] as string}
                        onChange={(e) => setHallForm({ ...hallForm, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                  ))}
                </div>

                {/* Capacity + Rooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity (Guests) *</label>
                    <input type="number" value={hallForm.capacity} onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                      placeholder="500"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rooms</label>
                    <input type="number" value={hallForm.rooms} onChange={(e) => setHallForm({ ...hallForm, rooms: e.target.value })}
                      placeholder="4"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                {/* Owner */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Owner Name</label>
                    <input value={hallForm.owner_name} onChange={(e) => setHallForm({ ...hallForm, owner_name: e.target.value })}
                      placeholder="Murugesan"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Owner Mobile</label>
                    <input type="tel" value={hallForm.owner_mobile}
                      onChange={(e) => setHallForm({ ...hallForm, owner_mobile: e.target.value.replace(/\D/g,"").slice(0,10) })}
                      placeholder="9876543210"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "has_ac",        label: "❄️ AC Hall"    },
                      { key: "has_parking",   label: "🅿️ Parking"   },
                      { key: "has_generator", label: "⚡ Generator"  },
                      { key: "has_catering",  label: "🍽️ Catering"  },
                    ].map(({ key, label }) => (
                      <button key={key} type="button"
                        onClick={() => setHallForm({ ...hallForm, [key]: !hallForm[key as keyof typeof hallForm] })}
                        className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          hallForm[key as keyof typeof hallForm]
                            ? "border-rose-500 bg-rose-50 text-rose-700"
                            : "border-gray-200 text-gray-500"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <button type="button" onClick={() => setHallForm({ ...hallForm, is_active: !hallForm.is_active })}
                    className={`relative inline-flex h-6 w-12 rounded-full transition-colors ${hallForm.is_active ? "bg-[#e11d48]" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${hallForm.is_active ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                  <span className={`text-sm font-semibold ${hallForm.is_active ? "text-[#e11d48]" : "text-gray-400"}`}>
                    {hallForm.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* ── Services linked to this Hall ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      🎊 Services Available at This Hall
                      <span className="ml-2 text-xs font-normal text-gray-400">({hallServices.length} linked)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddService((v) => !v);
                        setQuickSvcForm({ title: "", price: "", vendor_name: "", vendor_mobile: "", category_id: "" });
                        setQuickSvcImagePreviews([]);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add New Service
                    </button>
                  </div>

                  {/* Quick Add Service Form */}
                  {showQuickAddService && (
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-3 space-y-3">
                      <p className="text-xs font-bold text-rose-700">✨ Create & Link New Service</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Service Name *</label>
                          <input
                            value={quickSvcForm.title}
                            onChange={(e) => setQuickSvcForm({ ...quickSvcForm, title: e.target.value })}
                            placeholder="e.g. Bridal Mehandi, DJ Music"
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-700 block">Service Photos *</label>
                            <span className={`text-[11px] font-bold ${quickSvcImagePreviews.length >= 1 ? "text-emerald-600" : "text-rose-600"}`}>
                              {quickSvcImagePreviews.length}/5 photos
                            </span>
                          </div>
                          <div
                            onClick={() => quickSvcFileRef.current?.click()}
                            className="min-h-28 bg-white border-2 border-dashed border-rose-200 rounded-xl p-2 cursor-pointer hover:border-rose-400 transition-colors"
                          >
                            {quickSvcImagePreviews.length > 0 ? (
                              <div className="grid grid-cols-4 gap-2">
                                {quickSvcImagePreviews.map((preview, index) => (
                                  <div key={`${preview}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                                    <img src={preview} alt={`Service photo ${index + 1}`} className="h-full w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeQuickServiceImage(index);
                                      }}
                                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                {quickSvcImagePreviews.length < 5 && (
                                  <div className="aspect-square rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                                    <Upload className="h-4 w-4" />
                                    <span className="text-[10px] font-semibold">Add</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-28 flex flex-col items-center justify-center text-gray-400 gap-1">
                                <ImageIcon className="h-7 w-7" />
                                <p className="text-xs font-semibold">Upload 1 to 5 photos</p>
                                <p className="text-[10px]">JPG, PNG, WebP up to 5MB each</p>
                              </div>
                            )}
                          </div>
                          <input ref={quickSvcFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleQuickServiceImageChange} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Price (₹) *</label>
                          <input
                            type="number"
                            value={quickSvcForm.price}
                            onChange={(e) => setQuickSvcForm({ ...quickSvcForm, price: e.target.value })}
                            placeholder="5000"
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                          <select
                            value={quickSvcForm.category_id}
                            onChange={(e) => setQuickSvcForm({ ...quickSvcForm, category_id: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="">-- Select --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.category_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Vendor / Owner Name</label>
                          <input
                            value={quickSvcForm.vendor_name}
                            onChange={(e) => setQuickSvcForm({ ...quickSvcForm, vendor_name: e.target.value })}
                            placeholder="Vendor name"
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Vendor Mobile</label>
                          <input
                            type="tel"
                            value={quickSvcForm.vendor_mobile}
                            onChange={(e) => setQuickSvcForm({ ...quickSvcForm, vendor_mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                            placeholder="9876543210"
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuickAddService(false);
                            setQuickSvcImagePreviews([]);
                          }}
                          className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!quickSvcForm.title) {
                              toast.error("Service name required"); return;
                            }
                            if (quickSvcImagePreviews.length < 1) {
                              toast.error("Please add at least 1 service photo"); return;
                            }
                            if (quickSvcImagePreviews.length > 5) {
                              toast.error("Maximum 5 photos allowed"); return;
                            }
                            (async () => {
                              try {
                                setSaving(true);
                                const uploadedUrls = await uploadImagesToCloudinary(quickSvcImageFiles);
                                const galleryUrls = [...uploadedUrls].slice(0, 5);
                                const cat = categories.find((c) => c.id === quickSvcForm.category_id);
                                
                                const payload: Partial<Service> = {
                                  title: quickSvcForm.title,
                                  description: "",
                                  price: quickSvcForm.price ? Number(quickSvcForm.price) : 0,
                                  price_min: quickSvcForm.price ? Number(quickSvcForm.price) : undefined,
                                  price_max: quickSvcForm.price ? Number(quickSvcForm.price) : undefined,
                                  category_id: quickSvcForm.category_id || undefined,
                                  vendor_name: quickSvcForm.vendor_name,
                                  vendor_mobile: quickSvcForm.vendor_mobile,
                                  pincode: hallForm.pincode,
                                  location: hallForm.location,
                                  place_name: hallForm.place_name,
                                  availability_status: true,
                                  image_url: galleryUrls[0] || "",
                                  gallery_urls: galleryUrls,
                                };

                                const newService = await apiJson<Service>("/api/catalog/services", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    id: `svc-${Date.now()}`,
                                    created_at: new Date().toISOString(),
                                    ...payload,
                                  }),
                                });

                                setServices((prev) => [{ ...newService, categories: cat }, ...prev]);
                                setHallServices((prev) => [...prev, newService.id]);
                                setShowQuickAddService(false);
                                setQuickSvcForm({ title: "", price: "", vendor_name: "", vendor_mobile: "", category_id: "" });
                                setQuickSvcImageFiles([]);
                                setQuickSvcImagePreviews([]);
                                toast.success(`"${newService.title}" added & linked to hall!`);
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Failed to add service");
                              } finally {
                                setSaving(false);
                              }
                            })();
                          }}
                          className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 flex items-center justify-center gap-1"
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save & Link"}
                        </button>
                      </div>
                    </div>
                  )}

                  {hallServices.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-rose-600 font-semibold">
                        ✓ {hallServices.length} service{hallServices.length > 1 ? "s" : ""} linked to this hall:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {services.filter((s) => hallServices.includes(s.id)).map((s) => (
                          <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                            <CategoryIcon icon={s.categories?.icon} image={s.categories?.category_image} className="h-4 w-4 text-[#e11d48]" />
                            <span className="truncate max-w-[120px]">{s.title}</span>
                            <button
                              type="button"
                              onClick={() => setHallServices((prev) => prev.filter((id) => id !== s.id))}
                              className="hover:bg-rose-200 text-rose-600 h-4 w-4 flex items-center justify-center rounded-full text-sm font-bold ml-1 active:scale-95 transition-all">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hallServices.length === 0 && (
                    <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
                      No services linked yet. Use Add Service to create and link a service for this hall.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button onClick={() => setShowHallModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSaveHall}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 shadow-lg">
                  <Save className="h-4 w-4" />
                  {editHall ? "Update Hall" : "Add Hall"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Add/Edit Category Modal ─── */}
      <AnimatePresence>
        {showCatModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-5 flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">{editCat ? "Edit Category" : "Add Category"}</h3>
                <button onClick={() => setShowCatModal(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Category Image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Image *</label>
                  <div
                    onClick={() => catFileRef.current?.click()}
                    className="relative h-32 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-rose-400 transition-colors flex items-center justify-center bg-gray-50"
                  >
                    {catImagePreview ? (
                      <>
                        <img src={catImagePreview} alt="Category" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCatImageFile(null); setCatImagePreview(""); setCatForm({ ...catForm, category_image: "" }); }}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <ImageIcon className="h-8 w-8" />
                        <p className="text-xs">Click to upload category image</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={catFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
                      setCatImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setCatImagePreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 mb-1 font-semibold">Or paste image URL:</p>
                  <input
                    value={catForm.category_image}
                    onChange={(e) => { setCatForm({ ...catForm, category_image: e.target.value }); setCatImagePreview(e.target.value); setCatImageFile(null); }}
                    placeholder="https://example.com/category-image.jpg"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                  />
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
                  <input value={catForm.category_name} onChange={(e) => setCatForm({ ...catForm, category_name: e.target.value })}
                    placeholder="e.g. Catering"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    placeholder="Short description"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setShowCatModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveCat}
                  className="flex-1 py-3 bg-[#e11d48] text-white rounded-2xl text-sm font-bold hover:bg-[#be123c] shadow-lg">
                  {editCat ? "Update" : "Add Category"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Add/Edit Service Modal ─── */}
      <AnimatePresence>
        {showAddService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddService(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-5 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {editService ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editService ? "Edit Service" : "Add New Service"}
                </h3>
                <button onClick={() => setShowAddService(false)} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Image upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Service Photos *</label>
                    <span className={`text-xs font-bold ${servicePhotoCount >= 1 ? "text-emerald-600" : "text-rose-600"}`}>
                      {servicePhotoCount}/5 photos
                    </span>
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative min-h-40 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-green-400 transition-colors p-3"
                  >
                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={`${preview}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                            <img src={preview} alt={`Service photo ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeServiceImage(index);
                              }}
                              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {imagePreviews.length < 5 && (
                          <div className="aspect-square rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-1">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs font-semibold">Add more</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ImageIcon className="h-10 w-10" />
                        <p className="text-sm">Click to upload 1 to 5 photos</p>
                        <p className="text-xs">JPG, PNG, WebP up to 5MB each</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  <p className="text-xs text-gray-500 mt-2 mb-1 font-semibold">Or paste image URLs, one per line:</p>
                  <textarea
                    rows={3}
                    placeholder={"https://images.unsplash.com/photo-1...\nhttps://images.unsplash.com/photo-2..."}
                    value={form.image_urls}
                    onChange={(e) => {
                      const urls = e.target.value
                        .split(/\r?\n|,/)
                        .map((url) => url.trim())
                        .filter(Boolean);
                      if (imagePreviews.length + urls.length > 5) {
                        toast.error("Maximum 5 photos allowed");
                        return;
                      }
                      setForm({ ...form, image_urls: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48] resize-none"
                  />
                  <p className="text-xs text-amber-600 mt-1">Minimum 1 photo is compulsory. Maximum 5 photos can be saved.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Service Title *</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Grand Feast Catering"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Min Price (₹) *</label>
                      <input type="number" min={0} value={form.price_min} onChange={(e) => setForm({ ...form, price_min: e.target.value })}
                        placeholder="25000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Max Price (₹) *</label>
                      <input type="number" min={0} value={form.price_max} onChange={(e) => setForm({ ...form, price_max: e.target.value })}
                        placeholder="50000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="Describe the service..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48] resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    {form.category_id === "__new__" ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          id="new-category-input"
                          placeholder="Type new category name..."
                          className="flex-1 px-4 py-3 bg-gray-50 border border-[#e11d48] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                              const newName = e.currentTarget.value.trim();
                              try {
                                const newCat = await apiJson<Category>("/api/catalog/categories", {
                                  method: "POST",
                                  body: JSON.stringify({ id: `cat-${Date.now()}`, category_name: newName, sort_order: categories.length }),
                                });
                                setCategories((prev) => [...prev, newCat]);
                                setForm((prev) => ({ ...prev, category_id: newCat.id }));
                                toast.success(`Category "${newName}" added!`);
                              } catch {
                                const localCat: Category = { id: `cat-${Date.now()}`, category_name: newName, sort_order: categories.length };
                                setCategories((prev) => [...prev, localCat]);
                                setForm((prev) => ({ ...prev, category_id: localCat.id }));
                                toast.success(`Category "${newName}" added!`);
                              }
                            }
                            if (e.key === "Escape") setForm((prev) => ({ ...prev, category_id: "" }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const input = document.getElementById("new-category-input") as HTMLInputElement;
                            const newName = input?.value.trim();
                            if (!newName) { toast.error("Enter a category name"); return; }
                            try {
                              const newCat = await apiJson<Category>("/api/catalog/categories", {
                                method: "POST",
                                body: JSON.stringify({ id: `cat-${Date.now()}`, category_name: newName, sort_order: categories.length }),
                              });
                              setCategories((prev) => [...prev, newCat]);
                              setForm((prev) => ({ ...prev, category_id: newCat.id }));
                              toast.success(`Category "${newName}" added!`);
                            } catch {
                              const localCat: Category = { id: `cat-${Date.now()}`, category_name: newName, sort_order: categories.length };
                              setCategories((prev) => [...prev, localCat]);
                              setForm((prev) => ({ ...prev, category_id: localCat.id }));
                              toast.success(`Category "${newName}" added!`);
                            }
                          }}
                          className="px-4 py-3 bg-[#e11d48] text-white rounded-xl text-sm font-bold hover:bg-[#be123c] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]">
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.category_name}</option>
                        ))}
                        <option value="__new__">➕ Add New Category...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                    <input
                      inputMode="numeric"
                      value={form.pincode}
                      onChange={async (e) => {
                        const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForm((prev) => ({ ...prev, pincode }));
                        if (pincode.length === 6) {
                          const res = await lookupPlaceByPincode(pincode);
                          if (res) {
                            setForm((prev) => prev.pincode === pincode ? { ...prev, location: res.district, place_name: res.place } : prev);
                          } else {
                            toast.error("No place found for this pincode");
                          }
                        }
                      }}
                      placeholder="625001"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Place Name</label>
                    <input value={form.place_name} onChange={(e) => setForm({ ...form, place_name: e.target.value })}
                      placeholder="e.g. Madurai H.O."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">District *</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Madurai"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Vendor Name</label>
                    <input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                      placeholder="Vendor name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Vendor Mobile</label>
                    <input type="tel" value={form.vendor_mobile} onChange={(e) => setForm({ ...form, vendor_mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="9876543210"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Availability</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, availability_status: !form.availability_status })}
                    className={`relative inline-flex h-6 w-12 rounded-full transition-colors ${form.availability_status ? "bg-[#e11d48]" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.availability_status ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                  <span className={`text-sm ${form.availability_status ? "text-[#e11d48] font-semibold" : "text-gray-400"}`}>
                    {form.availability_status ? "Available" : "Not Available"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button onClick={() => setShowAddService(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveService} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#e11d48] text-white rounded-2xl text-sm font-bold hover:bg-[#be123c] transition-colors shadow-lg disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : editService ? "Update Service" : "Add Service"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
