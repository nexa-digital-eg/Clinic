import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessPath } from "@/lib/permissions";
import { Sidebar } from "@/components/sidebar";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { HistoryButton } from "@/components/history-button";
import { QuickSearch } from "@/components/quick-search";
import { logout } from "../(auth)/actions";
import { LogOut } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n-client";
import { getClinicSettings } from "@/server/clinic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = await getLocale();
  const clinic = await getClinicSettings();

  // اجلب صلاحيات المستخدم الحالية من القاعدة (تتحدّث فوراً عند تعديل الأدمن)
  const me = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true, title: true, permissions: true, isActive: true, sessionVersion: true },
  });
  if (!me || !me.isActive) redirect("/login");

  // إبطال الجلسات القديمة بعد تغيير كلمة المرور (تسجيل خروج تلقائي لباقي الأجهزة)
  if (me.sessionVersion !== session.sessionVersion) {
    await logout();
  }

  // افرض الصلاحية على المسار الحالي
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname && !canAccessPath(pathname, me.role, me.permissions)) {
    redirect("/dashboard");
  }

  return (
    <LocaleProvider locale={locale}>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={me.role} permissions={me.permissions} locale={locale} clinicName={clinic.name} logoUrl={clinic.logoUrl} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-1">
              <LanguageToggle locale={locale} />
              <ThemeToggle />
              {me.role === "ADMIN" && <HistoryButton />}
            </div>
            <QuickSearch />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/account" className={`rounded-lg px-1 transition-colors hover:opacity-80 ${locale === "ar" ? "text-end" : "text-start"}`}>
              <p className="text-sm font-medium text-slate-800">
                {session.name}
              </p>
              <p className="text-xs text-slate-400">
                {me.title || t(`role.${me.role}`, locale)}
              </p>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                {t("common.logout", locale)}
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
    </LocaleProvider>
  );
}
