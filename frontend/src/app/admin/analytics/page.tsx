"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Activity, CheckCircle, MessageCircle, PhoneCall, TrendingUp, UserPlus, Users, XCircle } from "lucide-react";
import { getAdminAnalytics, type InquiryStatus } from "@/lib/api";

const COLORS: Record<InquiryStatus, string> = {
  interested: "#3b82f6",
  contacted: "#f59e0b",
  confirmed: "#16a34a",
  dropped: "#ef4444",
};

const LABELS: Record<InquiryStatus, string> = {
  interested: "Interested",
  contacted: "Contacted",
  confirmed: "Confirmed",
  dropped: "Dropped",
};

type Analytics = Awaited<ReturnType<typeof getAdminAnalytics>>;

export default function AnalyticsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    getAdminAnalytics().then(setAnalytics).catch(() => {
      setAnalytics({
        stats: { total: 0, interested: 0, contacted: 0, confirmed: 0, dropped: 0 },
        conversionRate: 0,
        statusDistribution: [],
        monthlyInquiries: [],
        hallPerformance: [],
        inquiryTrend: [],
        customers: { unique: 0, repeat: 0, newThisMonth: 0 },
      });
    });
  }, [isAdmin]);

  if (loading || !analytics) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="h-12 w-12 border-4 border-[#e11d48] border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAdmin) return null;

  const kpis = [
    { label: "Total Inquiries", value: analytics.stats.total, icon: MessageCircle, color: "text-[#e11d48] bg-[#fff1f2]" },
    { label: "Interested", value: analytics.stats.interested, icon: Activity, color: "text-blue-600 bg-blue-50" },
    { label: "Contacted", value: analytics.stats.contacted, icon: PhoneCall, color: "text-amber-600 bg-amber-50" },
    { label: "Confirmed", value: analytics.stats.confirmed, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Dropped", value: analytics.stats.dropped, icon: XCircle, color: "text-red-600 bg-red-50" },
    { label: "Conversion Rate", value: `${analytics.conversionRate}%`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { label: "Unique Customers", value: analytics.customers.unique, icon: Users, color: "text-cyan-600 bg-cyan-50" },
    { label: "New This Month", value: analytics.customers.newThisMonth, icon: UserPlus, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-[#e11d48]">← Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">CRM Analytics</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((stat) => (
            <div key={stat.label} className="card-premium p-5">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card-premium p-5">
            <h3 className="font-bold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={analytics.statusDistribution} dataKey="count" nameKey="status" innerRadius={62} outerRadius={96}>
                  {analytics.statusDistribution.map((row) => <Cell key={row.status} fill={COLORS[row.status]} />)}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [value, LABELS[item.payload.status as InquiryStatus]]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {analytics.statusDistribution.map((row) => <span key={row.status} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[row.status] }} />{LABELS[row.status]}</span>)}
            </div>
          </div>

          <div className="card-premium p-5">
            <h3 className="font-bold text-gray-900 mb-4">Monthly Inquiries</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.monthlyInquiries} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip />
                <Bar dataKey="inquiries" fill="#e11d48" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-premium p-5">
            <h3 className="font-bold text-gray-900 mb-4">Top 10 Inquired Halls</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.hallPerformance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="hallName" width={130} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-premium p-5">
            <h3 className="font-bold text-gray-900 mb-4">Inquiry Trend (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.inquiryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#e11d48" strokeWidth={2.5} fill="#fff1f2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
