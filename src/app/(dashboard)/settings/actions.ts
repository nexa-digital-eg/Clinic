"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/* ===== بيانات العيادة ===== */
export async function updateClinic(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (!(await requireAdmin())) return { error: "غير مصرح (للمدير فقط)" };

  const data = {
    name: String(formData.get("name") ?? "").trim() || "Smart Clinic",
    logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    currency: String(formData.get("currency") ?? "").trim() || "ج.م",
  };

  await db.clinicSettings.upsert({
    where: { id: "clinic" },
    update: data,
    create: { id: "clinic", ...data },
  });

  revalidatePath("/settings");
  return { ok: true };
}

/* ===== الإجراءات والأسعار ===== */
const procedureSchema = z.object({
  name: z.string().min(1, "اسم الإجراء مطلوب"),
  price: z.coerce.number().nonnegative(),
  description: z.string().optional(),
});

export async function createProcedure(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "غير مصرح" };
  const parsed = procedureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  await db.procedure.create({
    data: {
      name: parsed.data.name,
      price: parsed.data.price,
      description: parsed.data.description || null,
    },
  });
  revalidatePath("/settings");
  return {};
}

export async function updateProcedurePrice(id: string, formData: FormData) {
  if (!(await requireAdmin())) return;
  const price = parseFloat(String(formData.get("price") ?? "0"));
  const name = String(formData.get("name") ?? "").trim();
  await db.procedure.update({
    where: { id },
    data: { price: isNaN(price) ? undefined : price, name: name || undefined },
  });
  revalidatePath("/settings");
}

export async function toggleProcedure(id: string, isActive: boolean) {
  if (!(await requireAdmin())) return;
  await db.procedure.update({ where: { id }, data: { isActive } });
  revalidatePath("/settings");
}

/* ===== الفروع ===== */
export async function createBranch(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "غير مصرح" };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "اسم الفرع مطلوب" };
  await db.branch.create({
    data: {
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    },
  });
  revalidatePath("/settings");
  return {};
}

export async function toggleBranch(id: string, isActive: boolean) {
  if (!(await requireAdmin())) return;
  await db.branch.update({ where: { id }, data: { isActive } });
  revalidatePath("/settings");
}

/* ===== المستخدمون والأطباء ===== */
const staffSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد غير صحيح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST"]),
  specialty: z.string().optional(),
  branchId: z.string().optional(),
});

export async function createStaff(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (!(await requireAdmin())) return { error: "غير مصرح" };
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  const d = parsed.data;

  const exists = await db.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (exists) return { error: "البريد مستخدم بالفعل" };

  const user = await db.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      passwordHash: await hashPassword(d.password),
      role: d.role as Role,
      branchId: d.branchId || null,
    },
  });

  // لو طبيب، أنشئ سجل الطبيب
  if (d.role === "DOCTOR") {
    await db.doctor.create({
      data: {
        userId: user.id,
        specialty: d.specialty || null,
        branchId: d.branchId || null,
      },
    });
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function toggleStaff(id: string, isActive: boolean) {
  const session = await requireAdmin();
  if (!session) return;
  if (session.id === id) return; // لا يعطّل نفسه
  await db.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/settings");
}
