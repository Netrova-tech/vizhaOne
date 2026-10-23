"use client";

import { useEffect } from "react";
import { HashRouter, useLocation, useNavigate } from "react-router-dom";
import App from "@/App";
import { restorePush } from "@/lib/pushNotifications";
import { fetchAccount, token } from "@/lib/mobileAuth";

const publicRoutes = ["/sign-in", "/sign-up", "/auth/login", "/auth/verify", "/invite/"];

function AuthenticationGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
    const rawSession = localStorage.getItem("vizha_demo_user");
    const signedIn = Boolean(rawSession);
    if (!signedIn && !isPublic) navigate("/sign-in", { replace: true });
    if (signedIn && (pathname === "/sign-in" || pathname === "/sign-up")) {
      try {
        const session = JSON.parse(rawSession || "{}");
        navigate(session.role === "service_provider" ? "/provider-dashboard" : "/", { replace: true });
      } catch { navigate("/", { replace: true }); }
    }
    if (signedIn && pathname === "/") {
      try { if (JSON.parse(rawSession || "{}").role === "service_provider") navigate("/provider-dashboard", { replace: true }); } catch { void 0; }
    }
  }, [navigate, pathname]);

  return children;
}

export default function LegacyRoot() {
  useEffect(() => {
    const restore = () => { if (document.visibilityState === "visible") void restorePush().catch(() => undefined); };
    restore();
    window.addEventListener("vizha_auth_change", restore);
    document.addEventListener("visibilitychange", restore);
    const timer = window.setInterval(restore, 5 * 60 * 1000);
    return () => { window.removeEventListener("vizha_auth_change", restore); document.removeEventListener("visibilitychange", restore); window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    const track = () => { if (document.visibilityState === "visible" && token()) void fetchAccount().catch(() => undefined); };
    track();
    document.addEventListener("visibilitychange", track);
    const timer = window.setInterval(track, 60000);
    return () => { document.removeEventListener("visibilitychange", track); window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("vizha_app_ready"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <HashRouter>
      <AuthenticationGate><App /></AuthenticationGate>
    </HashRouter>
  );
}
