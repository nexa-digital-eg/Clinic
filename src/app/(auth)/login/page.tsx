"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Smart Clinic</h1>
          <p className="mt-1 text-sm text-slate-500">
            نظام إدارة العيادات — تسجيل الدخول
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
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
            <Label htmlFor="password">كلمة المرور</Label>
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
            {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          حساب تجريبي: admin@clinic.com / admin123
        </p>
      </Card>
    </div>
  );
}
