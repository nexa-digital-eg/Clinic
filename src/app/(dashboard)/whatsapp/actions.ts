"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dispatchMessage, processScheduledMessages } from "@/server/whatsapp";

const schema = z.object({
  patientId: z.string().optional(),
  toPhone: z.string().min(6, "أدخل رقم هاتف صحيح"),
  body: z.string().optional(),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  mediaType: z.enum(["image", "video", "document"]).optional().or(z.literal("")),
  scheduledAt: z.string().optional(),
  repeatEvery: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  repeatUntil: z.string().optional(),
});

export async function composeMessage(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" };
  }
  const d = parsed.data;

  if (!d.body && !d.mediaUrl) {
    return { error: "اكتب نص الرسالة أو أرفق ملفاً" };
  }

  const scheduled = d.scheduledAt ? new Date(d.scheduledAt) : null;
  const isFuture = scheduled && scheduled > new Date();

  const message = await db.whatsAppMessage.create({
    data: {
      patientId: d.patientId || null,
      toPhone: d.toPhone,
      body: d.body || null,
      mediaUrl: d.mediaUrl || null,
      mediaType: d.mediaUrl ? d.mediaType || "image" : null,
      status: "SCHEDULED",
      scheduledAt: scheduled,
      repeatEvery: d.repeatEvery && d.repeatEvery !== "none" ? d.repeatEvery : null,
      repeatUntil: d.repeatUntil ? new Date(d.repeatUntil) : null,
    },
  });

  // إرسال فوري لو مفيش جدولة مستقبلية
  if (!isFuture) {
    await dispatchMessage(message);
  }

  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function retryMessage(id: string) {
  const session = await getSession();
  if (!session) return;
  const message = await db.whatsAppMessage.findUnique({ where: { id } });
  if (!message) return;
  await dispatchMessage(message);
  revalidatePath("/whatsapp");
}

export async function deleteMessage(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.whatsAppMessage.delete({ where: { id } });
  revalidatePath("/whatsapp");
}

export async function runScheduledNow() {
  const session = await getSession();
  if (!session) return;
  await processScheduledMessages();
  revalidatePath("/whatsapp");
}
