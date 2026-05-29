"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { ReminderStatus } from "@prisma/client";

// توليد تذكيرات تلقائية للحجوزات القادمة التي لا تملك تذكيراً
export async function generateAppointmentReminders() {
  const session = await getSession();
  if (!session) return;

  const now = new Date();
  const upcoming = await db.appointment.findMany({
    where: {
      startsAt: { gte: now },
      status: { in: ["PENDING", "CONFIRMED"] },
      reminders: { none: {} },
    },
    include: { patient: true },
    take: 200,
  });

  for (const a of upcoming) {
    // التذكير قبل الموعد بيوم
    const remindAt = new Date(a.startsAt.getTime() - 24 * 60 * 60 * 1000);
    await db.reminder.create({
      data: {
        patientId: a.patientId,
        appointmentId: a.id,
        type: "APPOINTMENT",
        status: "PENDING",
        message: `تذكير بموعدك يوم ${a.startsAt.toLocaleDateString("ar-EG")}`,
        remindAt: remindAt > now ? remindAt : now,
      },
    });
  }

  revalidatePath("/reminders");
}

const manualSchema = z.object({
  patientId: z.string().min(1, "اختر المريض"),
  message: z.string().min(1, "اكتب نص التذكير"),
  remindAt: z.string().min(1, "اختر الموعد"),
});

export async function createReminder(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = manualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  await db.reminder.create({
    data: {
      patientId: d.patientId,
      type: "CUSTOM",
      message: d.message,
      remindAt: new Date(d.remindAt),
    },
  });

  revalidatePath("/reminders");
  return {};
}

export async function setReminderStatus(id: string, status: ReminderStatus) {
  const session = await getSession();
  if (!session) return;
  await db.reminder.update({ where: { id }, data: { status } });
  revalidatePath("/reminders");
}

// تأكيد الحجز من خلال التذكير
export async function confirmFromReminder(id: string, appointmentId: string) {
  const session = await getSession();
  if (!session) return;
  await db.$transaction([
    db.appointment.update({ where: { id: appointmentId }, data: { status: "CONFIRMED" } }),
    db.reminder.update({ where: { id }, data: { status: "CONFIRMED" } }),
  ]);
  revalidatePath("/reminders");
  revalidatePath("/appointments");
}

// تغيير موعد الحجز من خلال التذكير
export async function rescheduleFromReminder(
  id: string,
  appointmentId: string,
  formData: FormData,
) {
  const session = await getSession();
  if (!session) return;
  const newAt = String(formData.get("newAt") ?? "");
  if (!newAt) return;
  const startsAt = new Date(newAt);
  if (isNaN(startsAt.getTime())) return;

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: {
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
        status: "CONFIRMED",
      },
    }),
    db.reminder.update({
      where: { id },
      data: { status: "RESCHEDULED", remindAt: new Date(startsAt.getTime() - 24 * 60 * 60 * 1000) },
    }),
  ]);
  revalidatePath("/reminders");
  revalidatePath("/appointments");
}

export async function deleteReminder(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.reminder.delete({ where: { id } });
  revalidatePath("/reminders");
}
