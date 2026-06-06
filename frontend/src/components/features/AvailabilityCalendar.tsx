"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HallSlot, SlotType } from "@/types";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";

interface AvailabilityCalendarProps {
  slots: HallSlot[];
  onSelectDate?: (date: string, slot: SlotType) => void;
  selectedDate?: string;
  selectedSlot?: SlotType;
  readOnly?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTHS_TA = [
  "ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்",
  "ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"
];

type SlotAvailability = {
  morning: "available" | "booked" | "blocked" | "none";
  evening: "available" | "booked" | "blocked" | "none";
};

export function AvailabilityCalendar({
  slots, onSelectDate, selectedDate, selectedSlot, readOnly = false
}: AvailabilityCalendarProps) {
  const { lang, t } = useLang();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const slotMap = useMemo(() => {
    const map = new Map<string, SlotAvailability>();
    slots.forEach((s) => {
      const existing = map.get(s.date) || { morning: "none" as const, evening: "none" as const };
      if (s.slot === "morning") existing.morning = s.status;
      else if (s.slot === "evening") existing.evening = s.status;
      map.set(s.date, existing);
    });
    return map;
  }, [slots]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getDayStatus(day: number): SlotAvailability {
    const ds = dateStr(day);
    return slotMap.get(ds) || { morning: "none", evening: "none" };
  }

  function isToday(day: number) {
    const d = new Date(year, month, day);
    return d.toDateString() === today.toDateString();
  }

  function isPast(day: number) {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  }

  const monthLabel = lang === "ta" ? MONTHS_TA[month] : MONTHS[month];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e11d48] to-[#be123c] p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h3 className="font-bold text-white text-lg">{monthLabel} {year}</h3>
            <p className="text-[#e11d48]/20 text-xs">{t("availability")}</p>
          </div>
          <button
            onClick={nextMonth}
            className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100">
        {[
          { color: "bg-green-400", label: t("available") },
          { color: "bg-red-400", label: t("booked") },
          { color: "bg-gray-300", label: t("blocked") },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-600 font-medium">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-green-300" />
            <div className="h-2.5 w-2.5 rounded-sm bg-red-300" />
          </div>
          <span className="text-xs text-gray-600 font-medium">M / E</span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-3 pb-4 gap-y-1">
        {/* Empty cells */}
        {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const ds = dateStr(day);
          const status = getDayStatus(day);
          const past = isPast(day);
          const isSelected = selectedDate === ds;
          const isHovered = hoveredDate === ds;

          const hasData = status.morning !== "none" || status.evening !== "none";

          return (
            <motion.div
              key={day}
              whileHover={!past && !readOnly ? { scale: 1.05 } : {}}
              className="relative"
              onMouseEnter={() => setHoveredDate(ds)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div
                onClick={() => {
                  if (past || readOnly || !hasData) return;
                  // Prefer available slot
                  const slot: SlotType = status.morning === "available" ? "morning" : "evening";
                  onSelectDate?.(ds, slot);
                }}
                className={cn(
                  "relative flex flex-col items-center rounded-xl py-1.5 cursor-pointer transition-all",
                  past ? "opacity-40 cursor-not-allowed" : "",
                  isSelected ? "ring-2 ring-[#e11d48] ring-offset-1 bg-[#fff1f2]" : "",
                  isToday(day) ? "font-bold" : "",
                  !past && !readOnly && hasData ? "hover:bg-gray-50" : "",
                )}
              >
                {isToday(day) && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-extrabold text-[#e11d48] leading-none">
                    TODAY
                  </span>
                )}
                <span className={cn(
                  "text-sm font-medium leading-none mb-1.5 mt-1",
                  isToday(day)
                    ? "h-6 w-6 rounded-full bg-[#e11d48] text-white flex items-center justify-center text-xs font-extrabold"
                    : "",
                  !isToday(day) && isSelected ? "text-[#be123c]" : "",
                  !isToday(day) && past ? "text-gray-400" : "",
                  !isToday(day) && !past && !isSelected ? "text-gray-800" : "",
                )}>
                  {day}
                </span>

                {/* Slot dots - morning (left) / evening (right) */}
                {hasData && (
                  <div className="flex gap-0.5">
                    <div className={cn(
                      "h-2 w-2 rounded-sm",
                      status.morning === "available" ? "bg-green-400" :
                      status.morning === "booked" ? "bg-red-400" :
                      status.morning === "blocked" ? "bg-gray-300" : "bg-transparent"
                    )} />
                    <div className={cn(
                      "h-2 w-2 rounded-sm",
                      status.evening === "available" ? "bg-green-400" :
                      status.evening === "booked" ? "bg-red-400" :
                      status.evening === "blocked" ? "bg-gray-300" : "bg-transparent"
                    )} />
                  </div>
                )}
              </div>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && hasData && !past && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 text-white rounded-xl p-2 shadow-xl pointer-events-none"
                  >
                    <p className="text-xs font-bold text-center mb-1.5">
                      {new Date(ds + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">{t("morning")}</span>
                        <span className={status.morning === "available" ? "text-green-400" : status.morning === "booked" ? "text-red-400" : "text-gray-400"}>
                          {status.morning === "available" ? t("available") : status.morning === "booked" ? t("booked") : t("blocked")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">{t("evening")}</span>
                        <span className={status.evening === "available" ? "text-green-400" : status.evening === "booked" ? "text-red-400" : "text-gray-400"}>
                          {status.evening === "available" ? t("available") : status.evening === "booked" ? t("booked") : t("blocked")}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 h-2 w-2 bg-gray-900 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Slot picker (if date selected) */}
      {selectedDate && !readOnly && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Select slot for {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["morning", "evening", "fullday"] as SlotType[]).map((slot) => {
              const dayData = slotMap.get(selectedDate);
              let isAvail = false;
              if (slot === "fullday") {
                isAvail = (dayData?.morning === "available" || !dayData?.morning || dayData?.morning === "none") &&
                          (dayData?.evening === "available" || !dayData?.evening || dayData?.evening === "none");
              } else {
                const slotStatus = (dayData && slot in dayData ? dayData[slot as keyof SlotAvailability] : undefined) || "none";
                isAvail = slotStatus === "available" || slotStatus === "none";
              }
              const isChosen = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!isAvail}
                  onClick={() => onSelectDate?.(selectedDate, slot)}
                  className={cn(
                    "py-3 rounded-2xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center",
                    isChosen ? "border-[#e11d48] bg-[#fff1f2] text-[#be123c]" :
                    isAvail ? "border-gray-200 hover:border-green-300 text-gray-700" :
                    "border-red-100 bg-red-50 text-red-400 cursor-not-allowed"
                  )}
                >
                  <span>
                    {slot === "morning" ? "🌅 " + t("morning") : slot === "evening" ? "🌆 " + t("evening") : "☀️ Full Day"}
                  </span>
                  <div className={cn("mt-1 text-[10px] font-normal", isAvail ? "text-green-600" : "text-red-400")}>
                    {isAvail ? t("available") : t("booked")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
