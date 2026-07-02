"use client";

import { useState, useEffect } from "react";
import type { Service, Category } from "@/types";
import { fetchPublicCatalog } from "@/lib/catalogApi";

export function useServices(categoryId?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const catalog = await fetchPublicCatalog();
        const nextServices = categoryId
          ? catalog.services.filter((service) => service.category_id === categoryId)
          : catalog.services;

        if (active) {
          setServices(nextServices);
        }
      } catch {
        if (active) setServices([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [categoryId]);

  return { services, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const catalog = await fetchPublicCatalog();
        if (active) {
          setCategories(catalog.categories);
        }
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
