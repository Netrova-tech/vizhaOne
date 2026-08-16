"use client";

import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const hiddenRoutes = [
  /^\/$/,
  /^\/sign-in$/,
  /^\/sign-up$/,
  /^\/auth\//,
  /^\/admin(?:\/|$)/,
  /^\/invite\//,
  /^\/halls\/[^/]+$/,
  /^\/services\/[^/]+$/,
  /^\/packages\/[^/]+$/,
  /^\/blog\/[^/]+$/,
  /^\/calculator$/,
  /^\/bookings$/,
  /^\/saved$/,
  /^\/profile$/,
  /^\/planner(?:\/|$)/,
  /^\/quote\/[^/]+$/,
  /^\/cart$/,
  /^\/vendor\/[^/]+$/,
];

export function RouteBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (hiddenRoutes.some((pattern) => pattern.test(pathname))) return null;

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  }

  return <button
    type="button"
    onClick={goBack}
    aria-label="Go back"
    className="fixed left-3 top-[calc(env(safe-area-inset-top,0px)+86px)] z-[38] flex min-h-11 items-center gap-2 rounded-full border border-rose-100 bg-white/95 px-4 text-xs font-black text-[#7a2143] shadow-[0_10px_30px_rgba(80,17,43,.16)] backdrop-blur-xl active:scale-95"
  >
    <ArrowLeft className="h-4 w-4" />
    Back
  </button>;
}
