"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().nonnegative().default(0),
  minQuantity: z.coerce.number().nonnegative().default(0),
  costPrice: z.coerce.number().nonnegative().default(0),
});

export async function createProduct(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  const product = await db.product.create({
    data: {
      name: d.name,
      sku: d.sku || null,
      unit: d.unit || "piece",
      quantity: d.quantity,
      minQuantity: d.minQuantity,
      costPrice: d.costPrice,
    },
  });

  if (d.quantity > 0) {
    await db.stockMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: d.quantity,
        reason: "رصيد افتتاحي",
      },
    });
  }

  revalidatePath("/inventory");
  return {};
}

// حركة مخزون (إضافة / تسوية)
export async function adjustStock(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const productId = String(formData.get("productId") ?? "");
  const type = String(formData.get("type") ?? "IN") as "IN" | "OUT" | "ADJUST";
  const quantity = parseFloat(String(formData.get("quantity") ?? "0"));
  const reason = String(formData.get("reason") ?? "") || null;
  if (!productId || !quantity || quantity <= 0) return;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return;

  let newQty = product.quantity;
  if (type === "IN") newQty += quantity;
  else if (type === "OUT") newQty -= quantity;
  else newQty = quantity; // ADJUST = ضبط الكمية على قيمة

  await db.$transaction([
    db.product.update({ where: { id: productId }, data: { quantity: newQty } }),
    db.stockMovement.create({
      data: { productId, type, quantity, reason },
    }),
  ]);

  revalidatePath("/inventory");
}

export async function deleteProduct(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.product.delete({ where: { id } });
  revalidatePath("/inventory");
}

// ربط منتج بإجراء (يُسحب تلقائياً عند تنفيذ الإجراء)
export async function linkProductToProcedure(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const procedureId = String(formData.get("procedureId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = parseFloat(String(formData.get("quantity") ?? "1"));
  if (!procedureId || !productId) return { error: "اختر الإجراء والمنتج" };

  await db.procedureProduct.upsert({
    where: { procedureId_productId: { procedureId, productId } },
    update: { quantity: quantity > 0 ? quantity : 1 },
    create: { procedureId, productId, quantity: quantity > 0 ? quantity : 1 },
  });

  revalidatePath("/inventory/procedures");
  return {};
}

export async function unlinkProduct(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.procedureProduct.delete({ where: { id } });
  revalidatePath("/inventory/procedures");
}
