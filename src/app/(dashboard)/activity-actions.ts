"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ActivityItem = {
  id: string;
  type: string;
  userName: string;
  detail: string | null;
  createdAt: string;
};

// سجل النشاط — للأدمن فقط (يرى كل أفعال المستخدمين)
export async function getActivity(): Promise<ActivityItem[]> {
  const session = await getSession();
  if (!session) return [];
  const me = await db.user.findUnique({ where: { id: session.id }, select: { role: true } });
  if (me?.role !== "ADMIN") return [];

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return logs.map((l) => ({
    id: l.id,
    type: l.type,
    userName: l.userName,
    detail: l.detail,
    createdAt: l.createdAt.toISOString(),
  }));
}
