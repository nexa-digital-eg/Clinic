"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recalcInvoice } from "@/server/billing";

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("أدخل مبلغاً صحيحاً"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]).default("CASH"),
  note: z.string().optional(),
});

// تسجيل دفعة على فاتورة
export async function payInvoice(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  const invoice = await db.invoice.findUnique({ where: { id: d.invoiceId } });
  if (!invoice) return { error: "الفاتورة غير موجودة" };
  if (invoice.status === "CANCELLED") return { error: "الفاتورة ملغاة" };

  await db.$transaction([
    db.payment.create({
      data: {
        patientId: invoice.patientId,
        invoiceId: invoice.id,
        amount: d.amount,
        method: d.method,
        note: d.note || null,
      },
    }),
    db.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount: { increment: d.amount } },
    }),
    db.patient.update({
      where: { id: invoice.patientId },
      data: { balance: { increment: d.amount } },
    }),
  ]);

  await recalcInvoice(invoice.id);
  revalidatePath(`/billing/${invoice.id}`);
  revalidatePath("/billing");
  revalidatePath(`/patients/${invoice.patientId}`);
  return {};
}

// إضافة بند يدوي للفاتورة (إجراء/خدمة بدون سن)
const itemSchema = z.object({
  invoiceId: z.string().min(1),
  description: z.string().min(1, "أدخل الوصف"),
  procedureId: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
});

export async function addInvoiceItem(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  const invoice = await db.invoice.findUnique({ where: { id: d.invoiceId } });
  if (!invoice) return { error: "الفاتورة غير موجودة" };

  let unitPrice = d.unitPrice;
  if (d.procedureId) {
    const proc = await db.procedure.findUnique({ where: { id: d.procedureId } });
    if (proc && !d.unitPrice) unitPrice = proc.price;
  }
  const total = unitPrice * d.quantity;

  await db.invoiceItem.create({
    data: {
      invoiceId: invoice.id,
      description: d.description,
      procedureId: d.procedureId || null,
      quantity: d.quantity,
      unitPrice,
      total,
    },
  });

  await recalcInvoice(invoice.id);
  await db.patient.update({
    where: { id: invoice.patientId },
    data: { balance: { decrement: total } },
  });

  revalidatePath(`/billing/${invoice.id}`);
  revalidatePath(`/patients/${invoice.patientId}`);
  return {};
}

export async function deleteInvoiceItem(id: string) {
  const session = await getSession();
  if (!session) return;
  const item = await db.invoiceItem.findUnique({
    where: { id },
    include: { invoice: true },
  });
  if (!item) return;
  await db.invoiceItem.delete({ where: { id } });
  await recalcInvoice(item.invoiceId);
  await db.patient.update({
    where: { id: item.invoice.patientId },
    data: { balance: { increment: item.total } },
  });
  revalidatePath(`/billing/${item.invoiceId}`);
}

export async function cancelInvoice(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath(`/billing/${id}`);
  revalidatePath("/billing");
}
