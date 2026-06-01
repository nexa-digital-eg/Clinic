import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { ExpenseForm, ExpenseRow, MonthPicker } from "./client";

export const dynamic = "force-dynamic";

export default async function TreasuryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const locale = await getLocale();
  const { month } = await searchParams;

  // نطاق الشهر المحدد (افتراضي: الشهر الحالي)
  const now = new Date();
  const monthStr = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = monthStr.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const [payments, expenses] = await Promise.all([
    db.payment.findMany({ where: { createdAt: { gte: start, lt: end } } }),
    db.expense.findMany({
      where: { spentAt: { gte: start, lt: end } },
      orderBy: { spentAt: "desc" },
    }),
  ]);

  const income = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const net = income - totalExpense;

  // جرد الفئات — تجميع المصروفات حسب الفئة
  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  // جرد الإيراد حسب طريقة الدفع
  const byMethod = new Map<string, number>();
  for (const p of payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount);
  const methodRows = [...byMethod.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("treasury.title", locale)}</h1>
          <p className="text-sm text-slate-500">{t("treasury.subtitle", locale)}</p>
        </div>
        <MonthPicker value={monthStr} />
      </div>

      {/* البطاقات: الإيراد / المصروف / الصافي */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">{t("treasury.income", locale)}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(income, locale)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-red-600">
            <TrendingDown className="h-5 w-5" />
            <span className="text-sm font-medium">{t("treasury.expenses", locale)}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(totalExpense, locale)}</p>
        </Card>
        <Card className={`p-5 ${net >= 0 ? "bg-brand-50" : "bg-red-50"}`}>
          <div className="flex items-center gap-2 text-brand-700">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">{t("treasury.net", locale)}</span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${net >= 0 ? "text-brand-700" : "text-red-700"}`} dir="ltr">
            {formatCurrency(net, locale)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* نموذج إضافة مصروف */}
        <ExpenseForm />

        {/* جرد الفئات */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">{t("treasury.byCategory", locale)}</h2>
            </div>
            {categoryRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{t("treasury.noExpenses", locale)}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categoryRows.map(([cat, sum]) => {
                  const pct = totalExpense > 0 ? Math.round((sum / totalExpense) * 100) : 0;
                  return (
                    <div key={cat} className="px-5 py-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <span className="text-sm font-semibold text-slate-800" dir="ltr">
                          {formatCurrency(sum, locale)} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* جرد الإيراد حسب طريقة الدفع */}
          {methodRows.length > 0 && (
            <Card>
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold text-slate-800">{t("treasury.incomeByMethod", locale)}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {methodRows.map(([method, sum]) => (
                  <div key={method} className="flex items-center justify-between px-5 py-3">
                    <span className="font-medium text-slate-700">{t(`method.${method}`, locale)}</span>
                    <span className="text-sm font-semibold text-slate-800" dir="ltr">{formatCurrency(sum, locale)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* قائمة المصروفات */}
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">
                {t("treasury.expensesList", locale)} ({expenses.length})
              </h2>
            </div>
            {expenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{t("treasury.noExpenses", locale)}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    id={e.id}
                    amount={formatCurrency(e.amount, locale)}
                    category={e.category}
                    method={t(`method.${e.method}`, locale)}
                    note={e.note}
                    spentAt={e.spentAt.toISOString()}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
