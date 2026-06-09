import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Badge, Button, Input, Label, Textarea, Select, EmptyState } from "@/components/ui";
import { formatDate, formatDateTime, formatCurrency, calcAge } from "@/lib/utils";
import { addComplaint, addDiagnosis, addPayment } from "../actions";
import Link from "next/link";
import { ArrowRight, Phone, Mail, MapPin, Droplet, Pencil, AlertTriangle, HeartPulse } from "lucide-react";
import { DeletePatientButton } from "./patient-actions";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
import { PatientFiles } from "./patient-files";
import { PrescriptionBuilder } from "../../assistant/[patientId]/client";

const TABS = [
  { key: "overview", labelKey: "tab.overview" },
  { key: "diagnoses", labelKey: "tab.diagnoses" },
  { key: "prescriptions", labelKey: "tab.prescriptions" },
  { key: "appointments", labelKey: "tab.appointments" },
  { key: "billing", labelKey: "tab.billing" },
  { key: "files", labelKey: "tab.files" },
  { key: "complaints", labelKey: "tab.complaints" },
  { key: "teeth", labelKey: "tab.teeth" },
];

export default async function PatientProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const locale = await getLocale();

  const patient = await db.patient.findUnique({
    where: { id },
    include: {
      diagnoses: { orderBy: { createdAt: "desc" }, include: { doctor: { include: { user: true } } } },
      prescriptions: {
        orderBy: { createdAt: "desc" },
        include: { items: true, doctor: { include: { user: true } } },
      },
      appointments: {
        orderBy: { startsAt: "desc" },
        include: { doctor: { include: { user: true } } },
      },
      payments: { orderBy: { createdAt: "desc" }, include: { invoice: true } },
      files: { orderBy: { createdAt: "desc" } },
      complaints: { orderBy: { createdAt: "desc" } },
      toothRecords: {
        orderBy: { createdAt: "desc" },
        include: { procedure: true },
      },
    },
  });

  if (!patient) notFound();

  // أسماء الأدوية للاقتراح التلقائي في الروشتة
  const medications =
    tab === "prescriptions"
      ? (await db.medication.findMany({ orderBy: { name: "asc" }, select: { name: true } })).map(
          (m) => m.name,
        )
      : [];

  const age = calcAge(patient.birthDate);
  const addComplaintBound = addComplaint.bind(null, patient.id);
  const addDiagnosisBound = addDiagnosis.bind(null, patient.id);
  const addPaymentBound = addPayment.bind(null, patient.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/patients"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">
              {patient.firstName} {patient.lastName}
            </h1>
            <Badge color="blue">{patient.code}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {patient.gender === "MALE" ? t("form.male", locale) : patient.gender === "FEMALE" ? t("form.female", locale) : ""}
            {age !== null && ` • ${age} ${t("common.years", locale)}`}
          </p>
        </div>
        <Card className="px-5 py-3 text-center">
          <p className="text-xs text-slate-500">{t("profile.balance", locale)}</p>
          <p
            className={`text-lg font-bold ${patient.balance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(patient.balance, locale)}
          </p>
        </Card>
        <div className="flex items-center gap-1">
          <Link
            href={`/patients/${patient.id}/edit`}
            title={t("common.edit", locale)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600"
          >
            <Pencil className="h-5 w-5" />
          </Link>
          <DeletePatientButton
            id={patient.id}
            name={`${patient.firstName} ${patient.lastName}`}
          />
        </div>
      </div>

      {/* تنبيه طبي بارز (حساسية / أمراض مزمنة) — أمان للطبيب قبل أي إجراء */}
      {(patient.allergies || patient.chronicConditions) && (
        <div className="flex flex-wrap gap-3">
          {patient.allergies && (
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 min-w-[260px]">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">{t("alert.allergies", locale)}</p>
                <p className="text-sm font-medium text-red-800">{patient.allergies}</p>
              </div>
            </div>
          )}
          {patient.chronicConditions && (
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 min-w-[260px]">
              <HeartPulse className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600">{t("alert.chronic", locale)}</p>
                <p className="text-sm font-medium text-amber-800">{patient.chronicConditions}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* بطاقة المعلومات السريعة */}
      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <InfoItem icon={<Phone className="h-4 w-4" />} label={t("form.phone", locale)} value={patient.phone} ltr />
        <InfoItem icon={<Mail className="h-4 w-4" />} label={t("form.email", locale)} value={patient.email ?? "—"} ltr />
        <InfoItem icon={<MapPin className="h-4 w-4" />} label={t("form.address", locale)} value={patient.address ?? "—"} />
        <InfoItem icon={<Droplet className="h-4 w-4" />} label={t("form.bloodType", locale)} value={patient.bloodType ?? "—"} ltr />
      </Card>

      {/* التابات */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tb) => (
          <Link
            key={tb.key}
            href={`/patients/${patient.id}?tab=${tb.key}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb.key
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t(tb.labelKey, locale)}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">{t("profile.medicalSummary", locale)}</h3>
            <dl className="space-y-2 text-sm">
              <Row label={t("form.allergies", locale)} value={patient.allergies ?? t("profile.none", locale)} />
              <Row label={t("form.chronic", locale)} value={patient.chronicConditions ?? t("profile.none", locale)} />
              <Row label={t("form.notes", locale)} value={patient.notes ?? "—"} />
            </dl>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">{t("profile.quickStats", locale)}</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <Stat label={t("tab.diagnoses", locale)} value={patient.diagnoses.length} />
              <Stat label={t("tab.prescriptions", locale)} value={patient.prescriptions.length} />
              <Stat label={t("tab.appointments", locale)} value={patient.appointments.length} />
              <Stat label={t("tab.complaints", locale)} value={patient.complaints.length} />
            </div>
          </Card>
        </div>
      )}

      {tab === "diagnoses" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <h3 className="mb-3 font-semibold text-slate-800">{t("profile.addDiagnosis", locale)}</h3>
            <form action={addDiagnosisBound} className="space-y-3">
              <div>
                <Label htmlFor="title">{t("form.title", locale)}</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="details">{t("form.details", locale)}</Label>
                <Textarea id="details" name="details" rows={3} />
              </div>
              <Button type="submit" className="w-full">{t("common.save", locale)}</Button>
            </form>
          </Card>
          <div className="space-y-3 lg:col-span-2">
            {patient.diagnoses.length === 0 ? (
              <EmptyState title={t("profile.noDiagnoses", locale)} />
            ) : (
              patient.diagnoses.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{d.title}</p>
                    <span className="text-xs text-slate-400">{formatDate(d.createdAt, locale)}</span>
                  </div>
                  {d.details && <p className="mt-1 text-sm text-slate-600">{d.details}</p>}
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "prescriptions" && (
        <div className="space-y-4">
          <PrescriptionBuilder patientId={patient.id} medications={medications} />
          {patient.prescriptions.length === 0 ? (
            <EmptyState title={t("profile.noPrescriptions", locale)} />
          ) : (
            patient.prescriptions.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {p.doctor ? `${p.doctor.user.name}` : t("rx.label", locale)}
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/print/prescription/${p.id}`}
                      target="_blank"
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      طباعة / PDF
                    </a>
                    <span className="text-xs text-slate-400">{formatDate(p.createdAt, locale)}</span>
                  </div>
                </div>
                <ul className="space-y-1 text-sm">
                  {p.items.map((it) => (
                    <li key={it.id} className="flex justify-between border-b border-slate-50 py-1">
                      <span className="font-medium">{it.drugName}</span>
                      <span className="text-slate-500">{[it.dose, it.frequency, it.duration].filter(Boolean).join(" - ")}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "appointments" && (
        <Card>
          {patient.appointments.length === 0 ? (
            <EmptyState title={t("profile.noAppointments", locale)} />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-start text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("col.datetime", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.doctor", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.reason", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.status", locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">{formatDateTime(a.startsAt, locale)}</td>
                    <td className="px-4 py-3">{a.doctor.user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.reason ?? "—"}</td>
                    <td className="px-4 py-3"><AppointmentStatusBadge status={a.status} locale={locale} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "billing" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <h3 className="mb-3 font-semibold text-slate-800">{t("profile.recordPayment", locale)}</h3>
            <form action={addPaymentBound} className="space-y-3">
              <div>
                <Label htmlFor="amount">{t("form.amount", locale)}</Label>
                <Input id="amount" name="amount" type="number" step="0.01" dir="ltr" required />
              </div>
              <div>
                <Label htmlFor="method">{t("form.method", locale)}</Label>
                <Select id="method" name="method" defaultValue="CASH">
                  <option value="CASH">{t("method.CASH", locale)}</option>
                  <option value="CARD">{t("method.CARD", locale)}</option>
                  <option value="TRANSFER">{t("method.TRANSFER", locale)}</option>
                  <option value="OTHER">{t("method.OTHER", locale)}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="note">{t("form.note", locale)}</Label>
                <Input id="note" name="note" />
              </div>
              <Button type="submit" className="w-full">{t("common.save", locale)}</Button>
            </form>
          </Card>
          <div className="lg:col-span-2">
            <Card>
              {patient.payments.length === 0 ? (
                <EmptyState title={t("profile.noPayments", locale)} />
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-start text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t("col.date", locale)}</th>
                      <th className="px-4 py-3 font-medium">{t("col.amount", locale)}</th>
                      <th className="px-4 py-3 font-medium">{t("col.method", locale)}</th>
                      <th className="px-4 py-3 font-medium">{t("form.note", locale)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patient.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt, locale)}</td>
                        <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(p.amount, locale)}</td>
                        <td className="px-4 py-3">{t(`method.${p.method}`, locale)}</td>
                        <td className="px-4 py-3 text-slate-600">{p.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "files" && (
        <PatientFiles
          patientId={patient.id}
          files={patient.files.map((f) => ({
            id: f.id,
            name: f.name,
            url: f.url,
            mimeType: f.mimeType,
            category: f.category,
            createdAt: f.createdAt.toISOString(),
          }))}
        />
      )}

      {tab === "complaints" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <h3 className="mb-3 font-semibold text-slate-800">{t("profile.addComplaint", locale)}</h3>
            <form action={addComplaintBound} className="space-y-3">
              <div>
                <Label htmlFor="title">{t("form.title", locale)}</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="details">{t("form.details", locale)}</Label>
                <Textarea id="details" name="details" rows={3} />
              </div>
              <Button type="submit" className="w-full">{t("common.save", locale)}</Button>
            </form>
          </Card>
          <div className="space-y-3 lg:col-span-2">
            {patient.complaints.length === 0 ? (
              <EmptyState title={t("profile.noComplaints", locale)} />
            ) : (
              patient.complaints.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{c.title}</p>
                    <Badge color={c.status === "open" ? "yellow" : "green"}>
                      {c.status === "open" ? t("complaint.open", locale) : t("complaint.resolved", locale)}
                    </Badge>
                  </div>
                  {c.details && <p className="mt-1 text-sm text-slate-600">{c.details}</p>}
                  <p className="mt-2 text-xs text-slate-400">{formatDate(c.createdAt, locale)}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "teeth" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href={`/dental-chart/${patient.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t("profile.openDental", locale)}
            </Link>
          </div>
          <Card>
          {patient.toothRecords.length === 0 ? (
            <EmptyState title={t("profile.noTeeth", locale)} />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-start text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("col.tooth", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.surface", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.procedure", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.price", locale)}</th>
                  <th className="px-4 py-3 font-medium">{t("col.status", locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.toothRecords.map((tooth) => (
                  <tr key={tooth.id}>
                    <td className="px-4 py-3 font-mono">{tooth.toothNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{tooth.surface ?? "—"}</td>
                    <td className="px-4 py-3">{tooth.procedure?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatCurrency(tooth.price, locale)}</td>
                    <td className="px-4 py-3">
                      <Badge color={tooth.status === "done" ? "green" : "yellow"}>
                        {tooth.status === "done" ? t("tooth.done", locale) : t("tooth.planned", locale)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value, ltr }: { icon: React.ReactNode; label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700" dir={ltr ? "ltr" : undefined}>{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function AppointmentStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const color: Record<string, "slate" | "green" | "yellow" | "red" | "blue"> = {
    PENDING: "yellow",
    CONFIRMED: "blue",
    COMPLETED: "green",
    CANCELLED: "red",
    NO_SHOW: "slate",
  };
  return <Badge color={color[status] ?? "slate"}>{t(`apptStatus.${status}`, locale)}</Badge>;
}
