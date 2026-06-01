import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, CalendarDays, Boxes, Wallet, Stethoscope, FileSpreadsheet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const now = new Date();
  const defFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = sp.from ? new Date(sp.from) : defFrom;
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : now;
  const range = { gte: from, lte: to };

  // الفترة السابقة المماثلة (لنفس المدة قبل الفترة الحالية) — للمقارنة
  const durationMs = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - durationMs - 1);
  const prevTo = new Date(from.getTime() - 1);
  const prevRange = { gte: prevFrom, lte: prevTo };

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
    expensesAgg,
    expensesByCategory,
    prevPaymentsAgg,
    prevExpensesAgg,
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
    db.expense.aggregate({ _sum: { amount: true }, _count: true, where: { spentAt: range } }),
    db.expense.groupBy({ by: ["category"], _sum: { amount: true }, where: { spentAt: range } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { createdAt: prevRange } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { spentAt: prevRange } }),
  ]);

  const totalPaid = paymentsAgg._sum.amount ?? 0;
  const billed = invoicesAgg._sum.total ?? 0;
  const collected = invoicesAgg._sum.paidAmount ?? 0;
  const due = billed - collected;

  // الخزنة: المصروفات وصافي الربح
  const totalExpense = expensesAgg._sum.amount ?? 0;
  const netProfit = totalPaid - totalExpense;
  const expCatRows = expensesByCategory
    .map((c) => ({ category: c.category, amount: c._sum.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);

  // مقارنة بالفترة السابقة
  const prevIncome = prevPaymentsAgg._sum.amount ?? 0;
  const prevExpense = prevExpensesAgg._sum.amount ?? 0;
  const prevNet = prevIncome - prevExpense;
  const pctChange = (cur: number, prev: number): number | null =>
    prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / Math.abs(prev)) * 100);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("reports.title", locale)}</h1>
          <p className="text-sm text-slate-500">{t("reports.subtitle", locale)}</p>
        </div>
        <a
          href={`/api/reports/export?from=${fromStr}&to=${toStr}`}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {t("rep.exportExcel", locale)}
        </a>
      </div>

      {/* فلتر الفترة */}
      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs text-slate-500">{t("rep.from", locale)}</label>
            <input type="date" name="from" defaultValue={fromStr} dir="ltr" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">{t("rep.to", locale)}</label>
            <input type="date" name="to" defaultValue={toStr} dir="ltr" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            {t("rep.show", locale)}
          </button>
        </form>
      </Card>

      {/* بطاقات مالية */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} color="bg-green-50 text-green-600" label={t("rep.collected", locale)} value={formatCurrency(totalPaid, locale)} sub={`${paymentsAgg._count} ${t("rep.payments", locale)}`} />
        <StatCard icon={TrendingUp} color="bg-brand-50 text-brand-600" label={t("rep.billed", locale)} value={formatCurrency(billed, locale)} />
        <StatCard icon={Wallet} color="bg-yellow-50 text-yellow-600" label={t("rep.remaining", locale)} value={formatCurrency(due > 0 ? due : 0, locale)} />
        <StatCard icon={Users} color="bg-purple-50 text-purple-600" label={t("rep.newPatients", locale)} value={`${newPatients}`} sub={`${t("rep.totalLabel", locale)} ${totalPatients}`} />
      </div>

      {/* الخزنة: الإيراد / المصروف / صافي الربح + المقارنة */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard icon={TrendingUp} color="bg-green-50 text-green-600" label={t("treasury.income", locale)} value={formatCurrency(totalPaid, locale)} />
        <StatCard icon={TrendingDown} color="bg-red-50 text-red-600" label={t("treasury.expenses", locale)} value={formatCurrency(totalExpense, locale)} sub={`${expensesAgg._count} ${t("rep.expensesCount", locale)}`} />
        <StatCard icon={Wallet} color="bg-brand-50 text-brand-600" label={t("rep.netProfit", locale)} value={formatCurrency(netProfit, locale)} />
      </div>

      {/* المقارنة بالفترة السابقة */}
      <Card>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-800">{t("rep.comparison", locale)}</h2>
          <p className="text-xs text-slate-400">{t("rep.vsPrev", locale)}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <CompareCell label={t("treasury.income", locale)} cur={totalPaid} prev={prevIncome} pct={pctChange(totalPaid, prevIncome)} positiveIsGood locale={locale} />
          <CompareCell label={t("treasury.expenses", locale)} cur={totalExpense} prev={prevExpense} pct={pctChange(totalExpense, prevExpense)} positiveIsGood={false} locale={locale} />
          <CompareCell label={t("rep.netProfit", locale)} cur={netProfit} prev={prevNet} pct={pctChange(netProfit, prevNet)} positiveIsGood locale={locale} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* المدفوعات حسب الطريقة */}
        <Card>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">{t("rep.paymentsByMethod", locale)}</h2>
          </div>
          <div className="p-5">
            {paymentsByMethod.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">{t("rep.noPaymentsPeriod", locale)}</p>
            ) : (
              <div className="space-y-2">
                {paymentsByMethod.map((m) => {
                  const amt = m._sum.amount ?? 0;
                  const pct = totalPaid ? Math.round((amt / totalPaid) * 100) : 0;
                  return (
                    <div key={m.method}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{t(`method.${m.method}`, locale)}</span>
                        <span className="font-medium">{formatCurrency(amt, locale)} ({pct}%)</span>
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
            <h2 className="font-semibold text-slate-800">{t("rep.apptByStatus", locale)}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {apptByStatus.length === 0 ? (
              <p className="col-span-full py-4 text-center text-sm text-slate-400">{t("rep.noAppts", locale)}</p>
            ) : (
              apptByStatus.map((s) => (
                <div key={s.status} className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-800">{s._count}</p>
                  <p className="text-xs text-slate-500">{t(`apptStatus.${s.status}`, locale)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* أداء الأطباء */}
        <Card>
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
            <Stethoscope className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-800">{t("rep.doctorPerf", locale)}</h2>
          </div>
          <div className="p-5">
            {apptByDoctor.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">{t("rep.noData", locale)}</p>
            ) : (
              <ul className="space-y-2">
                {apptByDoctor.map((d) => (
                  <li key={d.doctorId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{doctorName(d.doctorId)}</span>
                    <Badge color="blue">{d._count} {t("rep.apptCount", locale)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* أعلى الإجراءات */}
        <Card>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">{t("rep.topProcedures", locale)}</h2>
          </div>
          <div className="p-5">
            {topProcedures.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">{t("rep.noProceduresPeriod", locale)}</p>
            ) : (
              <ul className="space-y-2">
                {topProcedures.map((p) => (
                  <li key={p.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{p.name} <span className="text-xs text-slate-400">×{p.count}</span></span>
                    <span className="font-medium text-brand-700">{formatCurrency(p.revenue, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* جرد المصروفات بالفئات */}
      <Card>
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
          <Wallet className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-800">{t("treasury.byCategory", locale)}</h2>
          <span className="mr-auto text-sm text-slate-500">{t("treasury.expenses", locale)}: {formatCurrency(totalExpense, locale)}</span>
        </div>
        <div className="p-5">
          {expCatRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">{t("treasury.noExpenses", locale)}</p>
          ) : (
            <div className="space-y-2">
              {expCatRows.map((c) => {
                const pct = totalExpense ? Math.round((c.amount / totalExpense) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{c.category}</span>
                      <span className="font-medium">{formatCurrency(c.amount, locale)} ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-red-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* المخزون */}
      <Card>
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
          <Boxes className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-800">{t("rep.inventory", locale)}</h2>
          <span className="mr-auto text-sm text-slate-500">{t("rep.stockValue", locale)}: {formatCurrency(stockValue, locale)}</span>
        </div>
        <div className="p-5">
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">{t("rep.lowStockOk", locale)}</p>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-red-600">{t("rep.lowStockList", locale)} ({lowStock.length}):</p>
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

function CompareCell({
  label,
  cur,
  prev,
  pct,
  positiveIsGood,
  locale,
}: {
  label: string;
  cur: number;
  prev: number;
  pct: number | null;
  positiveIsGood: boolean;
  locale: import("@/lib/i18n").Locale;
}) {
  const up = pct !== null && pct > 0;
  const down = pct !== null && pct < 0;
  // ارتفاع الإيراد/الربح جيد (أخضر)، وارتفاع المصروف سيئ (أحمر)
  const good = pct === null || pct === 0 ? false : positiveIsGood ? up : down;
  const bad = pct === null || pct === 0 ? false : positiveIsGood ? down : up;
  const color = good ? "text-green-600" : bad ? "text-red-600" : "text-slate-400";

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-800" dir="ltr">{formatCurrency(cur, locale)}</p>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {up && <ArrowUpRight className={`h-3.5 w-3.5 ${color}`} />}
        {down && <ArrowDownRight className={`h-3.5 w-3.5 ${color}`} />}
        <span className={color} dir="ltr">{pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct}%`}</span>
        <span className="text-slate-400" dir="ltr">({formatCurrency(prev, locale)})</span>
      </div>
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
