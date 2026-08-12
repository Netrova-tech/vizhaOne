"use client";
import { useEffect, useState } from "react";
import { Bell, Clock3 } from "lucide-react";
import { reminderDates, savePlan, scheduleEventReminders, type CelebrationPlan } from "@/lib/celebration";

export function EventReminderSetup({ plan, onChange }: { plan: CelebrationPlan; onChange: (plan: CelebrationPlan) => void }) {
  const [status,setStatus]=useState("Set an event date and time");
  useEffect(()=>{if(!plan.eventDate)return;void scheduleEventReminders(plan).then(count=>setStatus(count?`${count} reminders scheduled`:"Reminder times have passed")).catch(error=>setStatus(error instanceof Error&&error.message==="notification-denied"?"Allow notifications to enable reminders":"Unable to schedule reminders"))},[plan.eventDate,plan.eventTime]);
  function time(value:string){const next={...plan,eventTime:value};savePlan(next);onChange(next)}
  return <section className="mt-3 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="flex items-center gap-2 text-xs font-black text-violet-700"><Bell className="h-4 w-4"/>Automatic reminders</div><label className="mt-3 flex items-center rounded-xl bg-white px-3"><Clock3 className="h-4 w-4 text-violet-500"/><span className="ml-2 text-[10px] font-bold text-gray-500">Event time</span><input type="time" value={plan.eventTime} onChange={e=>time(e.target.value)} className="ml-auto py-3 text-sm outline-none"/></label><p className="mt-3 text-[10px] font-bold text-violet-600">{status}</p>{plan.eventDate&&<div className="mt-2 space-y-1">{reminderDates(plan).map(item=><p key={item.id} className="text-[9px] text-gray-500">{item.label}: {item.at.toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}</p>)}</div>}</section>;
}
