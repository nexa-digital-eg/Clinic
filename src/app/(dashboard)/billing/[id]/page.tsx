import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { InvoiceForms, InvoiceItemRow } from "./forms";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

const STATUS_COLOR: Record<string, "slate" | "green" | "yellow" | "red" | "blue"> = {
  OPEN: "yellow",
  PARTIAL: "blue",
  PAID: "green",
  CANCELLED: "red",
};

export default async function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();

  const [invoice, procedures] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: { include: { procedure: true }, orderBy: { id: "asc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.procedure.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!invoice) notFound();

  const due = invoice.total - invoice.paidAmount;
  const cancelled = invoice.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/billing" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{t("invd.invoice", locale)} {invoice.number}</h1>
            <Badge color={STATUS_COLOR[invoice.status]}>{t(`invStatus.${invoice.status}`, locale)}</Badge>
          </div>
          <Link href={`/patients/${invoice.patientId}`} className="text-sm text-brand-600 hover:underline">
            {invoice.patient.firstName} {invoice.patient.lastName}
          </Link>
          <span className="mr-2 text-sm text-slate-400">• {formatDate(invoice.createdAt)}</span>
        </div>
        <a
          href={`/print/invoice/${invoice.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          {t("billing.print", locale)}
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("col.total", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{formatCurrency(invoice.total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("col.paid", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(invoice.paidAmount)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("col.due", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(due > 0 ? due : 0)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* البنود */}
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">{t("invd.items", locale)}</h2>
            </div>
            {invoice.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{t("invd.noItems", locale)}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">{t("col.description", locale)}</th>
                      <th className="px-4 py-2 font-medium">{t("col.qty", locale)}</th>
                      <th className="px-4 py-2 font-medium">{t("col.unitPrice", locale)}</th>
                      <th className="px-4 py-2 font-medium">{t("col.total", locale)}</th>
                      {!cancelled && <th className="px-4 py-2 font-medium"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((it) => (
                      <InvoiceItemRow
                        key={it.id}
                        id={it.id}
                        description={it.description}
                        quantity={it.quantity}
                        unitPrice={it.unitPrice}
                        total={it.total}
                        cancelled={cancelled}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* المدفوعات */}
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">{t("invd.payments", locale)}</h2>
            </div>
            {invoice.payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{t("invd.noPayments", locale)}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-green-600">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {t(`method.${p.method}`, locale)} • {formatDateTime(p.createdAt)}
                      </p>
                    </div>
                    {p.note && <span className="text-sm text-slate-500">{p.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* النماذج */}
        <InvoiceForms
          invoiceId={invoice.id}
          due={due}
          cancelled={cancelled}
          procedures={procedures.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        />
      </div>
    </div>
  );
}
