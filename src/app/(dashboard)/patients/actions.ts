"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { del } from "@vercel/blob";

const patientSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  phone: z.string().min(6, "رقم الهاتف مطلوب"),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE"]).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  notes: z.string().optional(),
});

async function generatePatientCode(): Promise<string> {
  const count = await db.patient.count();
  return `P-${String(count + 1).padStart(5, "0")}`;
}

export async function createPatient(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  const patient = await db.patient.create({
    data: {
      code: await generatePatientCode(),
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      email: d.email || null,
      gender: d.gender ? (d.gender as "MALE" | "FEMALE") : null,
      birthDate: d.birthDate ? new Date(d.birthDate) : null,
      address: d.address || null,
      bloodType: d.bloodType || null,
      allergies: d.allergies || null,
      chronicConditions: d.chronicConditions || null,
      notes: d.notes || null,
    },
  });

  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

export async function addComplaint(patientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await db.complaint.create({
    data: {
      patientId,
      title,
      details: String(formData.get("details") ?? "") || null,
    },
  });
  revalidatePath(`/patients/${patientId}`);
}

export async function addDiagnosis(patientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await db.diagnosis.create({
    data: {
      patientId,
      title,
      details: String(formData.get("details") ?? "") || null,
    },
  });
  revalidatePath(`/patients/${patientId}`);
}

// تسجيل ملف مريض بعد رفعه إلى التخزين
export async function recordPatientFile(
  patientId: string,
  data: { name: string; url: string; mimeType?: string; size?: number; category?: string },
): Promise<{ id: string } | null> {
  const session = await getSession();
  if (!session) return null;
  if (!data.url || !data.name) return null;
  const file = await db.patientFile.create({
    data: {
      patientId,
      name: data.name,
      url: data.url,
      mimeType: data.mimeType || null,
      size: data.size ?? null,
      category: data.category || null,
    },
  });
  revalidatePath(`/patients/${patientId}`);
  return { id: file.id };
}

export async function deletePatientFile(id: string) {
  const session = await getSession();
  if (!session) return;
  const file = await db.patientFile.findUnique({ where: { id } });
  if (!file) return;
  // احذف من التخزين السحابي (تجاهل الخطأ لو غير متاح)
  try {
    await del(file.url);
  } catch {
    // ignore
  }
  await db.patientFile.delete({ where: { id } });
  revalidatePath(`/patients/${file.patientId}`);
}

export async function addPayment(patientId: string, formData: FormData) {
  const amount = parseFloat(String(formData.get("amount") ?? "0"));
  if (!amount || amount <= 0) return;
  await db.$transaction([
    db.payment.create({
      data: {
        patientId,
        amount,
        method: (String(formData.get("method") ?? "CASH") as
          | "CASH"
          | "CARD"
          | "TRANSFER"
          | "OTHER"),
        note: String(formData.get("note") ?? "") || null,
      },
    }),
    db.patient.update({
      where: { id: patientId },
      data: { balance: { increment: amount } },
    }),
  ]);
  revalidatePath(`/patients/${patientId}`);
}
