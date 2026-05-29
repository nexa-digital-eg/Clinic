import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getClinicSettings } from "@/server/clinic";
import { ClinicHeader } from "@/components/clinic-header";
import { PrintButton } from "../../print-button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PrintInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clinic] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: { patient: true, items: true },
    }),
    getClinicSettings(),
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
          <h2 className="text-lg font-bold text-slate-800">فاتورة</h2>
          <p className="font-mono text-sm text-slate-500">{invoice.number}</p>
        </div>
        <div className="text-left text-sm text-slate-600">
          <p>التاريخ: {formatDate(invoice.createdAt)}</p>
          <p>المريض: {invoice.patient.firstName} {invoice.patient.lastName}</p>
          <p>كود: {invoice.patient.code}</p>
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead className="border-b-2 border-slate-200 text-right text-xs text-slate-500">
          <tr>
            <th className="py-2">البند</th>
            <th className="py-2">الكمية</th>
            <th className="py-2">سعر الوحدة</th>
            <th className="py-2">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((it) => (
            <tr key={it.id}>
              <td className="py-2 text-slate-800">{it.description}</td>
              <td className="py-2 text-slate-600">{it.quantity}</td>
              <td className="py-2 text-slate-600">{formatCurrency(it.unitPrice)}</td>
              <td className="py-2 font-medium">{formatCurrency(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">الإجمالي</span><span className="font-medium">{formatCurrency(invoice.total)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">المدفوع</span><span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-semibold">المتبقي</span><span className="font-bold text-red-600">{formatCurrency(due > 0 ? due : 0)}</span></div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">شكراً لزيارتكم — {clinic.name}</p>
    </div>
  );
}
