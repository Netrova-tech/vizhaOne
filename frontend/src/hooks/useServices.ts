"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Service, Category } from "@/types";
import { DEMO_SERVICES, DEMO_CATEGORIES } from "@/data/demo";

function resolveCategories(raw: Category[] | null | undefined): Category[] {
  return raw?.length ? raw : (DEMO_CATEGORIES as Category[]);
}

export function useServices(categoryId?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      if (!isSupabaseConfigured) {
        const localRaw = typeof window !== "undefined" ? localStorage.getItem("vizha_admin_services") : null;
        const localServices: Service[] = localRaw ? JSON.parse(localRaw) : (DEMO_SERVICES as Service[]);
        setServices(categoryId ? localServices.filter((s) => s.category_id === categoryId) : localServices);
        setLoading(false);
        return;
      }
      try {
        let query = supabase
          .from("services")
          .select("*, categories(*)")
          .order("created_at", { ascending: false });
        if (categoryId) query = query.eq("category_id", categoryId);
        const { data, error } = await query;
        if (error || !data?.length) {
          const localRaw = typeof window !== "undefined" ? localStorage.getItem("vizha_admin_services") : null;
          const fallback: Service[] = localRaw ? JSON.parse(localRaw) : (DEMO_SERVICES as Service[]);
          setServices(categoryId ? fallback.filter((s) => s.category_id === categoryId) : fallback);
        } else {
          setServices(data as Service[]);
        }
      } catch {
        setServices(DEMO_SERVICES as Service[]);
      }
      setLoading(false);
    }
    fetch();
  }, [categoryId]);

  return { services, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      if (!isSupabaseConfigured) {
        const localRaw = typeof window !== "undefined" ? localStorage.getItem("vizha_admin_categories") : null;
        const parsed = localRaw ? JSON.parse(localRaw) as Category[] : null;
        setCategories(resolveCategories(parsed));
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from("categories").select("*").order("sort_order");
        if (error || !data?.length) {
          const localRaw = typeof window !== "undefined" ? localStorage.getItem("vizha_admin_categories") : null;
          const parsed = localRaw ? JSON.parse(localRaw) as Category[] : null;
          setCategories(resolveCategories(parsed));
        } else {
          setCategories(data as Category[]);
        }
      } catch {
        setCategories(DEMO_CATEGORIES as Category[]);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { categories, loading };
}
