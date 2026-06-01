"use client";

import { useActionState } from "react";
import { changeMyPassword } from "./actions";
import { Card, Button, Input, Label } from "@/components/ui";
import { useT } from "@/lib/i18n-client";
import { KeyRound } from "lucide-react";

export function ChangePasswordForm() {
  const tr = useT();
  const [state, action, pending] = useActionState(changeMyPassword, undefined);

  return (
    <Card className="max-w-md p-6">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-slate-800">{tr("account.changePassword")}</h2>
      </div>
      <form action={action} className="space-y-3" key={state?.ok ? "done" : "form"}>
        <div>
          <Label htmlFor="current">{tr("account.current")}</Label>
          <Input id="current" name="current" type="password" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="next">{tr("account.new")}</Label>
          <Input id="next" name="next" type="password" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="confirm">{tr("account.confirm")}</Label>
          <Input id="confirm" name="confirm" type="password" dir="ltr" required />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{tr("account.changed")}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : tr("account.save")}
        </Button>
      </form>
    </Card>
  );
}
