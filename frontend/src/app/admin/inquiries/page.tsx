"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Download, Eye, MessageCircle, Phone, RotateCcw, Search, Trash2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { formatDate } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { deleteCrmInquiry, getCrmInquiries, getCrmStats, updateInquiryStatus, type CrmInquiry, type CrmStats, type InquiryStatus } from "@/lib/api";

const STATUS_CONFIG: Record<InquiryStatus, { color: string; label: string; next: InquiryStatus[] }> = {
  interested: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Interested", next: ["contacted", "dropped"] },
  contacted: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "Contacted", next: ["confirmed", "dropped"] },
  confirmed: { color: "bg-green-100 text-green-800 border-green-200", label: "Confirmed", next: ["dropped"] },
  dropped: { color: "bg-red-100 text-red-800 border-red-200", label: "Dropped", next: [] },
};

const emptyStats: CrmStats = { total: 0, interested: 0, contacted: 0, confirmed: 0, dropped: 0 };
type EventDateFilterMode = "date" | "month" | "year";

function formatMaybeDate(value?: string) {
  return value ? formatDate(value) : "N/A";
}

function formatEventRange(inquiry: CrmInquiry) {
  const start = inquiry.eventStartDate || inquiry.eventDate;
  const end = inquiry.eventEndDate || inquiry.eventDate || start;
  if (!start) return "N/A";
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} to ${formatDate(end)}`;
}

export default function InquiriesPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<CrmInquiry[]>([]);
  const [stats, setStats] = useState<CrmStats>(emptyStats);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");
  const [dateFilterMode, setDateFilterMode] = useState<EventDateFilterMode>("date");
  const [eventDate, setEventDate] = useState("");
  const [eventMonth, setEventMonth] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<CrmInquiry | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const [statsResult, listResult] = await Promise.all([
          getCrmStats(),
          getCrmInquiries({
            search,
            status: filter,
            page,
            limit: 20,
            sortBy: "createdAt",
            sortDir: "desc",
            ...(dateFilterMode === "date" && eventDate ? { eventDate } : {}),
            ...(dateFilterMode === "month" && eventMonth ? { eventMonth } : {}),
            ...(dateFilterMode === "year" && eventYear ? { eventYear } : {}),
          }),
        ]);
        setStats(statsResult);
        setInquiries(listResult.items);
        setTotal(listResult.total);
      } catch {
        toast.error("Unable to load CRM data");
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [isAdmin, search, filter, page, dateFilterMode, eventDate, eventMonth, eventYear]);

  const totalPages = Math.max(Math.ceil(total / 20), 1);
  const exportUrl = useMemo(() => {
    const params = new URLSearchParams({ format: "csv", search, status: filter });
    if (dateFilterMode === "date" && eventDate) params.set("eventDate", eventDate);
    if (dateFilterMode === "month" && eventMonth) params.set("eventMonth", eventMonth);
    if (dateFilterMode === "year" && eventYear) params.set("eventYear", eventYear);
    return `/api/admin/crm/export?${params.toString()}`;
  }, [search, filter, dateFilterMode, eventDate, eventMonth, eventYear]);

  function clearDateFilters() {
    setEventDate("");
    setEventMonth("");
    setEventYear("");
    setPage(1);
  }

  async function changeStatus(inquiry: CrmInquiry, status: InquiryStatus) {
    try {
      const updated = await updateInquiryStatus(inquiry.id, status);
      setInquiries((rows) => rows.map((row) => row.id === inquiry.id ? updated : row));
      setSelected((current) => current?.id === inquiry.id ? updated : current);
      setStats(await getCrmStats());
      toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    }
  }

  async function handleDeleteInquiry(inquiry: CrmInquiry) {
    if (!window.confirm("Delete this inquiry permanently?")) return;

    try {
      await deleteCrmInquiry(inquiry.id);
      setInquiries((rows) => rows.filter((row) => row.id !== inquiry.id));
      setSelected((current) => current?.id === inquiry.id ? null : current);
      setTotal((count) => Math.max(count - 1, 0));
      setStats(await getCrmStats());
      toast.success("Inquiry deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inquiry delete failed");
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-[#e11d48]">← Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">Inquiry Management</h1>
          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">Mini CRM</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["interested", "contacted", "confirmed", "dropped"] as InquiryStatus[]).map((status) => (
            <button key={status} onClick={() => { setFilter(filter === status ? "all" : status); setPage(1); }}
              className={`card-premium p-3 text-center transition-all ${filter === status ? "ring-2 ring-[#e11d48]" : ""}`}>
              <div className="text-2xl font-bold text-gray-900">{stats[status]}</div>
              <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CONFIG[status].color}`}>{STATUS_CONFIG[status].label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by customer name, phone, or hall..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateFilterMode}
              onChange={(e) => { setDateFilterMode(e.target.value as EventDateFilterMode); clearDateFilters(); }}
              className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
              aria-label="Event date filter type"
            >
              <option value="date">Date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            {dateFilterMode === "date" && (
              <input
                type="date"
                value={eventDate}
                onChange={(e) => { setEventDate(e.target.value); setPage(1); }}
                className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                aria-label="Filter by event date"
              />
            )}
            {dateFilterMode === "month" && (
              <input
                type="month"
                value={eventMonth}
                onChange={(e) => { setEventMonth(e.target.value); setPage(1); }}
                className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                aria-label="Filter by event month"
              />
            )}
            {dateFilterMode === "year" && (
              <input
                type="number"
                min="2020"
                max="2100"
                placeholder="Year"
                value={eventYear}
                onChange={(e) => { setEventYear(e.target.value.replace(/\D/g, "").slice(0, 4)); setPage(1); }}
                className="w-24 px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                aria-label="Filter by event year"
              />
            )}
            <button
              type="button"
              onClick={clearDateFilters}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#e11d48]"
              aria-label="Clear event date filters"
              title="Clear event date filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <a href={exportUrl} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:text-[#e11d48]">
            <Download className="h-4 w-4" /> CSV
          </a>
          <a href={exportUrl.replace("format=csv", "format=excel")} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:text-[#e11d48]">
            <Download className="h-4 w-4" /> Excel
          </a>
        </div>

        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="p-4">Customer</th><th className="p-4">Phone</th><th className="p-4">Hall</th><th className="p-4">Event Date</th><th className="p-4">Created</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="bg-white">
                    <td className="p-4 font-bold text-gray-900">{inquiry.customerName}</td>
                    <td className="p-4 text-gray-600">{inquiry.customerPhone}</td>
                    <td className="p-4 text-gray-600">{inquiry.hallName || "N/A"}</td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatEventRange(inquiry)}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(inquiry.created_at || inquiry.createdAt || "")}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_CONFIG[inquiry.status].color}`}>{STATUS_CONFIG[inquiry.status].label}</span></td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelected(inquiry)} className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" aria-label="View inquiry"><Eye className="h-4 w-4" /></button>
                        <a href={`tel:${inquiry.customerPhone}`} className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" aria-label="Call"><Phone className="h-4 w-4" /></a>
                        <a href={`https://wa.me/91${inquiry.customerPhone}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#e11d48] text-white" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
                        <button onClick={() => handleDeleteInquiry(inquiry)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" aria-label="Delete inquiry" title="Delete inquiry"><Trash2 className="h-4 w-4" /></button>
                        {STATUS_CONFIG[inquiry.status].next.map((next) => (
                          <button key={next} onClick={() => changeStatus(inquiry, next)} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#e11d48]">{STATUS_CONFIG[next].label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inquiries.length === 0 && <div className="text-center py-12 text-gray-500">{busy ? "Loading inquiries..." : "No inquiries found"}</div>}
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>{total} inquiries</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 rounded-lg bg-white border disabled:opacity-40">Previous</button>
            <span className="px-3 py-2">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 rounded-lg bg-white border disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <aside className="h-full w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto">
            <button onClick={() => setSelected(null)} className="text-sm text-gray-500 mb-6">Close</button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selected.customerName}</h2>
            {[
              ["Phone Number", selected.customerPhone],
              ["Email", selected.customerEmail || "N/A"],
              ["Selected Hall", selected.hallName || "N/A"],
              ["Event Start Date", formatMaybeDate(selected.eventStartDate || selected.eventDate)],
              ["Event End Date", formatMaybeDate(selected.eventEndDate || selected.eventDate)],
              ["Event Range", formatEventRange(selected)],
              ["Slot", selected.slot || "N/A"],
              ["Expected Guests", selected.expectedGuests || "N/A"],
              ["Created Date", formatMaybeDate(selected.created_at || selected.createdAt)],
              ["Current Status", STATUS_CONFIG[selected.status].label],
              ["Notes", selected.notes || "N/A"],
            ].map(([label, value]) => (
              <div key={label} className="py-3 border-b border-gray-100">
                <p className="text-xs font-bold uppercase text-gray-400">{label}</p>
                <p className="text-sm text-gray-800 mt-1">{value}</p>
              </div>
            ))}
            <div className="flex gap-2 mt-6">
              <button onClick={() => handleDeleteInquiry(selected)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100">Delete</button>
              {STATUS_CONFIG[selected.status].next.map((next) => (
                <button key={next} onClick={() => changeStatus(selected, next)} className="flex-1 py-3 bg-[#e11d48] text-white rounded-xl text-sm font-bold">{STATUS_CONFIG[next].label}</button>
              ))}
            </div>
          </aside>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}
