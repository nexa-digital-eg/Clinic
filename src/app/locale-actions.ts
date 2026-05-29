"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export async function setLocale(locale: Locale) {
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale === "en" ? "en" : "ar", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
