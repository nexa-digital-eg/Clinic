import { NextResponse } from "next/server";
import { processScheduledMessages } from "@/server/whatsapp";

// نقطة لتشغيل الرسائل المجدولة المستحقّة — تُستدعى من cron خارجي
// مثال (كل دقيقة): * * * * * curl -s https://YOUR_APP/api/whatsapp/dispatch
export async function GET() {
  const count = await processScheduledMessages();
  return NextResponse.json({ processed: count });
}

export async function POST() {
  const count = await processScheduledMessages();
  return NextResponse.json({ processed: count });
}
