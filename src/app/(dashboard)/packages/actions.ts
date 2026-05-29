"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// إنشاء باقة في الكتالوج
const packageSchema = z.object({
  name: z.string().min(1, "اسم الباقة مطلوب"),
  description: z.string().optional(),
  sessionCount: z.coerce.number().int().min(1, "عدد الجلسات على الأقل 1"),
  price: z.coerce.number().nonnegative().default(0),
});

export async function createPackage(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = packageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  await db.package.create({
    data: {
      name: d.name,
      description: d.description || null,
      sessionCount: d.sessionCount,
      price: d.price,
    },
  });

  revalidatePath("/packages");
  return {};
}

export async function deletePackage(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.package.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/packages");
}

// إسناد باقة لمريض + إنشاء الجلسات
export async function assignPackage(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const patientId = String(formData.get("patientId") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  if (!patientId || !packageId) return { error: "اختر المريض والباقة" };

  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg) return { error: "الباقة غير موجودة" };

  const pp = await db.patientPackage.create({
    data: {
      patientId,
      packageId,
      totalSessions: pkg.sessionCount,
      sessions: {
        create: Array.from({ length: pkg.sessionCount }, (_, i) => ({
          sessionNumber: i + 1,
        })),
      },
    },
  });

  // تذكير أول لمتابعة بدء الباقة
  await db.reminder.create({
    data: {
      patientId,
      type: "PACKAGE",
      message: `بدء متابعة باقة: ${pkg.name}`,
      remindAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/packages");
  revalidatePath(`/packages/${pp.id}`);
  return {};
}

// إكمال جلسة من الباقة + تذكير الجلسة التالية تلقائياً
export async function completeSession(sessionId: string, patientPackageId: string) {
  const session = await getSession();
  if (!session) return;

  const ps = await db.packageSession.findUnique({
    where: { id: sessionId },
    include: { patientPackage: { include: { package: true } } },
  });
  if (!ps || ps.completedAt) return;

  await db.$transaction([
    db.packageSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date() },
    }),
    db.patientPackage.update({
      where: { id: patientPackageId },
      data: { usedSessions: { increment: 1 } },
    }),
  ]);

  const pp = ps.patientPackage;
  const remaining = pp.totalSessions - (pp.usedSessions + 1);

  if (remaining > 0) {
    // تذكير أوتوماتيك بالجلسة التالية بعد أسبوع
    await db.reminder.create({
      data: {
        patientId: pp.patientId,
        type: "PACKAGE",
        message: `الجلسة التالية من باقة "${pp.package.name}" (متبقٍ ${remaining})`,
        remindAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    // انتهت الباقة
    await db.patientPackage.update({
      where: { id: patientPackageId },
      data: { isActive: false },
    });
  }

  revalidatePath(`/packages/${patientPackageId}`);
  revalidatePath("/packages");
}

export async function scheduleSession(
  sessionId: string,
  patientPackageId: string,
  formData: FormData,
) {
  const session = await getSession();
  if (!session) return;
  const date = String(formData.get("scheduledAt") ?? "");
  if (!date) return;
  await db.packageSession.update({
    where: { id: sessionId },
    data: { scheduledAt: new Date(date) },
  });
  revalidatePath(`/packages/${patientPackageId}`);
}
