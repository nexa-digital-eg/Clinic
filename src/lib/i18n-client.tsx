"use client";

import { createContext, useContext } from "react";
import { t as translate, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("ar");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// hook يرجّع دالة الترجمة باللغة الحالية
export function useT() {
  const locale = useContext(LocaleContext);
  return (key: string) => translate(key, locale);
}
