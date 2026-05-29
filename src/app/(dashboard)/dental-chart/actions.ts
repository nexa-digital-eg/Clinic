"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toothName } from "@/lib/teeth";

const schema = z.object({
  patientId: z.string().min(1),
  toothNumber: z.coerce.number().int().min(11).max(48),
  surface: z.string().optional(),
  procedureId: z.string().optional(),
  notes: z.string().optional(),
});

// إيجاد فاتورة مفتوحة للمريض أو إنشاء واحدة (الكشف الحالي)
async function getOrCreateOpenInvoice(patientId: string) {
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

async function recalcInvoice(invoiceId: string) {
  const agg = await db.invoiceItem.aggregate({
    where: { invoiceId },
    _sum: { total: true },
  });
  const total = agg._sum.total ?? 0;
  const inv = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return;
  const status =
    inv.paidAmount >= total && total > 0
      ? "PAID"
      : inv.paidAmount > 0
        ? "PARTIAL"
        : "OPEN";
  await db.invoice.update({
    where: { id: invoiceId },
    data: { total, status },
  });
}

// إضافة إجراء على سن + إضافة سعره تلقائياً على الكشف (الفاتورة)
export async function addToothRecord(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "بيانات غير صحيحة" };
  const d = parsed.data;

  let price = 0;
  let procedureName = "إجراء";
  if (d.procedureId) {
    const proc = await db.procedure.findUnique({ where: { id: d.procedureId } });
    if (proc) {
      price = proc.price;
      procedureName = proc.name;
    }
  }

  // أنشئ سجل السن
  const record = await db.toothRecord.create({
    data: {
      patientId: d.patientId,
      toothNumber: d.toothNumber,
      surface: d.surface || null,
      procedureId: d.procedureId || null,
      price,
      notes: d.notes || null,
      status: "planned",
    },
  });

  // أضف السعر تلقائياً على الكشف (الفاتورة المفتوحة)
  if (d.procedureId && price > 0) {
    const invoice = await getOrCreateOpenInvoice(d.patientId);
    await db.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: `${procedureName} — سن ${d.toothNumber} (${toothName(d.toothNumber)})`,
        procedureId: d.procedureId,
        toothRecordId: record.id,
        quantity: 1,
        unitPrice: price,
        total: price,
      },
    });
    await recalcInvoice(invoice.id);

    // السحب التلقائي من المخزون (ربط المنتجات بالإجراء)
    await deductInventoryForProcedure(d.procedureId);
  }

  revalidatePath(`/dental-chart/${d.patientId}`);
  revalidatePath(`/patients/${d.patientId}`);
  return {};
}

// سحب الكميات المرتبطة بالإجراء من المخزون
async function deductInventoryForProcedure(procedureId: string) {
  const links = await db.procedureProduct.findMany({
    where: { procedureId },
    include: { product: true },
  });
  for (const link of links) {
    await db.$transaction([
      db.product.update({
        where: { id: link.productId },
        data: { quantity: { decrement: link.quantity } },
      }),
      db.stockMovement.create({
        data: {
          productId: link.productId,
          type: "OUT",
          quantity: link.quantity,
          reason: "استهلاك إجراء طبي",
        },
      }),
    ]);
  }
}

export async function setToothStatus(
  id: string,
  patientId: string,
  status: "planned" | "done",
) {
  const session = await getSession();
  if (!session) return;
  await db.toothRecord.update({ where: { id }, data: { status } });
  revalidatePath(`/dental-chart/${patientId}`);
}

export async function deleteToothRecord(id: string, patientId: string) {
  const session = await getSession();
  if (!session) return;

  const record = await db.toothRecord.findUnique({
    where: { id },
    include: { invoiceItem: true },
  });
  if (record?.invoiceItem) {
    const invoiceId = record.invoiceItem.invoiceId;
    await db.invoiceItem.delete({ where: { id: record.invoiceItem.id } });
    await recalcInvoice(invoiceId);
  }
  await db.toothRecord.delete({ where: { id } });

  revalidatePath(`/dental-chart/${patientId}`);
  revalidatePath(`/patients/${patientId}`);
}
