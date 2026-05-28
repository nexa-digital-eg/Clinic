import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, Badge, Button, Input, Label, Textarea, Select, EmptyState } from "@/components/ui";
import { formatDate, formatDateTime, formatCurrency, calcAge } from "@/lib/utils";
import { addComplaint, addDiagnosis, addPayment } from "../actions";
import Link from "next/link";
import { ArrowRight, Phone, Mail, MapPin, Droplet } from "lucide-react";

const TABS = [
  { key: "overview", label: "نظرة عامة" },
  { key: "diagnoses", label: "التشخيصات" },
  { key: "prescriptions", label: "الروشتات" },
  { key: "appointments", label: "الحجوزات" },
  { key: "billing", label: "المدفوعات" },
  { key: "files", label: "الملفات" },
  { key: "complaints", label: "الشكاوي" },
  { key: "teeth", label: "الأسنان" },
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
            {patient.gender === "MALE" ? "ذكر" : patient.gender === "FEMALE" ? "أنثى" : ""}
            {age !== null && ` • ${age} سنة`}
          </p>
        </div>
        <Card className="px-5 py-3 text-center">
          <p className="text-xs text-slate-500">الرصيد</p>
          <p
            className={`text-lg font-bold ${patient.balance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(patient.balance)}
          </p>
        </Card>
      </div>

      {/* بطاقة المعلومات السريعة */}
      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <InfoItem icon={<Phone className="h-4 w-4" />} label="الهاتف" value={patient.phone} ltr />
        <InfoItem icon={<Mail className="h-4 w-4" />} label="البريد" value={patient.email ?? "—"} ltr />
        <InfoItem icon={<MapPin className="h-4 w-4" />} label="العنوان" value={patient.address ?? "—"} />
        <InfoItem icon={<Droplet className="h-4 w-4" />} label="فصيلة الدم" value={patient.bloodType ?? "—"} ltr />
      </Card>

      {/* التابات */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/patients/${patient.id}?tab=${t.key}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">الملخص الطبي</h3>
            <dl className="space-y-2 text-sm">
              <Row label="الحساسية" value={patient.allergies ?? "لا يوجد"} />
              <Row label="أمراض مزمنة" value={patient.chronicConditions ?? "لا يوجد"} />
              <Row label="ملاحظات" value={patient.notes ?? "—"} />
            </dl>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">إحصائيات سريعة</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <Stat label="التشخيصات" value={patient.diagnoses.length} />
              <Stat label="الروشتات" value={patient.prescriptions.length} />
              <Stat label="الحجوزات" value={patient.appointments.length} />
              <Stat label="الشكاوي" value={patient.complaints.length} />
            </div>
          </Card>
        </div>
      )}

      {tab === "diagnoses" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <h3 className="mb-3 font-semibold text-slate-800">إضافة تشخيص</h3>
            <form action={addDiagnosisBound} className="space-y-3">
              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="details">التفاصيل</Label>
                <Textarea id="details" name="details" rows={3} />
              </div>
              <Button type="submit" className="w-full">حفظ</Button>
            </form>
          </Card>
          <div className="space-y-3 lg:col-span-2">
            {patient.diagnoses.length === 0 ? (
              <EmptyState title="لا توجد تشخيصات" />
            ) : (
              patient.diagnoses.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{d.title}</p>
                    <span className="text-xs text-slate-400">{formatDate(d.createdAt)}</span>
                  </div>
                  {d.details && <p className="mt-1 text-sm text-slate-600">{d.details}</p>}
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "prescriptions" && (
        <div className="space-y-3">
          {patient.prescriptions.length === 0 ? (
            <EmptyState title="لا توجد روشتات" description="تُضاف الروشتات من المساعد الذكي (المرحلة 8)" />
          ) : (
            patient.prescriptions.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {p.doctor ? `د. ${p.doctor.user.name}` : "روشتة"}
                  </p>
                  <span className="text-xs text-slate-400">{formatDate(p.createdAt)}</span>
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
            <EmptyState title="لا توجد حجوزات" />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الموعد</th>
                  <th className="px-4 py-3 font-medium">الطبيب</th>
                  <th className="px-4 py-3 font-medium">السبب</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">{formatDateTime(a.startsAt)}</td>
                    <td className="px-4 py-3">د. {a.doctor.user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.reason ?? "—"}</td>
                    <td className="px-4 py-3"><AppointmentStatusBadge status={a.status} /></td>
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
            <h3 className="mb-3 font-semibold text-slate-800">تسجيل دفعة</h3>
            <form action={addPaymentBound} className="space-y-3">
              <div>
                <Label htmlFor="amount">المبلغ</Label>
                <Input id="amount" name="amount" type="number" step="0.01" dir="ltr" required />
              </div>
              <div>
                <Label htmlFor="method">طريقة الدفع</Label>
                <Select id="method" name="method" defaultValue="CASH">
                  <option value="CASH">نقدي</option>
                  <option value="CARD">بطاقة</option>
                  <option value="TRANSFER">تحويل</option>
                  <option value="OTHER">أخرى</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="note">ملاحظة</Label>
                <Input id="note" name="note" />
              </div>
              <Button type="submit" className="w-full">حفظ الدفعة</Button>
            </form>
          </Card>
          <div className="lg:col-span-2">
            <Card>
              {patient.payments.length === 0 ? (
                <EmptyState title="لا توجد مدفوعات" />
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">التاريخ</th>
                      <th className="px-4 py-3 font-medium">المبلغ</th>
                      <th className="px-4 py-3 font-medium">الطريقة</th>
                      <th className="px-4 py-3 font-medium">ملاحظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patient.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3">{methodLabel(p.method)}</td>
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
        <Card className="p-5">
          {patient.files.length === 0 ? (
            <EmptyState title="لا توجد ملفات" description="رفع الملفات (أشعة/صور/PDF) يُضاف لاحقاً" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-3">
                  <a href={f.url} target="_blank" className="text-sm text-brand-600 hover:underline">
                    {f.name}
                  </a>
                  <span className="text-xs text-slate-400">{formatDate(f.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "complaints" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <h3 className="mb-3 font-semibold text-slate-800">إضافة شكوى</h3>
            <form action={addComplaintBound} className="space-y-3">
              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="details">التفاصيل</Label>
                <Textarea id="details" name="details" rows={3} />
              </div>
              <Button type="submit" className="w-full">حفظ</Button>
            </form>
          </Card>
          <div className="space-y-3 lg:col-span-2">
            {patient.complaints.length === 0 ? (
              <EmptyState title="لا توجد شكاوي" />
            ) : (
              patient.complaints.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{c.title}</p>
                    <Badge color={c.status === "open" ? "yellow" : "green"}>
                      {c.status === "open" ? "مفتوحة" : "محلولة"}
                    </Badge>
                  </div>
                  {c.details && <p className="mt-1 text-sm text-slate-600">{c.details}</p>}
                  <p className="mt-2 text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "teeth" && (
        <Card>
          {patient.toothRecords.length === 0 ? (
            <EmptyState title="لا توجد سجلات أسنان" description="تُضاف من مخطط الأسنان (المرحلة 3)" />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">السن</th>
                  <th className="px-4 py-3 font-medium">الجزء</th>
                  <th className="px-4 py-3 font-medium">الإجراء</th>
                  <th className="px-4 py-3 font-medium">السعر</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.toothRecords.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-mono">{t.toothNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{t.surface ?? "—"}</td>
                    <td className="px-4 py-3">{t.procedure?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatCurrency(t.price)}</td>
                    <td className="px-4 py-3">
                      <Badge color={t.status === "done" ? "green" : "yellow"}>
                        {t.status === "done" ? "تم" : "مخطط"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
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

function methodLabel(m: string) {
  return { CASH: "نقدي", CARD: "بطاقة", TRANSFER: "تحويل", OTHER: "أخرى" }[m] ?? m;
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: "slate" | "green" | "yellow" | "red" | "blue" }> = {
    PENDING: { label: "منتظر", color: "yellow" },
    CONFIRMED: { label: "مؤكد", color: "blue" },
    COMPLETED: { label: "تم", color: "green" },
    CANCELLED: { label: "ملغي", color: "red" },
    NO_SHOW: { label: "لم يحضر", color: "slate" },
  };
  const s = map[status] ?? { label: status, color: "slate" as const };
  return <Badge color={s.color}>{s.label}</Badge>;
}
