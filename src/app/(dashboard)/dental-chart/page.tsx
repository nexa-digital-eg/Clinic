import { db } from "@/lib/db";
import { Card, Input } from "@/components/ui";
import { Search, Stethoscope } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export default async function DentalChartPicker({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const where: Prisma.PatientWhereInput = query
    ? {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { code: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const patients = await db.patient.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { _count: { select: { toothRecords: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">مخطط الأسنان</h1>
        <p className="text-sm text-slate-500">اختر مريضاً لفتح مخطط أسنانه</p>
      </div>

      <Card className="p-4">
        <form className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={query} placeholder="ابحث عن مريض..." className="pr-10" />
        </form>
      </Card>

      <Card>
        {patients.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">لا يوجد مرضى</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.map((p) => (
              <Link
                key={p.id}
                href={`/dental-chart/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.code} • {p.phone}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {p._count.toothRecords} سجل أسنان
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
