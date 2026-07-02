import type { Category, EventPackage, Hall, Service } from "@/types";
import { DEMO_CATEGORIES, DEMO_PACKAGES, DEMO_SERVICES } from "@/data/demo";
import { DEMO_HALLS } from "@/data/halls";
import { apiUrl } from "@/lib/utils";

export interface PublicCatalog {
  categories: Category[];
  services: Service[];
  halls: Hall[];
  packages: EventPackage[];
}

function readLocalArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeCatalog(data: Partial<PublicCatalog> | null | undefined): PublicCatalog {
  return {
    categories: Array.isArray(data?.categories) ? data.categories : [],
    services: Array.isArray(data?.services) ? data.services : [],
    halls: Array.isArray(data?.halls) ? data.halls : [],
    packages: Array.isArray(data?.packages) ? data.packages : [],
  };
}

export function getFallbackCatalog(): PublicCatalog {
  const localCatalog = normalizeCatalog({
    categories: readLocalArray<Category>("vizha_admin_categories"),
    services: readLocalArray<Service>("vizha_admin_services"),
    halls: readLocalArray<Hall>("vizha_admin_halls"),
    packages: readLocalArray<EventPackage>("vizha_admin_packages"),
  });

  return {
    categories: localCatalog.categories.length ? localCatalog.categories : (DEMO_CATEGORIES as Category[]),
    services: localCatalog.services.length ? localCatalog.services : (DEMO_SERVICES as Service[]),
    halls: localCatalog.halls.length ? localCatalog.halls : (DEMO_HALLS as Hall[]),
    packages: localCatalog.packages.length ? localCatalog.packages : (DEMO_PACKAGES as EventPackage[]),
  };
}

export async function fetchPublicCatalog(): Promise<PublicCatalog> {
  try {
    const response = await fetch(apiUrl("/api/catalog"), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return getFallbackCatalog();
    }

    const data = await response.json().catch(() => null);
    const catalog = normalizeCatalog(data);

    return {
      categories: catalog.categories.length ? catalog.categories : getFallbackCatalog().categories,
      services: catalog.services.length ? catalog.services : getFallbackCatalog().services,
      halls: catalog.halls.length ? catalog.halls : getFallbackCatalog().halls,
      packages: catalog.packages.length ? catalog.packages : getFallbackCatalog().packages,
    };
  } catch {
    return getFallbackCatalog();
  }
}

export async function fetchHallServiceIds(hallId: string): Promise<string[]> {
  try {
    const response = await fetch(apiUrl(`/api/catalog/hall-services/${hallId}`));
    if (!response.ok) return [];

    const data = await response.json().catch(() => null);
    return Array.isArray(data) ? data.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}
