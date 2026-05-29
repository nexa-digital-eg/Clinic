"use client";

import { useActionState } from "react";
import { createAppointment } from "../actions";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n-client";

type Opt = { id: string; name: string };
type PatientOpt = Opt & { code: string; phone: string };

export function NewAppointmentForm({
  patients,
  doctors,
  branches,
  defaultPatientId,
}: {
  patients: PatientOpt[];
  doctors: Opt[];
  branches: Opt[];
  defaultPatientId?: string;
}) {
  const [state, formAction, pending] = useActionState(createAppointment, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const tr = useT();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/appointments" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{tr("apptNew.title")}</h1>
          <p className="text-sm text-slate-500">{tr("apptNew.subtitle")}</p>
        </div>
      </div>

      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="patientId">{tr("form.patient")} *</Label>
            <Select id="patientId" name="patientId" defaultValue={defaultPatientId ?? ""} required>
              <option value="">{tr("form.choosePatient")}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) - {p.phone}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="doctorId">{tr("form.doctor")} *</Label>
              <Select id="doctorId" name="doctorId" required>
                <option value="">{tr("form.choose")}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="branchId">{tr("form.branch")}</Label>
              <Select id="branchId" name="branchId" defaultValue={branches[0]?.id ?? ""}>
                <option value="">{tr("common.none")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="date">{tr("form.date")} *</Label>
              <Input id="date" name="date" type="date" dir="ltr" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="time">{tr("form.time")} *</Label>
              <Input id="time" name="time" type="time" dir="ltr" defaultValue="10:00" required />
            </div>
            <div>
              <Label htmlFor="durationMin">{tr("form.duration")}</Label>
              <Input id="durationMin" name="durationMin" type="number" dir="ltr" defaultValue="30" />
            </div>
            <div>
              <Label htmlFor="reason">{tr("form.reason")}</Label>
              <Input id="reason" name="reason" />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{tr("form.notes")}</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/appointments" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              {tr("common.cancel")}
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? tr("form.saving") : tr("apptNew.save")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
