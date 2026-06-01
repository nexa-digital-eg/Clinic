"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { logActivity } from "@/server/audit";
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
  title: z.string().optional(),
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

  // الأقسام المسموح بها (تأتي كقيم متعددة باسم permissions)
  const permissions = formData.getAll("permissions").map(String).filter(Boolean);

  const user = await db.user.create({
    data: {
      name: d.name,
      email: d.email.toLowerCase(),
      passwordHash: await hashPassword(d.password),
      role: d.role as Role,
      title: d.title?.trim() || null,
      permissions,
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

  await logActivity("STAFF_CREATE", `${d.name} (${d.role})`);
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

// تعديل المسمّى والصلاحيات لمستخدم قائم
export async function updateStaffAccess(
  id: string,
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (!(await requireAdmin())) return { error: "غير مصرح" };
  const title = String(formData.get("title") ?? "").trim();
  const permissions = formData.getAll("permissions").map(String).filter(Boolean);
  await db.user.update({
    where: { id },
    data: { title: title || null, permissions },
  });
  revalidatePath("/settings");
  return { ok: true };
}

/* ===== قائمة الأدوية (استيراد من إكسيل/CSV) ===== */

// يقرأ شيت إكسيل (xlsx/xls) أو CSV ويستخرج صفوف الأدوية
// الأعمدة المتوقعة (عربي أو إنجليزي): اسم الدواء/name، الشكل/form، التركيز/strength، ملاحظات/notes
async function parseMedicationSheet(
  file: File,
): Promise<{ name: string; form?: string; strength?: string; notes?: string }[]> {
  const XLSX = await import("xlsx");
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const pick = (row: Record<string, unknown>, keys: string[]): string => {
    for (const k of Object.keys(row)) {
      const norm = k.trim().toLowerCase();
      if (keys.some((c) => norm === c || norm.includes(c))) {
        const v = String(row[k] ?? "").trim();
        if (v) return v;
      }
    }
    return "";
  };

  const out: { name: string; form?: string; strength?: string; notes?: string }[] = [];
  for (const row of rows) {
    const name = pick(row, ["name", "الدواء", "اسم", "drug", "medication"]);
    if (!name) continue;
    out.push({
      name,
      form: pick(row, ["form", "الشكل", "شكل"]) || undefined,
      strength: pick(row, ["strength", "التركيز", "تركيز", "dose"]) || undefined,
      notes: pick(row, ["notes", "ملاحظات", "ملاحظة"]) || undefined,
    });
  }
  return out;
}

export async function importMedications(
  _prev: { error?: string; ok?: boolean; added?: number; total?: number } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; added?: number; total?: number }> {
  if (!(await requireAdmin())) return { error: "غير مصرح (للمدير فقط)" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "اختر ملف إكسيل أولاً" };

  let parsed: { name: string; form?: string; strength?: string; notes?: string }[];
  try {
    parsed = await parseMedicationSheet(file);
  } catch {
    return { error: "تعذّر قراءة الملف — تأكد أنه إكسيل (.xlsx) صحيح" };
  }
  if (parsed.length === 0) return { error: "لم يتم العثور على أعمدة أدوية في الملف" };

  let added = 0;
  for (const m of parsed) {
    const name = m.name.trim();
    if (!name) continue;
    try {
      await db.medication.upsert({
        where: { name },
        update: { form: m.form || null, strength: m.strength || null, notes: m.notes || null },
        create: { name, form: m.form || null, strength: m.strength || null, notes: m.notes || null },
      });
      added++;
    } catch {
      // تجاهل الصفوف المكررة/غير الصالحة
    }
  }

  const total = await db.medication.count();
  revalidatePath("/settings");
  return { ok: true, added, total };
}

export async function clearMedications() {
  if (!(await requireAdmin())) return;
  await db.medication.deleteMany();
  revalidatePath("/settings");
}
