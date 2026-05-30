import { db } from "@/lib/db";
import { Card, Input, Badge } from "@/components/ui";
import { isAIConfigured, aiProviderName } from "@/lib/ai";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { Search, Brain, CheckCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { DeleteTemplateButton } from "./client";

export default async function AssistantPicker({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
  const configured = isAIConfigured();
  const locale = await getLocale();

  const where: Prisma.PatientWhereInput = query
    ? {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { code: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [patients, templates] = await Promise.all([
    db.patient.findMany({ where, orderBy: { createdAt: "desc" }, take: 30 }),
    db.prescriptionTemplate.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("assistant.title", locale)}</h1>
        <p className="text-sm text-slate-500">{t("assistant.subtitle", locale)}</p>
      </div>

      {configured ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCheck className="h-5 w-5" />
          متصل بـ {aiProviderName()} — ردود حقيقية.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertCircle className="h-5 w-5" />
          وضع المحاكاة: أضف
          <code className="mx-1 rounded bg-yellow-100 px-1">ANTHROPIC_API_KEY</code>
          أو
          <code className="mx-1 rounded bg-yellow-100 px-1">GEMINI_API_KEY</code>
          في .env لتفعيل الردود الحقيقية.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4">
            <form className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input name="q" defaultValue={query} placeholder={t("dental.searchPatient", locale)} className="pr-10" />
            </form>
          </Card>

          <Card>
            {patients.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">لا يوجد مرضى</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <Link
                    key={p.id}
                    href={`/assistant/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{p.code} • {p.phone}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* نماذج الروشتات المحفوظة */}
        <Card>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">نماذج الروشتات</h2>
          </div>
          {templates.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-slate-400">
              لا توجد نماذج محفوظة بعد
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {templates.map((t) => {
                const items = Array.isArray(t.body) ? t.body : [];
                return (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{items.length} دواء</p>
                    </div>
                    <DeleteTemplateButton id={t.id} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
