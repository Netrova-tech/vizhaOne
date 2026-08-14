"use client";

import { useState, useEffect, useCallback } from "react";

export interface FavoriteItem {
  id: string;
  type: "service" | "hall";
  title: string;
  price: number;
  image_url?: string;
  location?: string;
  icon?: string;
  savedAt: string;
}

const KEY = "vizha_favorites";

function load(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(items: FavoriteItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("vizha:favorites-changed", { detail: items }));
}

export function useFavorites() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(load());
    const timer = setTimeout(refresh, 0);
    window.addEventListener("vizha:favorites-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("vizha:favorites-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isFavorite = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: Omit<FavoriteItem, "savedAt">) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists ? prev.filter((i) => i.id !== item.id) : [{ ...item, savedAt: new Date().toISOString() }, ...prev];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => { const next = prev.filter((i) => i.id !== id); save(next); return next; });
  }, []);

  return { items, isFavorite, toggle, remove };
}
