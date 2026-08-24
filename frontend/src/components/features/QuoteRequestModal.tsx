"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/utils";
import type { Service } from "@/types";

export function QuoteRequestModal({ service, mode, onClose }: { service: Service; mode: "quote" | "booking"; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: "", mobile: "", eventDate: "", location: "", eventType: "", guestCount: "", budget: "", requiredServices: "", notes: "" });
  const change = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/quotes"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, serviceId: service.id, requestType: mode, requiredServices: form.requiredServices.split(",").map((v) => v.trim()).filter(Boolean) }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Unable to submit request");
      toast.success(mode === "booking" ? "Booking request sent to VizhaOne" : "Quote request sent successfully"); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to submit request"); }
    finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={onClose}>
    <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8">
      <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#be123c]">{mode === "booking" ? "Book with VizhaOne" : "Request transparent pricing"}</p><h2 className="mt-2 text-2xl font-black text-gray-900">{service.title}</h2></div><button type="button" onClick={onClose} className="rounded-full bg-gray-100 p-3"><X /></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {([['customerName','Full name *','text'],['mobile','Phone number *','tel'],['eventDate','Event date *','date'],['location','Event location *','text'],['eventType','Event type *','text'],['guestCount','Guest count','number'],['budget','Your budget','number']] as const).map(([key,label,type]) => <label key={key} className="text-sm font-bold text-gray-700">{label}<input required={label.includes('*')} type={type} value={form[key]} onChange={(e) => change(key,e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#e11d48]" /></label>)}
      </div>
      <label className="mt-4 block text-sm font-bold text-gray-700">Required services (comma separated)<input value={form.requiredServices} onChange={(e) => change('requiredServices',e.target.value)} placeholder="Catering, decoration, photography" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#e11d48]" /></label>
      <label className="mt-4 block text-sm font-bold text-gray-700">Notes<textarea value={form.notes} onChange={(e) => change('notes',e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#e11d48]" /></label>
      <button disabled={saving} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#be123c] to-[#e11d48] py-4 font-black text-white shadow-lg disabled:opacity-60">{saving ? "Sending..." : mode === "booking" ? "Confirm Booking Request" : "Request Quote"}</button>
    </form>
  </div>;
}
