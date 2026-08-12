"use client";

import dynamic from "next/dynamic";

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
  return (
    <div className="app-scroll-root">
      <VizhaOneApp />
    </div>
  );
}
