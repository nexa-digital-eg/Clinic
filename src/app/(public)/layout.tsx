import { Stethoscope } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { LocaleProvider } from "@/lib/i18n-client";
import { getClinicSettings } from "@/server/clinic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const clinic = await getClinicSettings();
  return (
    <LocaleProvider locale={locale}>
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          {clinic.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clinic.logoUrl} alt="logo" className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
          )}
          <span className="text-lg font-bold text-slate-800">{clinic.name}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
    </LocaleProvider>
  );
}
