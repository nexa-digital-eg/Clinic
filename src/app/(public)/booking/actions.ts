"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "اسم العائلة مطلوب"),
  phone: z.string().min(6, "رقم الهاتف مطلوب"),
  doctorId: z.string().min(1, "اختر الطبيب"),
  date: z.string().min(1, "اختر التاريخ"),
  time: z.string().min(1, "اختر الوقت"),
  reason: z.string().optional(),
});

async function generatePatientCode(): Promise<string> {
  const count = await db.patient.count();
  return `P-${String(count + 1).padStart(5, "0")}`;
}

export async function bookOnline(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  const startsAt = new Date(`${d.date}T${d.time}`);
  if (isNaN(startsAt.getTime())) return { error: "تاريخ أو وقت غير صحيح" };
  if (startsAt < new Date()) return { error: "اختر موعداً في المستقبل" };

  // ابحث عن المريض بالهاتف أو أنشئ ملفاً جديداً
  let patient = await db.patient.findFirst({ where: { phone: d.phone } });
  if (!patient) {
    patient = await db.patient.create({
      data: {
        code: await generatePatientCode(),
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone,
      },
    });
  }

  const doctor = await db.doctor.findUnique({ where: { id: d.doctorId } });
  if (!doctor) return { error: "الطبيب غير موجود" };

  await db.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: d.doctorId,
      branchId: doctor.branchId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
      reason: d.reason || null,
      status: "PENDING",
      isOnline: true,
    },
  });

  return { success: true };
}
