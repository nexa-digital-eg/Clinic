import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Users, CalendarDays, Receipt, Boxes } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [patientCount, todayAppointments, openInvoices, lowStock, upcoming] =
    await Promise.all([
      db.patient.count(),
      db.appointment.count({
        where: { startsAt: { gte: startOfDay, lte: endOfDay } },
      }),
      db.invoice.aggregate({
        _sum: { total: true, paidAmount: true },
        where: { status: { in: ["OPEN", "PARTIAL"] } },
      }),
      db.product.count({ where: { quantity: { lte: db.product.fields.minQuantity } } }).catch(() => 0),
      db.appointment.findMany({
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 5,
        include: { patient: true, doctor: { include: { user: true } } },
      }),
    ]);

  const due =
    (openInvoices._sum.total ?? 0) - (openInvoices._sum.paidAmount ?? 0);

  const stats = [
    {
      label: "إجمالي المرضى",
      value: patientCount,
      icon: Users,
      href: "/patients",
      color: "bg-brand-50 text-brand-600",
    },
    {
      label: "حجوزات اليوم",
      value: todayAppointments,
      icon: CalendarDays,
      href: "/appointments",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "مستحقات غير محصّلة",
      value: formatCurrency(due),
      icon: Receipt,
      href: "/billing",
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "منتجات تحت الحد",
      value: typeof lowStock === "number" ? lowStock : 0,
      icon: Boxes,
      href: "/inventory",
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم</h1>
        <p className="text-sm text-slate-500">نظرة عامة على نشاط العيادة</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {s.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}
                >
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          الحجوزات القادمة
        </h2>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            لا توجد حجوزات قادمة
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {a.patient.firstName} {a.patient.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    د. {a.doctor.user.name}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {formatDateTime(a.startsAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
