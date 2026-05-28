import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { logout } from "../(auth)/actions";
import { LogOut } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  DOCTOR: "طبيب",
  RECEPTIONIST: "سكرتارية",
  PATIENT: "مريض",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div />
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">
                {session.name}
              </p>
              <p className="text-xs text-slate-400">
                {ROLE_LABELS[session.role] ?? session.role}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
