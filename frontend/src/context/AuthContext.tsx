"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { apiUrl } from "@/lib/utils";
import type { User } from "@/types";
import type { Session } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

// ─── Read / write the demo localStorage user ──────────────────────────────
function getDemoUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("vizha_demo_user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearDemoUser() {
  if (typeof window !== "undefined") localStorage.removeItem("vizha_demo_user");
}

function clearOldDemoData() {
  if (typeof window === "undefined") return;

  const freshVersion = "2026-06-03-empty-with-categories-v2";
  if (localStorage.getItem("vizha_fresh_version") === freshVersion) return;

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(userId: string): Promise<User | null> {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      return data as User | null;
    } catch {
      return null;
    }
  }

  async function refreshUser() {
    try {
      const response = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
      if (response.ok) {
        const { user } = await response.json();
        if (user) {
          localStorage.setItem("vizha_demo_user", JSON.stringify(user));
          setUser(user);
          return;
        }

        const cached = getDemoUser();
        if (cached?.role === "admin") {
          setUser(cached);
          return;
        }
      }
    } catch { /* use fallback below */ }

    const demo = getDemoUser();

    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) { setUser(profile); return; }
        }
      } catch { /* ignore — use demo fallback */ }
    }

    if (demo) setUser({ ...demo });
    else setUser(null);
  }

  useEffect(() => {
    clearOldDemoData();
    refreshUser().finally(() => setLoading(false));

    if (!isSupabaseConfigured) {
      // No real Supabase — immediately resolve with demo user if present
      const demo = getDemoUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (demo) setTimeout(() => setUser(demo), 0);
      setTimeout(() => setLoading(false), 0);
      return;
    }

    // 1. Check real Supabase session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
        setLoading(false);
        return;
      }
      // 2. No real session — try demo localStorage user
      const demo = getDemoUser();
      if (demo) setUser(demo);
      setLoading(false);
    });

    // 3. Listen for real Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
          clearDemoUser();           // real auth wins over demo
        } else {
          // Real sign-out: also clear demo user if present
          const demo = getDemoUser();
          if (!demo) setUser(null);  // only clear if no demo user
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Listen for localStorage changes (cross-tab) and same-tab custom event
  useEffect(() => {
    function syncUser() {
      const demo = getDemoUser();
      if (demo) setUser(demo);
      else setUser(null);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "vizha_demo_user") syncUser();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("vizha_auth_change", syncUser);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vizha_auth_change", syncUser);
    };
  }, []);

  async function signOut() {
    try { await supabase.auth.signOut(); } catch { void 0; }
    try {
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch { void 0; }
    clearDemoUser();
    setUser(null);
    setSession(null);
    window.dispatchEvent(new Event("vizha_auth_change"));
    window.location.href = "/about";
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      isAdmin: user?.role === "admin",
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
