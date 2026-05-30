import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Badge, LinkButton } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ToothChart } from "./tooth-chart";

export default async function PatientDentalChart({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const locale = await getLocale();

  const [patient, procedures, records, openInvoice] = await Promise.all([
    db.patient.findUnique({ where: { id: patientId } }),
    db.procedure.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.toothRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      include: { procedure: true },
    }),
    db.invoice.findFirst({
      where: { patientId, status: { in: ["OPEN", "PARTIAL"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dental-chart" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">
              {t("dental.title", locale)}: {patient.firstName} {patient.lastName}
            </h1>
            <Badge color="blue">{patient.code}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {t("dent.openChartDesc", locale)}
          </p>
        </div>
        <LinkButton href={`/patients/${patient.id}`} variant="secondary">
          {t("dent.patientFile", locale)}
        </LinkButton>
      </div>

      {openInvoice && (
        <Link href={`/billing/${openInvoice.id}`}>
          <Card className="flex items-center justify-between bg-brand-50/50 p-4 transition-shadow hover:shadow-md">
            <div>
              <p className="text-sm text-slate-600">{t("dent.currentInvoice", locale)}</p>
              <p className="font-mono text-xs text-slate-400">{openInvoice.number}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500">{t("col.total", locale)}</p>
              <p className="text-xl font-bold text-brand-700">
                {formatCurrency(openInvoice.total)}
              </p>
            </div>
          </Card>
        </Link>
      )}

      <ToothChart
        patientId={patient.id}
        procedures={procedures.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        records={records.map((r) => ({
          id: r.id,
          toothNumber: r.toothNumber,
          surface: r.surface,
          procedureName: r.procedure?.name ?? null,
          price: r.price,
          status: r.status,
        }))}
      />
    </div>
  );
}
