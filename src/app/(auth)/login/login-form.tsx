"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { Stethoscope } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export function LoginForm({
  locale,
  clinicName = "Smart Clinic",
  logoUrl,
}: {
  locale: Locale;
  clinicName?: string;
  logoUrl?: string | null;
}) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="logo" className="mb-3 h-16 w-16 rounded-2xl object-contain" />
          ) : (
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Stethoscope className="h-7 w-7" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">{clinicName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("brand.tagline", locale)} — {t("login.title", locale)}
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("login.email", locale)}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              placeholder="admin@clinic.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t("login.password", locale)}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              placeholder="••••••••"
              required
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("login.loading", locale) : t("login.submit", locale)}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t("login.demo", locale)}: admin@clinic.com / admin123
        </p>
      </Card>
    </div>
  );
}
