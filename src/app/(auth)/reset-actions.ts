"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendEmail, isEmailConfigured } from "@/lib/email";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// طلب رابط إعادة تعيين كلمة المرور
export async function requestPasswordReset(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "أدخل البريد الإلكتروني" };

  if (!isEmailConfigured()) {
    return { error: "خدمة البريد غير مُفعّلة بعد — تواصل مع مسؤول النظام" };
  }

  const user = await db.user.findUnique({ where: { email } });
  // لا نكشف ما إذا كان البريد موجوداً أم لا
  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

    // أبطل الرموز السابقة غير المستخدمة لنفس المستخدم
    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    const base = process.env.APP_URL || `${proto}://${host}`;
    const link = `${base}/reset/${token}`;

    await sendEmail({
      to: email,
      subject: "إعادة تعيين كلمة المرور — Smart Clinic",
      html: `
        <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:480px;margin:auto">
          <h2 style="color:#14532d">إعادة تعيين كلمة المرور</h2>
          <p>وصلنا طلب لإعادة تعيين كلمة مرور حسابك. اضغط الزر التالي خلال ساعة واحدة:</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${link}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">إعادة التعيين</a>
          </p>
          <p style="color:#64748b;font-size:13px">لو لم تطلب ذلك، تجاهل هذه الرسالة.</p>
        </div>`,
    });
  }

  return { ok: true };
}

// تنفيذ إعادة التعيين بالرمز
export async function resetPassword(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const token = String(formData.get("token") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "رابط غير صالح" };
  if (next.length < 6) return { error: "كلمة المرور 6 أحرف على الأقل" };
  if (next !== confirm) return { error: "كلمتا المرور غير متطابقتين" };

  const rec = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    return { error: "الرابط منتهي أو غير صالح — اطلب رابطاً جديداً" };
  }

  await db.user.update({
    where: { id: rec.userId },
    data: { passwordHash: await hashPassword(next), sessionVersion: { increment: 1 } },
  });
  await db.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } });

  return { ok: true };
}
