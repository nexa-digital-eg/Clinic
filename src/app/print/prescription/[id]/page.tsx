import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getClinicSettings } from "@/server/clinic";
import { ClinicHeader } from "@/components/clinic-header";
import { PrintButton } from "../../print-button";
import { formatDate, calcAge } from "@/lib/utils";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function PrintPrescription({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prescription, clinic, locale] = await Promise.all([
    db.prescription.findUnique({
      where: { id },
      include: { patient: true, items: true, doctor: { include: { user: true } } },
    }),
    getClinicSettings(),
    getLocale(),
  ]);
  if (!prescription) notFound();

  const age = calcAge(prescription.patient.birthDate);

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      <ClinicHeader clinic={clinic} />

      <div className="mt-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t("print.prescription", locale)}</h2>
          {prescription.doctor && (
            <p className="text-sm text-slate-500">{prescription.doctor.user.name}{prescription.doctor.specialty ? ` — ${prescription.doctor.specialty}` : ""}</p>
          )}
        </div>
        <div className="text-end text-sm text-slate-800">
          <p>{t("print.date", locale)}: {formatDate(prescription.createdAt, locale)}</p>
          <p>{t("print.patient", locale)}: {prescription.patient.firstName} {prescription.patient.lastName}</p>
          {age !== null && <p>{t("print.age", locale)}: {age} {t("common.years", locale)}</p>}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-2xl font-bold text-brand-700">℞</div>

      <ol className="mt-2 space-y-3">
        {prescription.items.map((it, i) => (
          <li key={it.id} className="border-b border-slate-200 pb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-black">{i + 1}.</span>
              <span className="text-lg font-bold text-black">{it.drugName}</span>
              {it.dose && <span className="text-sm font-medium text-black">{it.dose}</span>}
            </div>
            <div className="mr-6 text-sm font-medium text-black">
              {[it.frequency, it.duration].filter(Boolean).join(" — ")}
              {it.alternatives && <span className="block text-xs text-slate-700">{t("ai.alt", locale)}: {it.alternatives}</span>}
            </div>
          </li>
        ))}
      </ol>

      {prescription.notes && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-black">
          <span className="font-medium">{t("print.notes", locale)}: </span>{prescription.notes}
        </div>
      )}

      <div className="mt-12 flex justify-start">
        <div className="text-center">
          <div className="h-10 border-b border-slate-400" style={{ width: "12rem" }} />
          <p className="mt-1 text-xs text-slate-600">{t("print.doctorSign", locale)}</p>
        </div>
      </div>
    </div>
  );
}
