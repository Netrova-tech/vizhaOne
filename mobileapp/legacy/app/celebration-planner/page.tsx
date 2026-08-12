"use client";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  Calculator,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  MapPin,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import {
  allocations,
  blankPlan,
  daysUntil,
  getPlan,
  savePlan,
  scheduleEventReminders,
  taskDueDate,
  type CelebrationPlan,
} from "@/lib/celebration";
import { GuestCircle } from "@/components/features/GuestCircle";
type Tab = "overview" | "checklist" | "budget" | "guests";
export default function CelebrationPlannerPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const pathTab = location.pathname.split("/")[2] as Tab | undefined;
  const requested = (pathTab || params.get("tab")) as Tab | null;
  const [tab, setTab] = useState<Tab>(
    requested && ["checklist", "budget", "guests"].includes(requested)
      ? requested
      : "overview",
  );
  const [plan, setPlan] = useState<CelebrationPlan>(blankPlan());
  const [draft, setDraft] = useState<CelebrationPlan>(blankPlan());
  const [saving, setSaving] = useState(false);
  const [guest, setGuest] = useState({ name: "", phone: "", group: "Family", people: 1 });
  useEffect(() => { const stored=getPlan(); setPlan(stored); setDraft(stored); }, []);
  useEffect(() => {
    if (
      requested &&
      ["overview", "checklist", "budget", "guests"].includes(requested)
    )
      setTab(requested);
  }, [requested]);
  const days = daysUntil(plan?.eventDate || "");
  const completed = plan?.tasks.filter((x) => x.done).length || 0;
  const accepted =
    plan?.guests
      .filter((x) => x.rsvp === "joining")
      .reduce((n, x) => n + x.people, 0) || 0;
  function update(next: CelebrationPlan, msg?: string) {
    setPlan(next);
    savePlan(next);
    if (msg) toast.success(msg);
  }
  async function saveEventPlan() {
    if (!draft.eventName.trim()) return toast.error("Enter your celebration name");
    if (!draft.eventDate) return toast.error("Select your event date");
    if (!draft.eventTime) return toast.error("Select your event time");
    setSaving(true);
    try {
      savePlan(draft);
      setPlan(draft);
      const count = await scheduleEventReminders(draft).catch(() => 0);
      toast.success(count ? `Plan saved · ${count} reminders scheduled` : "Plan saved · Allow notifications for reminders");
    } catch { toast.error("Unable to save your plan"); }
    finally { setSaving(false); }
  }
  function switchTab(next: Tab) {
    setTab(next);
    navigate(next === "overview" ? "/planner" : `/planner/${next}`);
  }
  function addGuest(event: FormEvent) {
    event.preventDefault();
    if (!plan || !guest.name.trim()) return;
    update({ ...plan, guests: [{ id: `guest-${Date.now()}`, ...guest, name: guest.name.trim(), rsvp: "invited" }, ...plan.guests] });
  }
  if (!plan) return null;
  const tabs = [
    ["overview", "Plan", CalendarCheck],
    ["checklist", "Tasks", ClipboardCheck],
    ["budget", "Budget", Calculator],
    ["guests", "Guests", UsersRound],
  ] as const;
  return (
    <div className="min-h-dvh bg-[#fffafb] pb-24">
      <MobilePageHeader
        title="My Celebration"
        subtitle="Plan every detail in one workspace"
      />
      <div className="sticky top-[69px] z-20 grid grid-cols-4 border-b bg-white p-2">
        {tabs.map(([value, label, Icon]) => (
          <button
            key={value}
            onClick={() => switchTab(value)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-black ${tab === value ? "bg-rose-50 text-rose-700" : "text-gray-400"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <main className="px-4 py-5">
        {tab === "overview" && (
          <>
            <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#6b1236] via-[#a31345] to-[#f43f5e] p-5 text-white shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-rose-100">
                {plan.eventType} countdown
              </p>
              <h1 className="mt-2 text-3xl font-black">
                {days === null
                  ? "Set your event date"
                  : days < 0
                    ? "Event completed"
                    : days === 0
                      ? "Today is the day!"
                      : `${days} days to go`}
              </h1>
              <p className="mt-2 text-sm text-rose-100">
                {plan.eventName}
                {plan.eventDate
                  ? ` · ${new Date(`${plan.eventDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                  : ""}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white"
                  style={{
                    width: `${plan.tasks.length ? (completed / plan.tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[10px]">
                {completed}/{plan.tasks.length} planning tasks completed
              </p>
            </section>
            <section className="mt-5 rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="font-black">Event details</h2>
              <div className="mt-4 space-y-3">
                <input
                  value={draft.eventName}
                  onChange={(e) => setDraft({ ...draft, eventName: e.target.value })}
                  placeholder="Example: Murugan & Priya Wedding"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm font-bold outline-none focus:border-rose-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={draft.eventType}
                    onChange={(e) => setDraft({ ...draft, eventType: e.target.value })}
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-4 text-sm font-bold"
                  >
                    <option>Wedding</option>
                    <option>Birthday</option>
                    <option>Baby Shower</option>
                    <option>Engagement</option>
                    <option>Housewarming</option>
                    <option>Other</option>
                  </select>
                  <span className="rounded-2xl border border-gray-200 bg-white px-3 py-2"><small className="block text-[9px] font-black uppercase text-rose-500">Event date</small><input aria-label="Event date" type="date" value={draft.eventDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setDraft({...draft,eventDate:e.target.value})} className="mt-1 w-full bg-transparent text-sm font-bold outline-none"/></span>
                </div>
                <label className="flex items-center rounded-2xl border border-gray-200 px-3"><Clock3 className="h-4 w-4 text-violet-500"/><span className="ml-3 text-xs font-bold text-gray-500">Event time</span><input aria-label="Event time" type="time" value={draft.eventTime} onChange={e=>setDraft({...draft,eventTime:e.target.value})} className="ml-auto py-4 text-sm font-bold outline-none"/></label>
                <label className="flex items-center rounded-2xl border px-3">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <input
                    value={draft.venue}
                    onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
                    placeholder="Venue / preferred location"
                    className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
                  />
                </label>
                <div className="rounded-2xl bg-violet-50 p-4 text-[10px] leading-5 text-violet-700"><strong className="block text-xs">Automatic reminders</strong>Save pannina event-ku 1 day before and 10 hours before notification schedule aagum.</div>
                <button type="button" disabled={saving} onClick={()=>void saveEventPlan()} className="w-full touch-manipulation rounded-2xl bg-gradient-to-r from-rose-700 to-rose-500 py-4 text-sm font-black text-white shadow-lg active:scale-[.98] disabled:opacity-60">{saving?"Saving plan...":"Save plan & start countdown"}</button>
              </div>
            </section>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => switchTab("checklist")}
                className="rounded-3xl bg-violet-600 p-4 text-left text-white"
              >
                <ClipboardCheck />
                <strong className="mt-5 block text-sm">
                  {plan.tasks.length - completed} tasks pending
                </strong>
              </button>
              <button
                onClick={() => switchTab("guests")}
                className="rounded-3xl bg-orange-500 p-4 text-left text-white"
              >
                <UsersRound />
                <strong className="mt-5 block text-sm">
                  {accepted} guests confirmed
                </strong>
              </button>
            </div>
            <Link
              to="/halls"
              className="mt-5 flex items-center justify-between rounded-3xl bg-gray-950 p-5 text-white"
            >
              <span>
                <small className="block text-[9px] uppercase tracking-wider text-gray-400">
                  For your selected date
                </small>
                <strong className="mt-1 block text-sm">
                  Find available halls
                </strong>
              </span>
              <Search className="h-5 w-5" />
            </Link>
          </>
        )}
        {tab === "checklist" && (
          <>
            <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-black">Planning progress</p>
                  <h2 className="mt-1 text-3xl font-black">
                    {Math.round((completed / plan.tasks.length) * 100)}%
                  </h2>
                </div>
                <Bell className="h-7 w-7" />
              </div>
              <p className="mt-3 text-xs text-violet-100">
                Due dates automatically calculate from your event date.
              </p>
            </section>
            <div className="mt-5 space-y-3">
              {plan.tasks.map((task) => (
                <article
                  key={task.id}
                  className={`flex items-start gap-3 rounded-2xl border bg-white p-4 ${task.done ? "opacity-60" : ""}`}
                >
                  <button
                    onClick={() =>
                      update({
                        ...plan,
                        tasks: plan.tasks.map((x) =>
                          x.id === task.id ? { ...x, done: !x.done } : x,
                        ),
                      })
                    }
                    className={`grid h-7 w-7 flex-none place-items-center rounded-full border-2 ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-rose-300"}`}
                  >
                    {task.done && <Check className="h-4 w-4" />}
                  </button>
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-black ${task.done ? "line-through" : ""}`}
                    >
                      {task.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Reminder: {taskDueDate(plan.eventDate, task.daysBefore)} ·{" "}
                      {task.daysBefore} days before
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "budget" && (
          <>
            <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-wider">
                Estimated celebration budget
              </p>
              <h2 className="mt-2 text-3xl font-black">
                ₹{plan.budget.toLocaleString("en-IN")}
              </h2>
              <p className="mt-2 text-xs text-emerald-100">
                ₹
                {Math.round(plan.budget / plan.guestTarget).toLocaleString(
                  "en-IN",
                )}{" "}
                per guest · {plan.guestTarget} guests
              </p>
            </section>
            <section className="mt-5 rounded-3xl border bg-white p-5">
              <label className="text-xs font-black">
                Total budget
                <input
                  type="number"
                  value={plan.budget}
                  onChange={(e) =>
                    update({
                      ...plan,
                      budget: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="mt-2 w-full rounded-2xl border px-4 py-3 text-lg font-black"
                />
              </label>
              <label className="mt-4 block text-xs font-black">
                Expected guests
                <input
                  type="range"
                  min="25"
                  max="2000"
                  step="25"
                  value={plan.guestTarget}
                  onChange={(e) =>
                    update({ ...plan, guestTarget: Number(e.target.value) })
                  }
                  className="mt-3 w-full accent-rose-600"
                />
                <span className="mt-1 block text-right text-sm text-rose-600">
                  {plan.guestTarget}
                </span>
              </label>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["budget", "mid", "premium"] as const).map((t) => (
                  <button
                    onClick={() => update({ ...plan, tier: t })}
                    key={t}
                    className={`rounded-xl py-3 text-xs font-black capitalize ${plan.tier === t ? "bg-rose-600 text-white" : "bg-gray-100"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>
            <section className="mt-5 space-y-2">
              {allocations.map(([name, percent]) => (
                <article key={name} className="rounded-2xl border bg-white p-4">
                  <div className="flex justify-between">
                    <strong className="text-xs">{name}</strong>
                    <strong className="text-xs text-rose-600">
                      ₹
                      {Math.round((plan.budget * percent) / 100).toLocaleString(
                        "en-IN",
                      )}
                    </strong>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${percent * 2.6}%` }}
                    />
                  </div>
                  <small className="mt-1 block text-[9px] text-gray-400">
                    {percent}% allocation
                  </small>
                </article>
              ))}
            </section>
            <Link
              to="/services"
              className="mt-5 flex items-center justify-between rounded-2xl bg-gray-950 p-4 text-sm font-black text-white"
            >
              Find vendors for this budget
              <ChevronRight />
            </Link>
          </>
        )}
        {tab === "guests" && <GuestCircle plan={plan} onChange={setPlan} />}
        {plan && false && tab === "guests" && (
          <>
            <section className="grid grid-cols-3 gap-2">
              {[
                [plan.guests.reduce((n, g) => n + g.people, 0), "Invited"],
                [accepted, "Accepted"],
                [
                  plan.guests.filter((g) => g.rsvp === "pending").length,
                  "Pending",
                ],
              ].map(([n, label]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border bg-white p-3 text-center"
                >
                  <strong className="block text-xl text-rose-600">{n}</strong>
                  <small className="text-[9px] text-gray-400">{label}</small>
                </div>
              ))}
            </section>
            <form
              onSubmit={addGuest}
              className="mt-5 rounded-3xl border bg-white p-4 shadow-sm"
            >
              <h2 className="text-sm font-black">Add guest</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={guest.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                  placeholder="Guest name"
                  className="rounded-xl border px-3 py-3 text-xs"
                />
                <input
                  value={guest.phone}
                  onChange={(e) =>
                    setGuest({ ...guest, phone: e.target.value })
                  }
                  placeholder="Phone (private)"
                  className="rounded-xl border px-3 py-3 text-xs"
                />
                <select
                  value={guest.group}
                  onChange={(e) =>
                    setGuest({ ...guest, group: e.target.value })
                  }
                  className="rounded-xl border bg-white px-3 text-xs"
                >
                  <option>Family</option>
                  <option>Friends</option>
                  <option>Work</option>
                  <option>VIP</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={guest.people}
                  onChange={(e) =>
                    setGuest({ ...guest, people: Number(e.target.value) })
                  }
                  className="rounded-xl border px-3 py-3 text-xs"
                />
              </div>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-black text-white">
                <Plus className="h-4 w-4" />
                Add guest
              </button>
            </form>
            <div className="mt-5 space-y-2">
              {plan.guests.map((g) => (
                <article key={g.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm">{g.name}</strong>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {g.group} · {g.people} people
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        update({
                          ...plan,
                          guests: plan.guests.filter((x) => x.id !== g.id),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1">
                    {(["pending", "accepted", "declined"] as const).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            update({
                              ...plan,
                              guests: plan.guests.map((x) =>
                                x.id === g.id ? { ...x, rsvp: status } : x,
                              ),
                            })
                          }
                          className={`rounded-lg py-2 text-[9px] font-black capitalize ${g.rsvp === status ? (status === "accepted" ? "bg-emerald-500 text-white" : status === "declined" ? "bg-gray-600 text-white" : "bg-amber-400 text-white") : "bg-gray-100 text-gray-400"}`}
                        >
                          {status}
                        </button>
                      ),
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}
