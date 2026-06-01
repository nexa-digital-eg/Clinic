import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Users,
  CalendarDays,
  Receipt,
  Boxes,
  TrendingUp,
  TrendingDown,
  Wallet,
  ListOrdered,
  ArrowLeft,
  UserPlus,
  CalendarPlus,
  Stethoscope,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    patientCount,
    todayAppointments,
    openInvoices,
    lowStock,
    upcoming,
    todayList,
    waitingCount,
    todayPayAgg,
    monthPayAgg,
    monthExpAgg,
    recentPayments,
    session,
    locale,
  ] = await Promise.all([
    db.patient.count(),
    db.appointment.count({ where: { startsAt: { gte: startOfDay, lte: endOfDay } } }),
    db.invoice.aggregate({
      _sum: { total: true, paidAmount: true },
      where: { status: { in: ["OPEN", "PARTIAL"] } },
    }),
    db.product.count({ where: { quantity: { lte: db.product.fields.minQuantity } } }).catch(() => 0),
    db.appointment.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { patient: true, doctor: { include: { user: true } } },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { patient: true, doctor: { include: { user: true } } },
    }),
    db.queueEntry.count({ where: { status: { in: ["WAITING", "IN_PROGRESS"] } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfMonth } } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { spentAt: { gte: startOfMonth } } }),
    db.payment.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { amount: true, createdAt: true } }),
    getSession(),
    getLocale(),
  ]);

  const due = (openInvoices._sum.total ?? 0) - (openInvoices._sum.paidAmount ?? 0);
  const todayIncome = todayPayAgg._sum.amount ?? 0;
  const monthIncome = monthPayAgg._sum.amount ?? 0;
  const monthExpense = monthExpAgg._sum.amount ?? 0;
  const monthNet = monthIncome - monthExpense;

  // سلسلة الإيراد لآخر 6 أشهر للرسم البياني
  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      total: 0,
    });
  }
  for (const p of recentPayments) {
    const idx = (p.createdAt.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
      (p.createdAt.getMonth() - sixMonthsAgo.getMonth());
    if (idx >= 0 && idx < 6) months[idx].total += p.amount;
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  const hour = now.getHours();
  const greetKey = hour < 12 ? "dashboard.goodMorning" : hour < 17 ? "dashboard.goodAfternoon" : "dashboard.goodEvening";
  const firstName = session?.name?.split(" ")[0] ?? "";

  const stats = [
    { label: t("dashboard.totalPatients", locale), value: patientCount, icon: Users, href: "/patients", grad: "from-blue-500 to-indigo-600" },
    { label: t("dashboard.todayAppointments", locale), value: todayAppointments, icon: CalendarDays, href: "/appointments", grad: "from-emerald-500 to-teal-600" },
    { label: t("dashboard.waiting", locale), value: waitingCount, icon: ListOrdered, href: "/queue", grad: "from-violet-500 to-purple-600" },
    { label: t("dashboard.outstanding", locale), value: formatCurrency(due, locale), icon: Receipt, href: "/billing", grad: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      {/* الهيدر الترحيبي المتدرّج */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-7 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm text-white/70">
            {now.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            {t(greetKey, locale)}{firstName ? `، ${firstName}` : ""} 👋
          </h1>
          <p className="mt-1 text-white/80">{t("dashboard.welcome", locale)}</p>

          <div className="mt-5 flex flex-wrap gap-5">
            <HeroStat label={t("dashboard.todayIncome", locale)} value={formatCurrency(todayIncome, locale)} />
            <div className="w-px bg-white/20" />
            <HeroStat label={t("dashboard.monthNet", locale)} value={formatCurrency(monthNet, locale)} />
            <div className="w-px bg-white/20" />
            <HeroStat label={t("dashboard.todayAppointments", locale)} value={String(todayAppointments)} />
          </div>
        </div>
      </div>

      {/* بطاقات KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="relative overflow-hidden p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.grad} opacity-10`} />
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} text-white shadow-sm`}>
                <s.icon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-slate-500">{s.label}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-800">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* النظرة المالية + الرسم البياني */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">{t("dashboard.financial", locale)}</h2>
            <Link href="/reports" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              {t("dashboard.viewAll", locale)} <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MiniFin icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" label={t("dashboard.monthIncome", locale)} value={formatCurrency(monthIncome, locale)} />
            <MiniFin icon={TrendingDown} color="text-red-600" bg="bg-red-50" label={t("dashboard.monthExpense", locale)} value={formatCurrency(monthExpense, locale)} />
            <MiniFin icon={Wallet} color="text-brand-600" bg="bg-brand-50" label={t("dashboard.monthNet", locale)} value={formatCurrency(monthNet, locale)} />
          </div>

          <p className="mb-2 text-xs font-medium text-slate-400">{t("dashboard.revenue6m", locale)}</p>
          <div className="flex h-40 items-end justify-between gap-2">
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all hover:from-brand-700 hover:to-brand-500"
                    style={{ height: `${Math.max(4, (m.total / maxMonth) * 100)}%` }}
                    title={formatCurrency(m.total, locale)}
                  />
                </div>
                <span className="text-[11px] text-slate-400" dir="ltr">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* قائمة اليوم */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">{t("dashboard.todaysList", locale)}</h2>
            <Link href="/appointments" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              {t("dashboard.viewAll", locale)}
            </Link>
          </div>
          {todayList.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarDays className="mb-2 h-9 w-9 text-slate-300" />
              <p className="text-sm text-slate-400">{t("dashboard.noToday", locale)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayList.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700" dir="ltr">
                    {a.startsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{a.patient.firstName} {a.patient.lastName}</p>
                    <p className="truncate text-xs text-slate-400">{a.doctor.user.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* الحجوزات القادمة */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{t("dashboard.upcoming", locale)}</h2>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t("dashboard.noUpcoming", locale)}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.patient.firstName} {a.patient.lastName}</p>
                      <p className="text-xs text-slate-400">{a.doctor.user.name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{formatDateTime(a.startsAt, locale)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* إجراءات سريعة */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{t("dashboard.quickActions", locale)}</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href="/patients/new" icon={UserPlus} label={t("patients.new", locale)} grad="from-blue-500 to-indigo-600" />
            <QuickAction href="/appointments/new" icon={CalendarPlus} label={t("nav.appointments", locale)} grad="from-emerald-500 to-teal-600" />
            <QuickAction href="/queue" icon={ListOrdered} label={t("nav.queue", locale)} grad="from-violet-500 to-purple-600" />
            <QuickAction href="/dental-chart" icon={Stethoscope} label={t("nav.dentalChart", locale)} grad="from-rose-500 to-pink-600" />
            <QuickAction href="/billing" icon={Receipt} label={t("nav.billing", locale)} grad="from-amber-500 to-orange-600" />
            <QuickAction href="/treasury" icon={Wallet} label={t("nav.treasury", locale)} grad="from-cyan-500 to-sky-600" />
          </div>
          {(typeof lowStock === "number" ? lowStock : 0) > 0 && (
            <Link href="/inventory" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">
              <Boxes className="h-4 w-4" />
              {t("dashboard.lowStock", locale)}: {lowStock}
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/70">{label}</p>
      <p className="mt-0.5 text-xl font-bold" dir="ltr">{value}</p>
    </div>
  );
}

function MiniFin({
  icon: Icon,
  color,
  bg,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-800" dir="ltr">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  grad,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  grad: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-3 text-center transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </Link>
  );
}
