import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { ListOrdered } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { AddToQueueForm, QueueRow } from "./client";

export default async function QueuePage() {
  const [entries, doctors] = await Promise.all([
    db.queueEntry.findMany({
      where: { status: { in: ["WAITING", "IN_PROGRESS"] } },
      orderBy: { createdAt: "asc" },
      include: { patient: true, doctor: { include: { user: true } } },
    }),
    db.doctor.findMany({ include: { user: true } }),
  ]);
  const locale = await getLocale();

  const waiting = entries.filter((e) => e.status === "WAITING");
  const inProgress = entries.filter((e) => e.status === "IN_PROGRESS");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("queue.title", locale)}</h1>
        <p className="text-sm text-slate-500">{t("queue.subtitle", locale)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {inProgress.length > 0 && (
            <Card>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold text-slate-800">{t("queue.inProgress", locale)}</h2>
                <Badge color="green">{inProgress.length}</Badge>
              </div>
              <div className="divide-y divide-slate-100">
                {inProgress.map((e) => (
                  <QueueRow
                    key={e.id}
                    id={e.id}
                    position={null}
                    name={e.name}
                    phone={e.phone}
                    reason={e.reason}
                    status={e.status}
                    patientId={e.patientId}
                    patientCode={e.patient?.code ?? null}
                    doctorName={e.doctor ? e.doctor.user.name : null}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">{t("queue.waiting", locale)}</h2>
              <Badge color="yellow">{waiting.length}</Badge>
            </div>
            {waiting.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ListOrdered className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">{t("queue.empty", locale)}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waiting.map((e, i) => (
                  <QueueRow
                    key={e.id}
                    id={e.id}
                    position={i + 1}
                    name={e.name}
                    phone={e.phone}
                    reason={e.reason}
                    status={e.status}
                    patientId={e.patientId}
                    patientCode={e.patient?.code ?? null}
                    doctorName={e.doctor ? e.doctor.user.name : null}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <AddToQueueForm
          doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))}
        />
      </div>
    </div>
  );
}
