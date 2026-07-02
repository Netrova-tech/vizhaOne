"use client";

import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Building2, BarChart2, LayoutDashboard, LogOut, MessageSquare, Calculator, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/",         label: "Home",     icon: Home        },
  { href: "/halls",    label: "Hall",     icon: Building2   },
  { href: "/services", label: "Services", icon: LayoutGrid  },
  { href: "/calculator", label: "Plan",     icon: Calculator  },
  { href: "/partner-plans", label: "Join", icon: Sparkles  },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();
  const isAdminPath = pathname.startsWith("/admin");
  const items = isAdminPath && isAdmin
    ? [
        { href: "/admin", label: "Admin", icon: LayoutDashboard },
        { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
      ]
    : navItems;

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-rose-100 shadow-[0_-4px_24px_rgba(124,58,237,0.10)] pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} to={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-rose-700 bg-rose-50"
                  : "text-gray-400 hover:text-rose-600"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-xs font-semibold">{item.label}</span>
              {isActive && <div className="h-1 w-4 rounded-full bg-gradient-to-r from-rose-500 to-rose-600" />}
            </Link>
          );
        })}
        {isAdminPath && isAdmin && (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 hover:text-rose-600 transition-all duration-200"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs font-semibold">Sign out</span>
          </button>
        )}
      </div>
    </nav>
  );
}
