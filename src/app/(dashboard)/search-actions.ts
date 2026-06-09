"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export interface QuickSearchResult {
  id: string;
  name: string;
  phone: string;
  code: string;
}

// بحث سريع عن مريض بالاسم / الهاتف / الكود (يُستخدم من الهيدر)
export async function quickSearchPatients(query: string): Promise<QuickSearchResult[]> {
  const session = await getSession();
  if (!session) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  const patients = await db.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { code: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, phone: true, code: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return patients.map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    phone: p.phone,
    code: p.code,
  }));
}
