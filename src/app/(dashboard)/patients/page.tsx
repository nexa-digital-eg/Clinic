import { db } from "@/lib/db";
import { Card, Input, LinkButton, Badge } from "@/components/ui";
import { formatDate, calcAge } from "@/lib/utils";
import { Plus, Search, UserRound } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
  const locale = await getLocale();

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
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("patients.title", locale)}</h1>
          <p className="text-sm text-slate-500">{t("patients.subtitle", locale)}</p>
        </div>
        <LinkButton href="/patients/new">
          <Plus className="h-4 w-4" />
          {t("patients.new", locale)}
        </LinkButton>
      </div>

      <Card className="p-4">
        <form className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            defaultValue={query}
            placeholder={t("patients.searchPlaceholder", locale)}
            className="pr-10"
          />
        </form>
      </Card>

      <Card>
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserRound className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              {query ? "لا توجد نتائج" : "لا يوجد مرضى بعد"}
            </p>
            {!query && (
              <p className="mt-1 text-xs text-slate-400">
                ابدأ بإضافة أول مريض
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الكود</th>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الهاتف</th>
                  <th className="px-4 py-3 font-medium">العمر</th>
                  <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
                  <th className="px-4 py-3 font-medium">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const age = calcAge(p.birthDate);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/patients/${p.id}`}
                          className="font-mono text-xs text-brand-600 hover:underline"
                        >
                          {p.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/patients/${p.id}`}
                          className="font-medium text-slate-800 hover:text-brand-600"
                        >
                          {p.firstName} {p.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600" dir="ltr">
                        {p.phone}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {age !== null ? `${age} سنة` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={p.balance >= 0 ? "green" : "red"}>
                          {p.balance.toLocaleString("ar-EG")} ج.م
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
