import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { MessageCircle, CheckCheck, AlertCircle } from "lucide-react";
import { ComposeForm, MessageActions, RunScheduledButton } from "./client";
import type { Prisma } from "@prisma/client";

const STATUS_META: Record<
  string,
  { label: string; color: "slate" | "green" | "yellow" | "red" | "blue" }
> = {
  SCHEDULED: { label: "مجدولة", color: "yellow" },
  SENDING: { label: "جارٍ الإرسال", color: "blue" },
  SENT: { label: "أُرسلت", color: "blue" },
  DELIVERED: { label: "سُلّمت", color: "green" },
  READ: { label: "قُرئت", color: "green" },
  FAILED: { label: "فشلت", color: "red" },
};

export default async function WhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const configured = isWhatsAppConfigured();

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
    { key: "", label: "الكل" },
    { key: "SCHEDULED", label: "مجدولة" },
    { key: "SENT", label: "مُرسلة" },
    { key: "DELIVERED", label: "مُسلّمة" },
    { key: "READ", label: "مقروءة" },
    { key: "FAILED", label: "فاشلة" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">واتساب</h1>
          <p className="text-sm text-slate-500">إرسال وجدولة الرسائل ومتابعة حالتها</p>
        </div>
        <RunScheduledButton count={scheduledCount} />
      </div>

      {/* حالة الاتصال */}
      {configured ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCheck className="h-5 w-5" />
          متصل بـ WhatsApp Cloud API — الإرسال حقيقي.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertCircle className="h-5 w-5" />
          وضع المحاكاة: لا توجد مفاتيح WhatsApp. الرسائل تُسجَّل وتُعلَّم كمُرسلة دون إرسال فعلي. أضف
          <code className="mx-1 rounded bg-yellow-100 px-1">WHATSAPP_TOKEN</code> و
          <code className="mx-1 rounded bg-yellow-100 px-1">WHATSAPP_PHONE_NUMBER_ID</code>
          لتفعيل الإرسال الحقيقي.
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
                <p className="text-sm font-medium text-slate-600">لا توجد رسائل</p>
                <p className="mt-1 text-xs text-slate-400">ابدأ بإرسال أول رسالة من النموذج</p>
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
                            <Badge color={meta.color}>{meta.label}</Badge>
                            {m.repeatEvery && <Badge color="slate">تكرار: {m.repeatEvery}</Badge>}
                          </div>
                          {m.body && <p className="mt-1 truncate text-sm text-slate-600">{m.body}</p>}
                          {m.mediaUrl && (
                            <p className="mt-0.5 text-xs text-brand-600">
                              📎 مرفق ({m.mediaType})
                            </p>
                          )}
                          {m.error && <p className="mt-0.5 text-xs text-red-500">{m.error}</p>}
                          <p className="mt-0.5 text-xs text-slate-400">
                            {m.scheduledAt
                              ? `مجدولة: ${m.scheduledAt.toLocaleString("ar-EG")}`
                              : m.sentAt
                                ? `أُرسلت: ${m.sentAt.toLocaleString("ar-EG")}`
                                : m.createdAt.toLocaleString("ar-EG")}
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
