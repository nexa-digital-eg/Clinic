import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { WhatsAppStatus } from "@prisma/client";

// التحقق من الـ webhook عند الإعداد في Meta
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

const STATUS_MAP: Record<string, WhatsAppStatus> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
};

// استقبال تحديثات حالة الرسائل
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const statuses = change?.value?.statuses ?? [];
        for (const s of statuses) {
          const externalId = s?.id as string | undefined;
          const status = STATUS_MAP[s?.status as string];
          if (!externalId || !status) continue;
          await db.whatsAppMessage.updateMany({
            where: { externalId },
            data: {
              status,
              error: s?.errors?.[0]?.title ?? null,
            },
          });
        }
      }
    }
  } catch {
    // تجاهل الأخطاء حتى لا يعيد Meta الإرسال بلا داعٍ
  }
  return NextResponse.json({ received: true });
}
