import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// الأرقام والتواريخ دائماً بالإنجليزية (لاتيني) في النسختين العربية والإنجليزية
// (نُبقي على وسيط locale للتوافق مع مواضع الاستدعاء)
const NUM_LOCALE = "en-GB";

export function formatCurrency(amount: number, _locale: Locale = "ar"): string {
  return new Intl.NumberFormat(NUM_LOCALE, {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, _locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(NUM_LOCALE, {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, _locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(NUM_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function calcAge(birthDate: Date | string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}
