"use client";

import { useActionState } from "react";
import { createPatient } from "../actions";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n-client";

export default function NewPatientPage() {
  const [state, formAction, pending] = useActionState(createPatient, undefined);
  const tr = useT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/patients"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{tr("patientNew.title")}</h1>
          <p className="text-sm text-slate-500">{tr("patientNew.subtitle")}</p>
        </div>
      </div>

      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">{tr("form.firstName")} *</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div>
              <Label htmlFor="lastName">{tr("form.lastName")} *</Label>
              <Input id="lastName" name="lastName" required />
            </div>
            <div>
              <Label htmlFor="phone">{tr("form.phone")} *</Label>
              <Input id="phone" name="phone" dir="ltr" required />
            </div>
            <div>
              <Label htmlFor="email">{tr("form.email")}</Label>
              <Input id="email" name="email" type="email" dir="ltr" />
            </div>
            <div>
              <Label htmlFor="gender">{tr("form.gender")}</Label>
              <Select id="gender" name="gender" defaultValue="">
                <option value="">{tr("form.choose")}</option>
                <option value="MALE">{tr("form.male")}</option>
                <option value="FEMALE">{tr("form.female")}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="birthDate">{tr("form.birthDate")}</Label>
              <Input id="birthDate" name="birthDate" type="date" dir="ltr" />
            </div>
            <div>
              <Label htmlFor="bloodType">{tr("form.bloodType")}</Label>
              <Input id="bloodType" name="bloodType" dir="ltr" placeholder="A+" />
            </div>
            <div>
              <Label htmlFor="address">{tr("form.address")}</Label>
              <Input id="address" name="address" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="allergies">{tr("form.allergies")}</Label>
              <Textarea id="allergies" name="allergies" rows={2} />
            </div>
            <div>
              <Label htmlFor="chronicConditions">{tr("form.chronic")}</Label>
              <Textarea
                id="chronicConditions"
                name="chronicConditions"
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{tr("form.notes")}</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Link
              href="/patients"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {tr("common.cancel")}
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? tr("form.saving") : tr("patientNew.save")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
