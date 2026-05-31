import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getClinicSettings } from "@/server/clinic";
import { ClinicHeader } from "@/components/clinic-header";
import { PrintButton } from "../../print-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function PrintInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clinic, locale] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: { patient: true, items: true },
    }),
    getClinicSettings(),
    getLocale(),
  ]);
  if (!invoice) notFound();

  const due = invoice.total - invoice.paidAmount;

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <ClinicHeader clinic={clinic} />

      <div className="mt-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t("print.invoice", locale)}</h2>
          <p className="font-mono text-sm text-slate-500">{invoice.number}</p>
        </div>
        <div className="text-end text-sm text-slate-600">
          <p>{t("print.date", locale)}: {formatDate(invoice.createdAt, locale)}</p>
          <p>{t("print.patient", locale)}: {invoice.patient.firstName} {invoice.patient.lastName}</p>
          <p>{t("print.code", locale)}: {invoice.patient.code}</p>
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead className="border-b-2 border-slate-200 text-start text-xs text-slate-500">
          <tr>
            <th className="py-2">{t("print.item", locale)}</th>
            <th className="py-2">{t("col.qty", locale)}</th>
            <th className="py-2">{t("col.unitPrice", locale)}</th>
            <th className="py-2">{t("col.total", locale)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((it) => (
            <tr key={it.id}>
              <td className="py-2 text-slate-800">{it.description}</td>
              <td className="py-2 text-slate-600">{it.quantity}</td>
              <td className="py-2 text-slate-600">{formatCurrency(it.unitPrice, locale)}</td>
              <td className="py-2 font-medium">{formatCurrency(it.total, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">{t("col.total", locale)}</span><span className="font-medium">{formatCurrency(invoice.total, locale)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">{t("col.paid", locale)}</span><span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount, locale)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-semibold">{t("col.due", locale)}</span><span className="font-bold text-red-600">{formatCurrency(due > 0 ? due : 0, locale)}</span></div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">{t("print.thanks", locale)} — {clinic.name}</p>
    </div>
  );
}
