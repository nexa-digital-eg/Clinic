"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/server/audit";
import { getOrCreateOpenInvoice, recalcInvoice } from "@/server/billing";

const schema = z.object({
  patientId: z.string().min(1),
  toothNumber: z.coerce.number().int().min(11).max(85),
  surface: z.string().optional(),
  procedureId: z.string().optional(),
  notes: z.string().optional(),
});

// منطق مشترك لإنشاء سجل سن واحد + ربطه بالفاتورة والمخزون
async function createToothRecordCore(d: {
  patientId: string;
  toothNumber: number;
  surface?: string;
  procedureId?: string;
  notes?: string;
}): Promise<{ procedureName: string }> {
  let price = 0;
  let procedureName = "إجراء";
  if (d.procedureId) {
    const proc = await db.procedure.findUnique({ where: { id: d.procedureId } });
    if (proc) {
      price = proc.price;
      procedureName = proc.name;
    }
  }

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

  if (d.procedureId && price > 0) {
    const invoice = await getOrCreateOpenInvoice(d.patientId);
    await db.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: `${procedureName} — سن ${d.toothNumber}`,
        procedureId: d.procedureId,
        toothRecordId: record.id,
        quantity: 1,
        unitPrice: price,
        total: price,
      },
    });
    await recalcInvoice(invoice.id);
    await db.patient.update({
      where: { id: d.patientId },
      data: { balance: { decrement: price } },
    });
    await deductInventoryForProcedure(d.procedureId);
  }
  return { procedureName };
}

// إضافة إجراء على سن واحد
export async function addToothRecord(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "بيانات غير صحيحة" };
  const d = parsed.data;

  const { procedureName } = await createToothRecordCore(d);

  await logActivity("TOOTH_ADD", `${procedureName} — سن ${d.toothNumber}`);
  revalidatePath(`/dental-chart/${d.patientId}`);
  revalidatePath(`/patients/${d.patientId}`);
  return {};
}

// إضافة نفس الإجراء على عدة أسنان دفعة واحدة
export async function addToothRecordsBulk(
  patientId: string,
  toothNumbers: number[],
  surface: string | null,
  procedureId: string | null,
  notes: string | null,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };
  if (!patientId || toothNumbers.length === 0) return { error: "اختر سنّاً واحداً على الأقل" };

  let procedureName = "إجراء";
  for (const toothNumber of toothNumbers) {
    if (toothNumber < 11 || toothNumber > 85) continue;
    const res = await createToothRecordCore({
      patientId,
      toothNumber,
      surface: surface || undefined,
      procedureId: procedureId || undefined,
      notes: notes || undefined,
    });
    procedureName = res.procedureName;
  }

  await logActivity("TOOTH_ADD", `${procedureName} — ${toothNumbers.length} أسنان`);
  revalidatePath(`/dental-chart/${patientId}`);
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
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
  await logActivity("TOOTH_STATUS", status);
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
    const itemTotal = record.invoiceItem.total;
    await db.invoiceItem.delete({ where: { id: record.invoiceItem.id } });
    await recalcInvoice(invoiceId);
    // إلغاء المديونية المقابلة → يُعاد الرصيد
    await db.patient.update({
      where: { id: patientId },
      data: { balance: { increment: itemTotal } },
    });
  }
  await db.toothRecord.delete({ where: { id } });
  await logActivity("TOOTH_DELETE");

  revalidatePath(`/dental-chart/${patientId}`);
  revalidatePath(`/patients/${patientId}`);
}
