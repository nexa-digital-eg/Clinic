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
  Wallet,
  Package,
  Bell,
  ListOrdered,
  Boxes,
  MessageCircle,
  Brain,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard, section: "dashboard" },
  { href: "/patients", key: "nav.patients", icon: Users, section: "patients" },
  { href: "/appointments", key: "nav.appointments", icon: CalendarDays, section: "appointments" },
  { href: "/queue", key: "nav.queue", icon: ListOrdered, section: "queue" },
  { href: "/dental-chart", key: "nav.dentalChart", icon: Stethoscope, section: "dental-chart" },
  { href: "/billing", key: "nav.billing", icon: Receipt, section: "billing" },
  { href: "/treasury", key: "nav.treasury", icon: Wallet, section: "treasury" },
  { href: "/packages", key: "nav.packages", icon: Package, section: "packages" },
  { href: "/reminders", key: "nav.reminders", icon: Bell, section: "reminders" },
  { href: "/inventory", key: "nav.inventory", icon: Boxes, section: "inventory" },
  { href: "/whatsapp", key: "nav.whatsapp", icon: MessageCircle, section: "whatsapp" },
  { href: "/assistant", key: "nav.assistant", icon: Brain, section: "assistant" },
  { href: "/reports", key: "nav.reports", icon: BarChart3, section: "reports" },
  { href: "/settings", key: "nav.settings", icon: Settings, adminOnly: true },
];

export function Sidebar({
  role,
  permissions = [],
  locale = "ar",
  clinicName = "Smart Clinic",
  logoUrl,
}: {
  role?: string;
  permissions?: string[];
  locale?: Locale;
  clinicName?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const nav = NAV.filter((n) => {
    if (isAdmin) return true;
    if (n.adminOnly) return false;
    // dashboard متاح دائماً، والباقي حسب الصلاحيات
    if (n.section === "dashboard" || !n.section) return true;
    return permissions.includes(n.section);
  });

  return (
    <aside className="flex w-64 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="logo" className="h-9 w-9 rounded-lg object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
        )}
        <span className="truncate text-lg font-bold text-slate-800">{clinicName}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ href, key, icon: Icon }, i) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{ animationDelay: `${0.04 * i + 0.05}s` }}
              className={cn(
                "nav-item group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:translate-x-[-3px]",
                active
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform duration-200 group-hover:scale-110", active && "scale-110")} />
              {t(key, locale)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
