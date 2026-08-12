"use client";
import { FormEvent, useState } from "react";
import { BellRing, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { savePlan, type CelebrationPlan, type Guest } from "@/lib/celebration";

export function GuestCircle({
  plan,
  onChange,
}: {
  plan: CelebrationPlan;
  onChange: (plan: CelebrationPlan) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    group: "Family",
    people: 1,
  });
  const normalized = (status: Guest["rsvp"]) =>
    status === "accepted"
      ? "joining"
      : status === "declined"
        ? "reminder"
        : status === "pending"
          ? "invited"
          : status;
  const total = plan.guests.reduce((sum, guest) => sum + guest.people, 0);
  const joining = plan.guests
    .filter((g) => normalized(g.rsvp) === "joining")
    .reduce((sum, guest) => sum + guest.people, 0);
  const reminders = plan.guests.filter(
    (g) => normalized(g.rsvp) === "reminder",
  ).length;
  function update(next: CelebrationPlan) {
    onChange(next);
    try { savePlan(next); } catch { toast.error("Unable to save. Remove large reel uploads and retry."); }
  }
  function add(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Enter guest name");
    if (!/^\+?[0-9 ]{10,14}$/.test(form.phone.trim())) return toast.error("Enter a valid phone number");
    if (form.people < 1 || form.people > 20) return toast.error("Guest count must be between 1 and 20");
    const guest: Guest = {
      id: `guest-${Date.now()}`,
      ...form,
      name: form.name.trim(),
      rsvp: "invited",
    };
    update({ ...plan, guests: [guest, ...plan.guests] });
    setForm({ name: "", phone: "", group: "Family", people: 1 });
    toast.success("Added to your Guest Circle");
  }
  const options = [
    { value: "invited", label: "Invited", tone: "bg-blue-500" },
    { value: "joining", label: "Joining Us", tone: "bg-emerald-500" },
    { value: "reminder", label: "Send Reminder", tone: "bg-violet-600" },
  ] as const;
  return (
    <>
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <UsersRound className="h-7 w-7" />
          <div>
            <h2 className="text-lg font-black">Guest Circle</h2>
            <p className="text-[10px] text-violet-100">
              Invite, connect and celebrate together
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            [total, "Invited"],
            [joining, "Joining Us"],
            [reminders, "Reminders"],
          ].map(([count, label]) => (
            <div
              key={String(label)}
              className="rounded-2xl bg-white/15 p-3 text-center"
            >
              <strong className="block text-xl">{count}</strong>
              <small className="text-[9px]">{label}</small>
            </div>
          ))}
        </div>
      </section>
      <form
        onSubmit={add}
        className="mt-5 rounded-3xl border bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-black">Add loved ones</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Guest name"
            className="rounded-xl border px-3 py-3 text-xs"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone (private)"
            className="rounded-xl border px-3 py-3 text-xs"
          />
          <select
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
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
            value={form.people}
            onChange={(e) =>
              setForm({ ...form, people: Number(e.target.value) })
            }
            className="rounded-xl border px-3 py-3 text-xs"
          />
        </div>
      <button type="submit" className="mt-3 flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-rose-600 py-4 text-xs font-black text-white active:scale-[.98]">
          <Plus className="h-4 w-4" />
          Add to Guest Circle
        </button>
      </form>
      <div className="mt-5 space-y-3">
        {plan.guests.map((guest) => (
          <article key={guest.id} className="rounded-2xl border bg-white p-4">
            <div className="flex justify-between">
              <div>
                <strong className="text-sm">{guest.name}</strong>
                <p className="mt-1 text-[10px] text-gray-400">
                  {guest.group} · {guest.people} people
                </p>
              </div>
              <button
                onClick={() =>
                  update({
                    ...plan,
                    guests: plan.guests.filter((g) => g.id !== guest.id),
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    update({
                      ...plan,
                      guests: plan.guests.map((g) =>
                        g.id === guest.id ? { ...g, rsvp: option.value } : g,
                      ),
                    })
                  }
                  className={`rounded-lg px-1 py-2 text-[8px] font-black ${normalized(guest.rsvp) === option.value ? `${option.tone} text-white` : "bg-gray-100 text-gray-400"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {!plan.guests.length && (
        <div className="mt-8 text-center">
          <BellRing className="mx-auto h-10 w-10 text-violet-300" />
          <p className="mt-3 text-sm font-black">Your Guest Circle is ready</p>
          <p className="mt-1 text-xs text-gray-400">
            Add your loved ones to get started.
          </p>
        </div>
      )}
    </>
  );
}
