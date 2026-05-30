import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { MessageCircle, CheckCheck, AlertCircle } from "lucide-react";
import { ComposeForm, MessageActions, RunScheduledButton } from "./client";
import type { Prisma } from "@prisma/client";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

const STATUS_META: Record<
  string,
  { color: "slate" | "green" | "yellow" | "red" | "blue" }
> = {
  SCHEDULED: { color: "yellow" },
  SENDING: { color: "blue" },
  SENT: { color: "blue" },
  DELIVERED: { color: "green" },
  READ: { color: "green" },
  FAILED: { color: "red" },
};

export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const configured = isWhatsAppConfigured();
  const locale = await getLocale();

  const where: Prisma.WhatsAppMessageWhereInput =
    status && STATUS_META[status]
      ? { status: status as Prisma.WhatsAppMessageWhereInput["status"] }
      : {};

  const [messages, patients, scheduledCount] = await Promise.all([
    db.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { patient: true },
    }),
    db.patient.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.whatsAppMessage.count({ where: { status: "SCHEDULED" } }),
  ]);

  const filters = [
    { key: "", label: t("common.all", locale) },
    { key: "SCHEDULED", label: t("waStatus.SCHEDULED", locale) },
    { key: "SENT", label: t("waStatus.SENT", locale) },
    { key: "DELIVERED", label: t("waStatus.DELIVERED", locale) },
    { key: "READ", label: t("waStatus.READ", locale) },
    { key: "FAILED", label: t("waStatus.FAILED", locale) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("whatsapp.title", locale)}</h1>
          <p className="text-sm text-slate-500">{t("whatsapp.subtitle", locale)}</p>
        </div>
        <RunScheduledButton count={scheduledCount} />
      </div>

      {/* حالة الاتصال */}
      {configured ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCheck className="h-5 w-5" />
          {t("wa.connected", locale)}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertCircle className="h-5 w-5" />
          {t("wa.simulation", locale)}
          <code className="mx-1 rounded bg-yellow-100 px-1">WHATSAPP_TOKEN</code>
          <code className="mx-1 rounded bg-yellow-100 px-1">WHATSAPP_PHONE_NUMBER_ID</code>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* قائمة الرسائل */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <a
                key={f.key}
                href={f.key ? `/whatsapp?status=${f.key}` : "/whatsapp"}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  (status ?? "") === f.key
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </a>
            ))}
          </div>

          <Card>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">{t("wa.noMessages", locale)}</p>
                <p className="mt-1 text-xs text-slate-400">{t("wa.newMessage", locale)}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {messages.map((m) => {
                  const meta = STATUS_META[m.status];
                  return (
                    <div key={m.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800" dir="ltr">
                              {m.toPhone}
                            </span>
                            {m.patient && (
                              <span className="text-xs text-slate-400">
                                {m.patient.firstName} {m.patient.lastName}
                              </span>
                            )}
                            <Badge color={meta.color}>{t(`waStatus.${m.status}`, locale)}</Badge>
                            {m.repeatEvery && (
                              <Badge color="slate">
                                {t("wa.repeat", locale)}: {m.repeatEvery}
                              </Badge>
                            )}
                          </div>
                          {m.body && <p className="mt-1 truncate text-sm text-slate-600">{m.body}</p>}
                          {m.mediaUrl && (
                            <p className="mt-0.5 text-xs text-brand-600">
                              📎 {t("wa.attachment", locale)} ({m.mediaType})
                            </p>
                          )}
                          {m.error && <p className="mt-0.5 text-xs text-red-500">{m.error}</p>}
                          <p className="mt-0.5 text-xs text-slate-400">
                            {m.scheduledAt
                              ? `${t("waStatus.SCHEDULED", locale)}: ${m.scheduledAt.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}`
                              : m.sentAt
                                ? `${t("waStatus.SENT", locale)}: ${m.sentAt.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}`
                                : m.createdAt.toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}
                          </p>
                        </div>
                        <MessageActions id={m.id} status={m.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* نموذج الإرسال */}
        <ComposeForm
          patients={patients.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            phone: p.phone,
          }))}
        />
      </div>
    </div>
  );
}
