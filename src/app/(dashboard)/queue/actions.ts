"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { QueueStatus } from "@prisma/client";

// التحقق من رقم الهاتف — هل هو عميل سابق؟
export async function lookupPhone(
  phone: string,
): Promise<{ found: boolean; id?: string; name?: string; code?: string }> {
  const session = await getSession();
  if (!session) return { found: false };
  const p = phone.trim();
  if (p.length < 6) return { found: false };
  const patient = await db.patient.findFirst({ where: { phone: p } });
  if (!patient) return { found: false };
  return {
    found: true,
    id: patient.id,
    name: `${patient.firstName} ${patient.lastName}`,
    code: patient.code,
  };
}

async function generatePatientCode(): Promise<string> {
  const count = await db.patient.count();
  return `P-${String(count + 1).padStart(5, "0")}`;
}

// إضافة للطابور — يتعرّف على العميل السابق أو ينشئ ملفاً جديداً
export async function addToQueue(
  _prev: { error?: string; ok?: boolean; returning?: boolean; name?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; returning?: boolean; name?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const doctorId = String(formData.get("doctorId") ?? "");
  if (!name || !phone) return { error: "الاسم ورقم الهاتف مطلوبان" };

  // ابحث عن المريض بالهاتف
  let patient = await db.patient.findFirst({ where: { phone } });
  const returning = !!patient;

  if (!patient) {
    // أنشئ ملفاً جديداً تلقائياً
    const parts = name.split(" ");
    patient = await db.patient.create({
      data: {
        code: await generatePatientCode(),
        firstName: parts[0] || name,
        lastName: parts.slice(1).join(" ") || "",
        phone,
      },
    });
  }

  await db.queueEntry.create({
    data: {
      patientId: patient.id,
      name: returning ? `${patient.firstName} ${patient.lastName}` : name,
      phone,
      reason: reason || null,
      doctorId: doctorId || null,
      status: "WAITING",
    },
  });

  revalidatePath("/queue");
  return {
    ok: true,
    returning,
    name: returning ? `${patient.firstName} ${patient.lastName}` : undefined,
  };
}

export async function setQueueStatus(id: string, status: QueueStatus) {
  const session = await getSession();
  if (!session) return;
  await db.queueEntry.update({
    where: { id },
    data: { status, calledAt: status === "IN_PROGRESS" ? new Date() : undefined },
  });
  revalidatePath("/queue");
}

export async function removeFromQueue(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.queueEntry.delete({ where: { id } });
  revalidatePath("/queue");
}
