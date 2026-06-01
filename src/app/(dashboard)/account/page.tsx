import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { ChangePasswordForm } from "./client";
import { logoutEverywhere } from "./actions";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = await getLocale();
  const me = await db.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, role: true, title: true },
  });
  if (!me) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("account.title", locale)}</h1>
        <p className="text-sm text-slate-500">{t("account.subtitle", locale)}</p>
      </div>

      <Card className="max-w-md p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">{t("col.name", locale)}</span>
            <span className="font-medium text-slate-800">{me.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t("form.email", locale)}</span>
            <span className="font-medium text-slate-800" dir="ltr">{me.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t("set.userRole", locale)}</span>
            <span className="font-medium text-slate-800">{me.title || t(`role.${me.role}`, locale)}</span>
          </div>
        </div>
      </Card>

      <ChangePasswordForm />

      <Card className="max-w-md p-6">
        <h2 className="mb-1 font-semibold text-slate-800">{t("account.security", locale)}</h2>
        <p className="mb-4 text-sm text-slate-500">{t("account.logoutAllHint", locale)}</p>
        <form action={logoutEverywhere}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-red-700 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            {t("account.logoutAll", locale)}
          </button>
        </form>
      </Card>
    </div>
  );
}
