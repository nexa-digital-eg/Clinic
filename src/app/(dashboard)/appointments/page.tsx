import { db } from "@/lib/db";
import { Card, LinkButton, Badge } from "@/components/ui";
import { Plus, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AppointmentActions } from "./appointment-actions";

const STATUS_META: Record<
  string,
  { label: string; color: "slate" | "green" | "yellow" | "red" | "blue" }
> = {
  PENDING: { label: "منتظر", color: "yellow" },
  CONFIRMED: { label: "مؤكد", color: "blue" },
  COMPLETED: { label: "تم", color: "green" },
  CANCELLED: { label: "ملغي", color: "red" },
  NO_SHOW: { label: "لم يحضر", color: "slate" },
};

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; doctorId?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const [yStr, mStr] = (sp.month ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}`).split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1; // 0-based

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const where: Prisma.AppointmentWhereInput = {
    startsAt: { gte: monthStart, lt: monthEnd },
    ...(sp.doctorId ? { doctorId: sp.doctorId } : {}),
    ...(sp.branchId ? { branchId: sp.branchId } : {}),
  };

  const [appointments, doctors, branches] = await Promise.all([
    db.appointment.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { patient: true, doctor: { include: { user: true } } },
    }),
    db.doctor.findMany({ include: { user: true } }),
    db.branch.findMany(),
  ]);

  // تجميع الحجوزات حسب اليوم
  const byDay = new Map<number, typeof appointments>();
  for (const a of appointments) {
    const day = new Date(a.startsAt).getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(a);
  }

  // بناء شبكة التقويم
  const firstWeekday = monthStart.getDay(); // 0 = الأحد
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const mkMonthLink = (dt: Date) => {
    const q = new URLSearchParams();
    q.set("month", `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`);
    if (sp.doctorId) q.set("doctorId", sp.doctorId);
    if (sp.branchId) q.set("branchId", sp.branchId);
    return `/appointments?${q.toString()}`;
  };

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الحجوزات والمواعيد</h1>
          <p className="text-sm text-slate-500">تقويم شهري لكل طبيب وفرع</p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/booking" variant="secondary" target="_blank">
            رابط الحجز الإلكتروني
          </LinkButton>
          <LinkButton href="/appointments/new">
            <Plus className="h-4 w-4" />
            حجز جديد
          </LinkButton>
        </div>
      </div>

      {/* الفلاتر والتنقل */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Link href={mkMonthLink(prevMonth)} className="rounded-lg p-2 hover:bg-slate-100">
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </Link>
          <span className="min-w-32 text-center font-semibold text-slate-800">
            {MONTHS[month]} {year}
          </span>
          <Link href={mkMonthLink(nextMonth)} className="rounded-lg p-2 hover:bg-slate-100">
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </Link>
        </div>

        <form className="flex flex-wrap items-center gap-2" method="get">
          <input type="hidden" name="month" value={`${year}-${pad(month + 1)}`} />
          <select
            name="doctorId"
            defaultValue={sp.doctorId ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">كل الأطباء</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>د. {d.user.name}</option>
            ))}
          </select>
          <select
            name="branchId"
            defaultValue={sp.branchId ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">كل الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200">
            تصفية
          </button>
        </form>
      </Card>

      {/* شبكة التقويم */}
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayAppts = day ? byDay.get(day) ?? [] : [];
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={i}
                className={`min-h-28 border-b border-l border-slate-100 p-1.5 ${day ? "" : "bg-slate-50/50"}`}
              >
                {day && (
                  <>
                    <div className={`mb-1 text-xs font-medium ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white" : "text-slate-400"}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayAppts.slice(0, 3).map((a) => (
                        <Link
                          key={a.id}
                          href={`/patients/${a.patientId}?tab=appointments`}
                          className="block truncate rounded bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-700 hover:bg-brand-100"
                          title={`${a.patient.firstName} ${a.patient.lastName} - د.${a.doctor.user.name}`}
                        >
                          {new Date(a.startsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          {" "}
                          {a.patient.firstName}
                        </Link>
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="block px-1.5 text-[10px] text-slate-400">
                          +{dayAppts.length - 3} أخرى
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* قائمة حجوزات الشهر */}
      <Card>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-800">
            حجوزات {MONTHS[month]} ({appointments.length})
          </h2>
        </div>
        {appointments.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">لا توجد حجوزات هذا الشهر</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الموعد</th>
                  <th className="px-4 py-3 font-medium">المريض</th>
                  <th className="px-4 py-3 font-medium">الطبيب</th>
                  <th className="px-4 py-3 font-medium">السبب</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => {
                  const meta = STATUS_META[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {new Date(a.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {a.isOnline && <Badge color="blue" className="mr-2">إلكتروني</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/patients/${a.patientId}`} className="font-medium text-slate-800 hover:text-brand-600">
                          {a.patient.firstName} {a.patient.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">د. {a.doctor.user.name}</td>
                      <td className="px-4 py-3 text-slate-500">{a.reason ?? "—"}</td>
                      <td className="px-4 py-3"><Badge color={meta.color}>{meta.label}</Badge></td>
                      <td className="px-4 py-3"><AppointmentActions id={a.id} status={a.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
