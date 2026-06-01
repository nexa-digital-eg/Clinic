"use server";

import { db } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

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

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  return { ok: true };
}
