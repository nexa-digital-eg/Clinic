import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { Bell } from "lucide-react";
import { ReminderRow, GenerateButton, CreateReminderForm } from "./client";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function RemindersPage() {
  const [reminders, patients] = await Promise.all([
    db.reminder.findMany({
      orderBy: { remindAt: "asc" },
      take: 100,
      include: {
        patient: true,
        appointment: true,
      },
    }),
    db.patient.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const locale = await getLocale();

  const pending = reminders.filter((r) => r.status === "PENDING");
  const handled = reminders.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("reminders.title", locale)}</h1>
          <p className="text-sm text-slate-500">{t("reminders.subtitle", locale)}</p>
        </div>
        <GenerateButton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">{t("rem.pending", locale)}</h2>
              <Badge color="yellow">{pending.length}</Badge>
            </div>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Bell className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">{t("rem.noPending", locale)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  اضغط «توليد تذكيرات الحجوزات» لإنشائها تلقائياً
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.map((r) => (
                  <ReminderRow
                    key={r.id}
                    id={r.id}
                    type={r.type}
                    status={r.status}
                    message={r.message}
                    remindAt={r.remindAt.toISOString()}
                    patientName={`${r.patient.firstName} ${r.patient.lastName}`}
                    patientId={r.patientId}
                    appointmentId={r.appointmentId}
                  />
                ))}
              </div>
            )}
          </Card>

          {handled.length > 0 && (
            <Card>
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold text-slate-800">{t("rem.handled", locale)}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {handled.map((r) => (
                  <ReminderRow
                    key={r.id}
                    id={r.id}
                    type={r.type}
                    status={r.status}
                    message={r.message}
                    remindAt={r.remindAt.toISOString()}
                    patientName={`${r.patient.firstName} ${r.patient.lastName}`}
                    patientId={r.patientId}
                    appointmentId={r.appointmentId}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>

        <CreateReminderForm
          patients={patients.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            code: p.code,
          }))}
        />
      </div>
    </div>
  );
}
