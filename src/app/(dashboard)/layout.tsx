import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { LanguageToggle } from "@/components/language-toggle";
import { logout } from "../(auth)/actions";
import { LogOut } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = await getLocale();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={session.role} locale={locale} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <LanguageToggle locale={locale} />
          <div className="flex items-center gap-4">
            <div className={locale === "ar" ? "text-left" : "text-right"}>
              <p className="text-sm font-medium text-slate-800">
                {session.name}
              </p>
              <p className="text-xs text-slate-400">
                {t(`role.${session.role}`, locale)}
              </p>
            </div>
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
  );
}
