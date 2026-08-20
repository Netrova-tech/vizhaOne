"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

const VizhaOneApp = dynamic(() => import("../LegacyRoot"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-dvh items-center justify-center bg-rose-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
        <p className="font-bold text-rose-800">Opening VizhaOne...</p>
      </div>
    </main>
  ),
});

export default function MobileAppPage() {
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const onReady = () => setAppReady(true);
    window.addEventListener("vizha_app_ready", onReady);
    const timer = window.setTimeout(() => setMinimumTimeElapsed(true), 3000);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("vizha_app_ready", onReady);
    };
  }, []);

  useEffect(() => {
    if (!minimumTimeElapsed || !appReady) return;
    void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
  }, [appReady, minimumTimeElapsed]);

  return (
    <div className="app-scroll-root">
      <VizhaOneApp />
      {!(minimumTimeElapsed && appReady) && (
        <div
          className="fixed inset-0 z-[10000] bg-[#fff8f4] transition-opacity duration-300"
          role="status"
          aria-label="Opening VizhaOne"
        >
          <Image
            src="/vizhaone-splash.png"
            alt="VizhaOne — Discover, Book, Celebrate"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
