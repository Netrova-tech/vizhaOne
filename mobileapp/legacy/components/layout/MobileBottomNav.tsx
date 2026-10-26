"use client";

import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Home, PlusCircle, LayoutGrid, BarChart2, LayoutDashboard, LogOut, MessageSquare, PlaySquare, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/",         label: "Home",     icon: Home        },
  { href: "/services", label: "Explore", icon: LayoutGrid  },
  { href: "/reels", label: "Reels", icon: PlaySquare  },
  { href: "/profile", label: "Profile", icon: UserRound  },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const isAdminPath = pathname.startsWith("/admin");
  const items = isAdminPath && isAdmin
    ? [
        { href: "/admin", label: "Admin", icon: LayoutDashboard },
        { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
      ]
    : user?.role === "service_provider"
      ? [
          { href: "/provider-dashboard", label: "Workspace", icon: LayoutDashboard },
          { href: "/vendor-onboarding", label: "Add Service", icon: PlusCircle },
          { href: "/reels", label: "Reels", icon: PlaySquare },
          { href: "/profile", label: "Profile", icon: UserRound },
        ]
      : navItems;

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <nav className="mobile-app-nav fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gradient-to-r from-[#3d0825] via-[#5b0b35] to-[#3d0825] text-white shadow-[0_-8px_30px_rgba(61,8,37,.30)] md:hidden pb-safe">
      <div className="mobile-app-nav-inner grid items-center px-1.5 py-1.5" style={{ gridTemplateColumns: `repeat(${items.length + (isAdminPath && isAdmin ? 1 : 0)}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} to={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-0.5 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-white/10 text-[#ff3b78]"
                  : "text-white/70 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-extrabold">{item.label}</span>
              {isActive && <div className="h-1 w-5 rounded-full bg-[#ff2f70] shadow-[0_0_10px_rgba(255,47,112,.8)]" />}
            </Link>
          );
        })}
        {isAdminPath && isAdmin && (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-white/70 transition-all duration-200 hover:text-white"
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
