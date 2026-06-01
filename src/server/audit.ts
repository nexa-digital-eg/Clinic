import "server-only";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// تسجيل نشاط المستخدم (مين عمل إيه) — يظهر في سجل النشاط بالشريط العلوي
export async function logActivity(type: string, detail?: string | null) {
  try {
    const session = await getSession();
    if (!session) return;
    await db.auditLog.create({
      data: {
        type,
        userId: session.id,
        userName: session.name,
        detail: detail ?? null,
      },
    });
  } catch {
    // لا نُفشل العملية الأساسية إذا فشل التسجيل
  }
}
