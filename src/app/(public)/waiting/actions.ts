"use server";

import { db } from "@/lib/db";

export interface WaitingEntry {
  pos: number | null; // رقم الدور (null أثناء الكشف)
  isMe: boolean;
  label: string; // اسم مموّه للآخرين، أو اسم المريض نفسه
  serving: boolean; // جاري الكشف الآن
}

export interface WaitingStatus {
  found: boolean;
  myPos: number | null; // ترتيب المريض في الانتظار
  ahead: number; // كم واحد أمامه
  total: number; // إجمالي المنتظرين
  beingServed: number; // عدد من يتم الكشف عليهم الآن
  done: boolean; // تم الكشف / غير موجود في القائمة النشطة
  entries: WaitingEntry[];
}

// تمويه الاسم: أول حرف من كل كلمة + نقاط — لا يُسرّب الاسم الكامل
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] ?? "") + "••••").join(" ");
}

// حالة الانتظار لمريض عبر رقم هاتفه — صفحة عامة بدون تسجيل دخول
export async function getWaitingStatus(phone: string): Promise<WaitingStatus> {
  const empty: WaitingStatus = {
    found: false,
    myPos: null,
    ahead: 0,
    total: 0,
    beingServed: 0,
    done: false,
    entries: [],
  };

  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 6) return empty;

  const active = await db.queueEntry.findMany({
    where: { status: { in: ["WAITING", "IN_PROGRESS"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, phone: true, status: true },
  });

  const waiting = active.filter((e) => e.status === "WAITING");
  const serving = active.filter((e) => e.status === "IN_PROGRESS");

  // طابق رقم الهاتف (يقبل تطابق جزئي للأرقام بصيغ مختلفة)
  const norm = (p: string) => p.replace(/\D/g, "");
  const target = norm(clean);
  const myWaitingIdx = waiting.findIndex(
    (e) => norm(e.phone) === target || norm(e.phone).endsWith(target) || target.endsWith(norm(e.phone)),
  );
  const amServed = serving.some(
    (e) => norm(e.phone) === target || norm(e.phone).endsWith(target) || target.endsWith(norm(e.phone)),
  );

  const found = myWaitingIdx !== -1 || amServed;
  const myPos = myWaitingIdx !== -1 ? myWaitingIdx + 1 : null;

  // ابنِ قائمة معروضة: الكشف الآن أولاً ثم المنتظرون — بأسماء مموّهة عدا المريض نفسه
  const entries: WaitingEntry[] = [];
  for (const e of serving) {
    const mine =
      amServed &&
      (norm(e.phone) === target || norm(e.phone).endsWith(target) || target.endsWith(norm(e.phone)));
    entries.push({ pos: null, isMe: mine, label: mine ? e.name : maskName(e.name), serving: true });
  }
  waiting.forEach((e, i) => {
    const mine = i === myWaitingIdx;
    entries.push({ pos: i + 1, isMe: mine, label: mine ? e.name : maskName(e.name), serving: false });
  });

  return {
    found,
    myPos,
    ahead: myPos !== null ? myPos - 1 : 0,
    total: waiting.length,
    beingServed: serving.length,
    done: !found,
    entries,
  };
}
