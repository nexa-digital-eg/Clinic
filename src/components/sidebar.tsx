"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t, type Locale } from "@/lib/i18n";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  Package,
  Bell,
  Boxes,
  MessageCircle,
  Brain,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/patients", key: "nav.patients", icon: Users },
  { href: "/appointments", key: "nav.appointments", icon: CalendarDays },
  { href: "/dental-chart", key: "nav.dentalChart", icon: Stethoscope },
  { href: "/billing", key: "nav.billing", icon: Receipt },
  { href: "/packages", key: "nav.packages", icon: Package },
  { href: "/reminders", key: "nav.reminders", icon: Bell },
  { href: "/inventory", key: "nav.inventory", icon: Boxes },
  { href: "/whatsapp", key: "nav.whatsapp", icon: MessageCircle },
  { href: "/assistant", key: "nav.assistant", icon: Brain },
  { href: "/reports", key: "nav.reports", icon: BarChart3 },
  { href: "/settings", key: "nav.settings", icon: Settings, adminOnly: true },
];

export function Sidebar({ role, locale = "ar" }: { role?: string; locale?: Locale }) {
  const pathname = usePathname();
  const nav = NAV.filter((n) => !n.adminOnly || role === "ADMIN");

  return (
    <aside className="flex w-64 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Stethoscope className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-slate-800">Smart Clinic</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ href, key, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon className="h-5 w-5" />
              {t(key, locale)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
