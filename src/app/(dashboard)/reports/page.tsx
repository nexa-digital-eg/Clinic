import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, CalendarDays, Boxes, Wallet, Stethoscope } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "نقدي",
  CARD: "بطاقة",
  TRANSFER: "تحويل",
  OTHER: "أخرى",
};
const APPT_LABELS: Record<string, string> = {
  PENDING: "منتظر",
  CONFIRMED: "مؤكد",
  COMPLETED: "تم",
  CANCELLED: "ملغي",
  NO_SHOW: "لم يحضر",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const defFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = sp.from ? new Date(sp.from) : defFrom;
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : now;
  const range = { gte: from, lte: to };

  const [
    paymentsAgg,
    paymentsByMethod,
    invoicesAgg,
    apptByStatus,
    apptByDoctor,
    doctors,
    newPatients,
    totalPatients,
    products,
    invoiceItems,
  ] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true }, _count: true, where: { createdAt: range } }),
    db.payment.groupBy({ by: ["method"], _sum: { amount: true }, where: { createdAt: range } }),
    db.invoice.aggregate({ _sum: { total: true, paidAmount: true }, where: { createdAt: range } }),
    db.appointment.groupBy({ by: ["status"], _count: true, where: { startsAt: range } }),
    db.appointment.groupBy({ by: ["doctorId"], _count: true, where: { startsAt: range } }),
    db.doctor.findMany({ include: { user: true } }),
    db.patient.count({ where: { createdAt: range } }),
    db.patient.count(),
    db.product.findMany(),
    db.invoiceItem.findMany({
      where: { invoice: { createdAt: range }, procedureId: { not: null } },
      include: { procedure: true },
    }),
  ]);

  const totalPaid = paymentsAgg._sum.amount ?? 0;
  const billed = invoicesAgg._sum.total ?? 0;
  const collected = invoicesAgg._sum.paidAmount ?? 0;
  const due = billed - collected;

  const doctorName = (id: string) =>
    doctors.find((d) => d.id === id)?.user.name ?? "—";

  // أعلى الإجراءات
  const procMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const it of invoiceItems) {
    const key = it.procedureId!;
    const cur = procMap.get(key) ?? { name: it.procedure?.name ?? "—", count: 0, revenue: 0 };
    cur.count += it.quantity;
    cur.revenue += it.total;
    procMap.set(key, cur);
  }
  const topProcedures = [...procMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const lowStock = products.filter((p) => p.quantity <= p.minQuantity);
  const stockValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);

  const fromStr = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`;
  const toStr = `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">التقارير</h1>
        <p className="text-sm text-slate-500">أداء العيادة خلال الفترة المحددة</p>
      </div>

      {/* فلتر الفترة */}
      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs text-slate-500">من</label>
            <input type="date" name="from" defaultValue={fromStr} dir="ltr" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">إلى</label>
            <input type="date" name="to" defaultValue={toStr} dir="ltr" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            عرض
          </button>
        </form>
      </Card>

      {/* بطاقات مالية */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} color="bg-green-50 text-green-600" label="المحصّل (مدفوعات)" value={formatCurrency(totalPaid)} sub={`${paymentsAgg._count} دفعة`} />
        <StatCard icon={TrendingUp} color="bg-brand-50 text-brand-600" label="إجمالي الفواتير" value={formatCurrency(billed)} />
        <StatCard icon={Wallet} color="bg-yellow-50 text-yellow-600" label="المتبقي" value={formatCurrency(due > 0 ? due : 0)} />
        <StatCard icon={Users} color="bg-purple-50 text-purple-600" label="مرضى جدد" value={`${newPatients}`} sub={`الإجمالي ${totalPatients}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* المدفوعات حسب الطريقة */}
        <Card>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">المدفوعات حسب الطريقة</h2>
          </div>
          <div className="p-5">
            {paymentsByMethod.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">لا توجد مدفوعات في الفترة</p>
            ) : (
              <div className="space-y-2">
                {paymentsByMethod.map((m) => {
                  const amt = m._sum.amount ?? 0;
                  const pct = totalPaid ? Math.round((amt / totalPaid) * 100) : 0;
                  return (
                    <div key={m.method}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{METHOD_LABELS[m.method]}</span>
                        <span className="font-medium">{formatCurrency(amt)} ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* الحجوزات حسب الحالة */}
        <Card>
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-800">الحجوزات حسب الحالة</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {apptByStatus.length === 0 ? (
              <p className="col-span-full py-4 text-center text-sm text-slate-400">لا توجد حجوزات</p>
            ) : (
              apptByStatus.map((s) => (
                <div key={s.status} className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-800">{s._count}</p>
                  <p className="text-xs text-slate-500">{APPT_LABELS[s.status]}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* أداء الأطباء */}
        <Card>
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
            <Stethoscope className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-800">أداء الأطباء</h2>
          </div>
          <div className="p-5">
            {apptByDoctor.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">لا توجد بيانات</p>
            ) : (
              <ul className="space-y-2">
                {apptByDoctor.map((d) => (
                  <li key={d.doctorId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">د. {doctorName(d.doctorId)}</span>
                    <Badge color="blue">{d._count} حجز</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* أعلى الإجراءات */}
        <Card>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">أعلى الإجراءات إيراداً</h2>
          </div>
          <div className="p-5">
            {topProcedures.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">لا توجد إجراءات في الفترة</p>
            ) : (
              <ul className="space-y-2">
                {topProcedures.map((p) => (
                  <li key={p.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{p.name} <span className="text-xs text-slate-400">×{p.count}</span></span>
                    <span className="font-medium text-brand-700">{formatCurrency(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* المخزون */}
      <Card>
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
          <Boxes className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-800">المخزون</h2>
          <span className="mr-auto text-sm text-slate-500">قيمة المخزون: {formatCurrency(stockValue)}</span>
        </div>
        <div className="p-5">
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد منتجات تحت حد التنبيه ✅</p>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-red-600">منتجات تحت الحد ({lowStock.length}):</p>
              <ul className="flex flex-wrap gap-2">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Badge color="red">{p.name} — {p.quantity} {p.unit}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
