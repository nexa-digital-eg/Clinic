import "server-only";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import type { WhatsAppMessage } from "@prisma/client";

// إرسال رسالة مسجّلة وتحديث حالتها
export async function dispatchMessage(message: WhatsAppMessage): Promise<void> {
  await db.whatsAppMessage.update({
    where: { id: message.id },
    data: { status: "SENDING" },
  });

  const result = await sendWhatsApp({
    to: message.toPhone,
    body: message.body,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
  });

  if (result.error) {
    await db.whatsAppMessage.update({
      where: { id: message.id },
      data: { status: "FAILED", error: result.error },
    });
    return;
  }

  await db.whatsAppMessage.update({
    where: { id: message.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      externalId: result.id || null,
      error: null,
    },
  });

  // التكرار: أنشئ النسخة التالية إن وُجد
  await scheduleNextRepeat(message);
}

function nextDate(from: Date, every: string): Date | null {
  const d = new Date(from);
  switch (every) {
    case "daily":
      d.setDate(d.getDate() + 1);
      return d;
    case "weekly":
      d.setDate(d.getDate() + 7);
      return d;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      return d;
    default:
      return null;
  }
}

async function scheduleNextRepeat(message: WhatsAppMessage): Promise<void> {
  if (!message.repeatEvery || message.repeatEvery === "none") return;
  const base = message.scheduledAt ?? new Date();
  const next = nextDate(base, message.repeatEvery);
  if (!next) return;
  if (message.repeatUntil && next > message.repeatUntil) return;

  await db.whatsAppMessage.create({
    data: {
      patientId: message.patientId,
      toPhone: message.toPhone,
      body: message.body,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      status: "SCHEDULED",
      scheduledAt: next,
      repeatEvery: message.repeatEvery,
      repeatUntil: message.repeatUntil,
    },
  });
}

// معالجة كل الرسائل المجدولة المستحقّة الآن
export async function processScheduledMessages(): Promise<number> {
  const due = await db.whatsAppMessage.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    take: 100,
  });

  for (const m of due) {
    await dispatchMessage(m);
  }
  return due.length;
}
