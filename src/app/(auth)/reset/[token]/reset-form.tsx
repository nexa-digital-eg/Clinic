"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "../../reset-actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { Stethoscope, ArrowRight } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export function ResetForm({
  token,
  locale,
  clinicName = "Smart Clinic",
  logoUrl,
}: {
  token: string;
  locale: Locale;
  clinicName?: string;
  logoUrl?: string | null;
}) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

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
          <p className="mt-1 text-sm text-slate-500">{t("reset.title", locale)}</p>
        </div>

        {state?.ok ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-green-50 px-3 py-3 text-sm text-green-700">{t("reset.done", locale)}</p>
            <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              <ArrowRight className="h-4 w-4" />
              {t("login.submit", locale)}
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <Label htmlFor="next">{t("account.new", locale)}</Label>
              <Input id="next" name="next" type="password" dir="ltr" required />
            </div>
            <div>
              <Label htmlFor="confirm">{t("account.confirm", locale)}</Label>
              <Input id="confirm" name="confirm" type="password" dir="ltr" required />
            </div>
            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "..." : t("reset.save", locale)}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
