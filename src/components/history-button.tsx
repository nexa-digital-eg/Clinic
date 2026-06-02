"use client";

import { useEffect, useRef, useState } from "react";
import { getActivity, type ActivityItem } from "@/app/(dashboard)/activity-actions";
import { useT } from "@/lib/i18n-client";
import {
  History,
  UserPlus,
  CalendarPlus,
  ListOrdered,
  TrendingDown,
  Wallet,
  Pill,
  Stethoscope,
  ShieldCheck,
  KeyRound,
  Activity,
} from "lucide-react";

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; grad: string }> = {
  PATIENT_CREATE: { icon: UserPlus, grad: "from-blue-500 to-indigo-600" },
  APPOINTMENT_CREATE: { icon: CalendarPlus, grad: "from-emerald-500 to-teal-600" },
  QUEUE_ADD: { icon: ListOrdered, grad: "from-violet-500 to-purple-600" },
  EXPENSE_ADD: { icon: TrendingDown, grad: "from-rose-500 to-red-600" },
  PAYMENT_ADD: { icon: Wallet, grad: "from-green-500 to-emerald-600" },
  PRESCRIPTION_CREATE: { icon: Pill, grad: "from-cyan-500 to-sky-600" },
  TOOTH_ADD: { icon: Stethoscope, grad: "from-pink-500 to-rose-600" },
  STAFF_CREATE: { icon: ShieldCheck, grad: "from-amber-500 to-orange-600" },
  PASSWORD_CHANGE: { icon: KeyRound, grad: "from-slate-500 to-slate-700" },
};

export function HistoryButton() {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getActivity());
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  // إغلاق عند الضغط خارج اللوحة
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const rel = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return tr("hist.now");
    if (min < 60) return tr("hist.minAgo").replace("{n}", String(min));
    const hr = Math.floor(min / 60);
    if (hr < 24) return tr("hist.hrAgo").replace("{n}", String(hr));
    return tr("hist.dayAgo").replace("{n}", String(Math.floor(hr / 24)));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        title={tr("hist.title")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:scale-95"
      >
        <History className="h-5 w-5" />
      </button>

      {open && (
        <div className="animate-pop fixed inset-x-3 top-16 z-50 origin-top overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <p className="font-semibold">{tr("hist.title")}</p>
            </div>
            <p className="text-xs text-white/70">{tr("hist.subtitle")}</p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto sm:max-h-96">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">{tr("hist.loading")}</p>
            ) : !items || items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{tr("hist.empty")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((it) => {
                  const meta = TYPE_META[it.type] ?? { icon: Activity, grad: "from-slate-400 to-slate-600" };
                  const Icon = meta.icon;
                  return (
                    <li key={it.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${meta.grad} text-white shadow-sm`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-800">{it.userName}</span>{" "}
                          {tr(`act.${it.type}`) !== `act.${it.type}` ? tr(`act.${it.type}`) : it.type}
                        </p>
                        {it.detail && <p className="truncate text-xs text-slate-400">{it.detail}</p>}
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">{rel(it.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
