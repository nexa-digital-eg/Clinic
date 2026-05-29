import "server-only";
import { db } from "@/lib/db";

// إيجاد فاتورة مفتوحة للمريض أو إنشاء واحدة (الكشف الحالي)
export async function getOrCreateOpenInvoice(patientId: string) {
  const existing = await db.invoice.findFirst({
    where: { patientId, status: { in: ["OPEN", "PARTIAL"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  const count = await db.invoice.count();
  return db.invoice.create({
    data: {
      number: `INV-${String(count + 1).padStart(5, "0")}`,
      patientId,
      status: "OPEN",
    },
  });
}

// إعادة حساب إجمالي الفاتورة وحالتها بناءً على البنود والمدفوع
export async function recalcInvoice(invoiceId: string) {
  const [agg, inv] = await Promise.all([
    db.invoiceItem.aggregate({
      where: { invoiceId },
      _sum: { total: true },
    }),
    db.invoice.findUnique({ where: { id: invoiceId } }),
  ]);
  if (!inv) return;
  if (inv.status === "CANCELLED") return;

  const total = agg._sum.total ?? 0;
  const status =
    total > 0 && inv.paidAmount >= total
      ? "PAID"
      : inv.paidAmount > 0
        ? "PARTIAL"
        : "OPEN";

  await db.invoice.update({
    where: { id: invoiceId },
    data: { total, status },
  });
}
