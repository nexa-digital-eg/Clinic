import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Receipt } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

const STATUS_COLOR: Record<string, "slate" | "green" | "yellow" | "red" | "blue"> = {
  OPEN: "yellow",
  PARTIAL: "blue",
  PAID: "green",
  CANCELLED: "red",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const locale = await getLocale();

  const where: Prisma.InvoiceWhereInput =
    status && STATUS_COLOR[status]
      ? { status: status as Prisma.InvoiceWhereInput["status"] }
      : {};

  const [invoices, totals] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { patient: true },
    }),
    db.invoice.aggregate({
      _sum: { total: true, paidAmount: true },
      where: { status: { in: ["OPEN", "PARTIAL", "PAID"] } },
    }),
  ]);

  const totalBilled = totals._sum.total ?? 0;
  const totalPaid = totals._sum.paidAmount ?? 0;
  const totalDue = totalBilled - totalPaid;

  const filters = [
    { key: "", label: t("common.all", locale) },
    { key: "OPEN", label: t("invStatus.OPEN", locale) },
    { key: "PARTIAL", label: t("invStatus.PARTIAL", locale) },
    { key: "PAID", label: t("invStatus.PAID", locale) },
    { key: "CANCELLED", label: t("invStatus.CANCELLED", locale) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("billing.title", locale)}</h1>
        <p className="text-sm text-slate-500">{t("billing.subtitle", locale)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("billing.totalBilled", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{formatCurrency(totalBilled)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("billing.collected", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("billing.remaining", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/billing?status=${f.key}` : "/billing"}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              (status ?? "") === f.key
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Receipt className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">{t("billing.none", locale)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("col.number", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.patient", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.date", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.total", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.paid", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.due", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.status", locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const due = inv.total - inv.paidAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/billing/${inv.id}`} className="font-mono text-xs text-brand-600 hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/billing/${inv.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                          {inv.patient.firstName} {inv.patient.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3 text-green-600">{formatCurrency(inv.paidAmount)}</td>
                      <td className="px-4 py-3 text-red-600">{formatCurrency(due > 0 ? due : 0)}</td>
                      <td className="px-4 py-3"><Badge color={STATUS_COLOR[inv.status]}>{t(`invStatus.${inv.status}`, locale)}</Badge></td>
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
