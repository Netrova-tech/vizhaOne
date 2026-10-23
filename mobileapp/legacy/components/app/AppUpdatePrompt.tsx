"use client";

import { useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Download } from "lucide-react";
import { checkPlayStoreUpdate, openPlayStoreUpdate } from "@/lib/appUpdate";

export function AppUpdatePrompt() {
  const [available, setAvailable] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    let active = true;
    let checking = false;
    let lastCheck = 0;
    const check = async () => {
      // Avoid duplicate checks while returning from the Play Store or permission dialogs.
      if (checking || (lastCheck && Date.now() - lastCheck < 30000)) return;
      checking = true;
      lastCheck = Date.now();
      const updateAvailable = await checkPlayStoreUpdate();
      if (active) { setAvailable(updateAvailable); setError(""); }
      checking = false;
    };
    void check();
    const listener = App.addListener("appStateChange", state => {
      if (state.isActive) void check();
    });
    void listener.catch(() => undefined);
    return () => { active = false; void listener.then(handle => handle.remove()).catch(() => undefined); };
  }, []);
  useEffect(() => {
    if (available && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [available]);
  async function update() {
    setOpening(true); setError("");
    try { await openPlayStoreUpdate(); }
    catch { setError("Could not open Google Play. Please try again."); }
    finally { setOpening(false); }
  }
  if (!available) return null;
  return <dialog ref={dialog} data-app-update aria-labelledby="app-update-title" aria-describedby="app-update-description"
    onClose={() => setAvailable(false)} className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border-0 bg-white p-6 shadow-2xl backdrop:bg-black/55">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Download className="h-7 w-7" /></div>
    <h2 id="app-update-title" className="text-2xl font-bold text-gray-950">Update VizhaOne</h2>
    <p id="app-update-description" className="mt-3 text-sm leading-6 text-gray-600">A new version is available on Google Play. Update to get the latest features and improvements.</p>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    <button type="button" disabled={opening} onClick={() => void update()} className="mt-6 w-full rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white disabled:opacity-50">{opening ? "Opening Google Play..." : "Update now"}</button>
    <button type="button" disabled={opening} onClick={() => dialog.current?.close()} className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold text-gray-600">Later</button>
  </dialog>;
}
