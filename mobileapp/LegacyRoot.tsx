"use client";

import { useEffect } from "react";
import { HashRouter, useLocation, useNavigate } from "react-router-dom";
import App from "@/App";

const publicRoutes = ["/sign-in", "/sign-up", "/auth/verify", "/invite/"];

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
  return (
    <HashRouter>
      <AuthenticationGate><App /></AuthenticationGate>
    </HashRouter>
  );
}
