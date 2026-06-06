"use client";

import { useEffect, useState } from "react";
import { fetchPublicCatalog, type PublicCatalog } from "@/lib/catalogApi";
import { DEMO_CATEGORIES, DEMO_PACKAGES, DEMO_SERVICES } from "@/data/demo";
import { DEMO_HALLS } from "@/data/halls";

const EMPTY_CATALOG: PublicCatalog = {
  categories: DEMO_CATEGORIES as PublicCatalog["categories"],
  services: DEMO_SERVICES as PublicCatalog["services"],
  halls: DEMO_HALLS as PublicCatalog["halls"],
  packages: DEMO_PACKAGES as PublicCatalog["packages"],
};

export function useCatalog() {
  const [catalog, setCatalog] = useState<PublicCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const data = await fetchPublicCatalog();
      if (!active) return;
      setCatalog(data);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { ...catalog, loading };
}
