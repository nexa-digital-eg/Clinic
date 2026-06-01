"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { logActivity } from "@/server/audit";

// تسجيل الخروج فوراً من كل الأجهزة (يبطل كل الجلسات بما فيها الحالية)
export async function logoutEverywhere() {
  const session = await getSession();
  if (!session) redirect("/login");
  await db.user.update({
    where: { id: session.id },
    data: { sessionVersion: { increment: 1 } },
  });
  await logActivity("LOGOUT_ALL");
  await destroySession();
  redirect("/login");
}

export async function changeMyPassword(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next) return { error: "أدخل كلمة المرور الحالية والجديدة" };
  if (next.length < 6) return { error: "كلمة المرور الجديدة 6 أحرف على الأقل" };
  if (next !== confirm) return { error: "كلمتا المرور غير متطابقتين" };

  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "المستخدم غير موجود" };

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return { error: "كلمة المرور الحالية غير صحيحة" };

  // غيّر كلمة المرور وارفع إصدار الجلسة (يُسجّل خروج باقي الأجهزة)
  const newVersion = user.sessionVersion + 1;
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), sessionVersion: newVersion },
  });

  // سجّل الحدث ليظهر للأدمن
  await db.auditLog.create({
    data: {
      type: "PASSWORD_CHANGE",
      userId: user.id,
      userName: user.name,
      detail: "قام المستخدم بتغيير كلمة مروره",
    },
  });

  // جدّد جلسة الجهاز الحالي بالإصدار الجديد حتى لا يُسجَّل خروجه هو
  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sessionVersion: newVersion,
  });

  revalidatePath("/settings");
  return { ok: true };
}
