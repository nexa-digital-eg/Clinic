import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AssistantChat, ReportPanel, VoicePanel, PrescriptionBuilder } from "./client";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function AssistantWorkspace({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const locale = await getLocale();

  const [patient, reports, meds] = await Promise.all([
    db.patient.findUnique({ where: { id: patientId } }),
    db.medicalReport.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.medication.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  if (!patient) notFound();
  const medications = meds.map((m) => m.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/assistant" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">
              المساعد الذكي — {patient.firstName} {patient.lastName}
            </h1>
            <Badge color="blue">{patient.code}</Badge>
          </div>
          <p className="text-sm text-slate-500">{t("ai.knowsFile", locale)}</p>
        </div>
        <Link
          href={`/patients/${patient.id}`}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          {t("ai.patientFile", locale)}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* الدردشة */}
        <div className="lg:col-span-2">
          <AssistantChat patientId={patient.id} />
        </div>

        {/* الأدوات الجانبية */}
        <div className="space-y-6">
          <VoicePanel patientId={patient.id} />
          <ReportPanel patientId={patient.id} />
        </div>
      </div>

      {/* بناء روشتة */}
      <PrescriptionBuilder patientId={patient.id} medications={medications} />

      {/* التقارير الأخيرة */}
      <Card>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-800">{t("ai.reports", locale)}</h2>
        </div>
        {reports.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t("ai.noReports", locale)}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <details key={r.id} className="px-5 py-3">
                <summary className="flex cursor-pointer items-center justify-between">
                  <span className="font-medium text-slate-800">{r.title}</span>
                  <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                </summary>
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  {r.content}
                </pre>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
