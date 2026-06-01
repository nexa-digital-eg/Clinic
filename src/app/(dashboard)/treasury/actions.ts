"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/server/audit";
import type { PaymentMethod } from "@prisma/client";

// إضافة مصروف للخزنة
export async function addExpense(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const amount = parseFloat(String(formData.get("amount") ?? "0"));
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const method = String(formData.get("method") ?? "CASH") as PaymentMethod;
  const spentAtRaw = String(formData.get("spentAt") ?? "").trim();

  if (!amount || amount <= 0) return { error: "أدخل مبلغاً صحيحاً" };
  if (!category) return { error: "اختر فئة المصروف" };

  await db.expense.create({
    data: {
      amount,
      category,
      note: note || null,
      method,
      spentAt: spentAtRaw ? new Date(spentAtRaw) : new Date(),
    },
  });

  await logActivity("EXPENSE_ADD", `${amount} — ${category}`);
  revalidatePath("/treasury");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.expense.delete({ where: { id } });
  revalidatePath("/treasury");
}
