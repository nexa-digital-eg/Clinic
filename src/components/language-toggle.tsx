"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/locale-actions";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <button
      onClick={() => startTransition(() => setLocale(next))}
      disabled={pending}
      title={locale === "ar" ? "English" : "العربية"}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
    >
      <Languages className="h-4 w-4" />
      {locale === "ar" ? "EN" : "ع"}
    </button>
  );
}
