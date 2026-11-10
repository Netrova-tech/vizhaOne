"use client";

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";

const HOME_ROUTE = "/";
const MAIN_TAB_ROUTES = new Set(["/services", "/bookings", "/reels", "/profile"]);

export function NativeBackHandler() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;
    let removeListener: (() => Promise<void>) | undefined;

    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (!active) return;

      // Main navigation tabs should always return to Home instead of closing
      // the Android activity or reopening an unrelated route.
      if (MAIN_TAB_ROUTES.has(pathname)) {
        navigate(HOME_ROUTE);
        return;
      }

      // Keep VizhaOne open when the user is already on Home.
      if (pathname === HOME_ROUTE) return;

      if (canGoBack && window.history.length > 1) navigate(-1);
      else navigate(HOME_ROUTE, { replace: true });
    }).then((handle) => {
      removeListener = () => handle.remove();
      if (!active) void handle.remove();
    });

    return () => {
      active = false;
      if (removeListener) void removeListener();
    };
  }, [navigate, pathname]);

  return null;
}
