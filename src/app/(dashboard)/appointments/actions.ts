"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDefaultDoctor } from "@/server/clinic";
import type { AppointmentStatus } from "@prisma/client";

const schema = z.object({
  patientId: z.string().min(1, "اختر المريض"),
  branchId: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "اختر التاريخ"),
  time: z.string().min(1, "اختر الوقت"),
  durationMin: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function createAppointment(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  // العيادة بطبيب واحد — يُعيَّن تلقائياً
  const doctor = await getDefaultDoctor();
  if (!doctor) return { error: "لا يوجد طبيب مسجّل في النظام" };

  const startsAt = new Date(`${d.date}T${d.time}`);
  if (isNaN(startsAt.getTime())) return { error: "تاريخ أو وقت غير صحيح" };

  const duration = parseInt(d.durationMin || "30", 10);
  const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

  await db.appointment.create({
    data: {
      patientId: d.patientId,
      doctorId: doctor.id,
      branchId: d.branchId || null,
      startsAt,
      endsAt,
      reason: d.reason || null,
      notes: d.notes || null,
      status: "CONFIRMED",
    },
  });

  revalidatePath("/appointments");
  redirect("/appointments");
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
) {
  const session = await getSession();
  if (!session) return;
  await db.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/appointments");
}

export async function deleteAppointment(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.appointment.delete({ where: { id } });
  revalidatePath("/appointments");
}
