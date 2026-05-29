"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/patients", label: "المرضى", icon: Users },
  { href: "/appointments", label: "الحجوزات", icon: CalendarDays },
  { href: "/dental-chart", label: "مخطط الأسنان", icon: Stethoscope },
  { href: "/billing", label: "الفواتير والمدفوعات", icon: Receipt },
  { href: "/packages", label: "الباقات", icon: Package },
  { href: "/reminders", label: "التذكيرات", icon: Bell },
  { href: "/inventory", label: "المخزون", icon: Boxes },
  { href: "/whatsapp", label: "واتساب", icon: MessageCircle },
  { href: "/assistant", label: "المساعد الذكي", icon: Brain },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Stethoscope className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-slate-800">Smart Clinic</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
