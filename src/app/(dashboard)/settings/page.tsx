import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClinicSettings } from "@/server/clinic";
import { Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ClinicForm,
  ProcedureForm,
  ProcedureRow,
  BranchForm,
  BranchToggle,
  StaffForm,
  StaffToggle,
} from "./client";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

const TABS = [
  { key: "clinic", labelKey: "settings.tabClinic" },
  { key: "procedures", labelKey: "settings.tabProcedures" },
  { key: "branches", labelKey: "settings.tabBranches" },
  { key: "staff", labelKey: "settings.tabStaff" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير",
  DOCTOR: "طبيب",
  RECEPTIONIST: "سكرتارية",
  PATIENT: "مريض",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-medium text-slate-600">هذه الصفحة متاحة للمدير فقط</p>
      </Card>
    );
  }

  const { tab = "clinic" } = await searchParams;
  const locale = await getLocale();

  const [clinic, procedures, branches, staff] = await Promise.all([
    getClinicSettings(),
    db.procedure.findMany({ orderBy: { name: "asc" } }),
    db.branch.findMany({ orderBy: { createdAt: "asc" } }),
    db.user.findMany({
      where: { role: { not: "PATIENT" } },
      orderBy: { createdAt: "asc" },
      include: { branch: true, doctor: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("settings.title", locale)}</h1>
        <p className="text-sm text-slate-500">{t("settings.subtitle", locale)}</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab2) => (
          <Link
            key={tab2.key}
            href={`/settings?tab=${tab2.key}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === tab2.key
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t(tab2.labelKey, locale)}
          </Link>
        ))}
      </div>

      {tab === "clinic" && (
        <Card className="max-w-2xl p-6">
          <ClinicForm
            clinic={{
              name: clinic.name,
              logoUrl: clinic.logoUrl ?? "",
              address: clinic.address ?? "",
              phone: clinic.phone ?? "",
              email: clinic.email ?? "",
              currency: clinic.currency,
            }}
          />
        </Card>
      )}

      {tab === "procedures" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold text-slate-800">الإجراءات ({procedures.length})</h2>
              </div>
              {procedures.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا توجد إجراءات</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {procedures.map((p) => (
                    <ProcedureRow
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      isActive={p.isActive}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
          <ProcedureForm />
        </div>
      )}

      {tab === "branches" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold text-slate-800">الفروع ({branches.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{b.name}</p>
                      <p className="text-xs text-slate-400">{b.address ?? "—"} {b.phone ? `• ${b.phone}` : ""}</p>
                    </div>
                    <BranchToggle id={b.id} isActive={b.isActive} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <BranchForm />
        </div>
      )}

      {tab === "staff" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="font-semibold text-slate-800">المستخدمون ({staff.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {staff.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {u.name}
                        {!u.isActive && <Badge color="red" className="mr-2">معطّل</Badge>}
                      </p>
                      <p className="text-xs text-slate-400" dir="ltr">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color={u.role === "ADMIN" ? "blue" : u.role === "DOCTOR" ? "green" : "slate"}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                      <StaffToggle id={u.id} isActive={u.isActive} self={u.id === session.id} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <StaffForm branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
        </div>
      )}
    </div>
  );
}
