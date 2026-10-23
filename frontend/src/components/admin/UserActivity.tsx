"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/utils";

type Day = { date: string; loginUsers: number; newUsers: number };
type Activity = { totalUsers: number; today: Day; daily: Day[] };

export function UserActivity() {
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(apiUrl("/api/admin/user-activity"), { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load activity");
        const result: Activity = await response.json();
        if (active) { setData(result); setError(false); }
      } catch { if (active) setError(true); }
    }
    void load();
    const timer = window.setInterval(() => { void load(); }, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <section className="card-premium p-5 mb-6" aria-label="Daily user activity">
    <h2 className="font-bold text-gray-900">User traction</h2>
    <p className="text-xs text-gray-500 mt-1">India time (IST). Unique signed-in users per day, including returning sessions. Admins excluded.</p>
    {error && <p role="alert" className="text-sm text-rose-700 mt-3">Unable to refresh user activity. {data ? "Showing the last loaded counts." : "Retrying automatically."}</p>}
    {!data ? <p className="text-sm text-gray-500 mt-4">{error ? "Activity unavailable" : "Loading user activity?"}</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
        {[['Total registered users', data.totalUsers], ["Today's login users", data.today.loginUsers], ["Today's new users", data.today.newUsers]].map(([label, value]) =>
          <div key={label} className="rounded-xl bg-rose-50 p-4"><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-600 mt-1">{label}</div></div>)}
      </div>
      <details><summary className="text-sm font-semibold cursor-pointer">Daily counts ? last 30 days</summary>
        <p className="text-xs text-gray-500 my-3">Login tracking begins with this update. New-user counts use account creation dates.</p>
        <div className="overflow-x-auto max-h-80"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Date (IST)</th><th className="p-2">Login users</th><th className="p-2">New users</th></tr></thead>
          <tbody>{data.daily.map(day => <tr key={day.date} className="border-t border-gray-100"><td className="p-2">{day.date}</td><td className="p-2">{day.loginUsers}</td><td className="p-2">{day.newUsers}</td></tr>)}</tbody></table></div>
      </details>
    </>}
  </section>;
}
