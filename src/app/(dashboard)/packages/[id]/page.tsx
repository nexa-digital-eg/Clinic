import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SessionRow } from "./session-row";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function PatientPackageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pp = await db.patientPackage.findUnique({
    where: { id },
    include: {
      patient: true,
      package: true,
      sessions: { orderBy: { sessionNumber: "asc" } },
    },
  });

  if (!pp) notFound();

  const locale = await getLocale();
  const pct = Math.round((pp.usedSessions / pp.totalSessions) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/packages" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{pp.package.name}</h1>
          <Link href={`/patients/${pp.patientId}`} className="text-sm text-brand-600 hover:underline">
            {pp.patient.firstName} {pp.patient.lastName}
          </Link>
        </div>
        {pp.isActive ? <Badge color="green">{t("pkg.active", locale)}</Badge> : <Badge color="slate">{t("pkg.finished", locale)}</Badge>}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{t("pkg.progress", locale)}</p>
            <p className="text-2xl font-bold text-slate-800">
              {pp.usedSessions} / {pp.totalSessions} {t("pkg.session", locale)}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm text-slate-500">{t("pkg.packagePrice", locale)}</p>
            <p className="text-xl font-bold text-brand-700">{formatCurrency(pp.package.price, locale)}</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-800">{t("pkg.sessions", locale)}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {pp.sessions.map((s) => (
            <SessionRow
              key={s.id}
              id={s.id}
              patientPackageId={pp.id}
              sessionNumber={s.sessionNumber}
              scheduledAt={s.scheduledAt?.toISOString() ?? null}
              completed={!!s.completedAt}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
