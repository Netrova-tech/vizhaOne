"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { disablePush, enablePush, pushEnabled, pushSupported } from "@/lib/pushNotifications";

export function PushNotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setSupported(pushSupported());
    const sync = () => setEnabled(pushEnabled());
    sync();
    window.addEventListener("vizha_push_change", sync);
    return () => window.removeEventListener("vizha_push_change", sync);
  }, []);
  async function toggle() {
    setBusy(true); setMessage("");
    try {
      if (enabled) { await disablePush(); setMessage("Notifications turned off"); }
      else { await enablePush(); setMessage("Notifications enabled for booking updates"); }
      setEnabled(pushEnabled());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update notifications"); }
    finally { setBusy(false); }
  }
  return <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm" aria-label="Push notification settings">
    <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-rose-600" /><div className="flex-1"><h2 className="text-sm font-bold">Notifications</h2><p className="text-xs text-gray-500">Get updates when your booking status changes.</p></div></div>
    {supported ? <button type="button" disabled={busy} onClick={() => void toggle()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Updating..." : enabled ? "Turn off notifications" : "Enable notifications"}</button> : <p className="mt-3 text-xs text-gray-500">Open the Android app to enable push notifications.</p>}
    {message && <p role="status" className="mt-2 text-xs text-gray-600">{message}</p>}
  </section>;
}
