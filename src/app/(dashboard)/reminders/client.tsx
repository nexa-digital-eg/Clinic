"use client";

import { useActionState, useState, useTransition } from "react";
import {
  generateAppointmentReminders,
  createReminder,
  setReminderStatus,
  confirmFromReminder,
  rescheduleFromReminder,
  deleteReminder,
} from "./actions";
import { Card, Button, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { RefreshCw, Check, CalendarClock, Trash2, BellRing } from "lucide-react";
import { useT } from "@/lib/i18n-client";

const STATUS_COLOR: Record<string, "slate" | "green" | "yellow" | "red" | "blue"> = {
  PENDING: "yellow",
  SENT: "blue",
  CONFIRMED: "green",
  RESCHEDULED: "blue",
  CANCELLED: "red",
};

export function GenerateButton() {
  const tr = useT();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      onClick={() => startTransition(() => generateAppointmentReminders())}
      disabled={pending}
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {tr("rem.generate")}
    </Button>
  );
}

export function ReminderRow({
  id,
  type,
  status,
  message,
  remindAt,
  patientName,
  patientId,
  appointmentId,
}: {
  id: string;
  type: string;
  status: string;
  message: string | null;
  remindAt: string;
  patientName: string;
  patientId: string;
  appointmentId: string | null;
}) {
  const tr = useT();
  const [pending, startTransition] = useTransition();
  const [showReschedule, setShowReschedule] = useState(false);
  const statusColor = STATUS_COLOR[status];
  const isPending = status === "PENDING";
  const rescheduleBound = appointmentId
    ? rescheduleFromReminder.bind(null, id, appointmentId)
    : null;

  return (
    <div className="px-5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 h-5 w-5 text-brand-500" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-800">{patientName}</p>
              <Badge color="slate">{tr(`remType.${type}`)}</Badge>
              <Badge color={statusColor}>{tr(`remStatus.${status}`)}</Badge>
            </div>
            {message && <p className="mt-0.5 text-sm text-slate-600">{message}</p>}
            <p className="mt-0.5 text-xs text-slate-400">{tr("rem.remindAt")}: {formatDateTime(remindAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isPending && appointmentId && (
            <>
              <button
                title={tr("rem.confirmBooking")}
                onClick={() => startTransition(() => confirmFromReminder(id, appointmentId))}
                disabled={pending}
                className="rounded p-1.5 text-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                title={tr("rem.reschedule")}
                onClick={() => setShowReschedule((v) => !v)}
                className="rounded p-1.5 text-brand-600 hover:bg-brand-50"
              >
                <CalendarClock className="h-4 w-4" />
              </button>
            </>
          )}
          {isPending && (
            <button
              title={tr("rem.markSent")}
              onClick={() => startTransition(() => setReminderStatus(id, "SENT"))}
              disabled={pending}
              className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              {tr("rem.markSent")}
            </button>
          )}
          <button
            title={tr("common.delete")}
            onClick={() => startTransition(() => deleteReminder(id))}
            disabled={pending}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showReschedule && rescheduleBound && (
        <form action={rescheduleBound} className="mt-3 flex items-center gap-2 pr-8">
          <input
            type="datetime-local"
            name="newAt"
            required
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            dir="ltr"
          />
          <Button type="submit" variant="secondary">{tr("rem.saveNewTime")}</Button>
        </form>
      )}
    </div>
  );
}

export function CreateReminderForm({
  patients,
}: {
  patients: { id: string; name: string; code: string }[];
}) {
  const tr = useT();
  const [state, action, pending] = useActionState(createReminder, undefined);
  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("rem.manual")}</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="patientId">{tr("form.patient")}</Label>
          <Select id="patientId" name="patientId" required defaultValue="">
            <option value="">{tr("form.choosePatient")}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="message">{tr("rem.message")}</Label>
          <Textarea id="message" name="message" rows={3} required />
        </div>
        <div>
          <Label htmlFor="remindAt">{tr("rem.remindAt")}</Label>
          <Input id="remindAt" name="remindAt" type="datetime-local" dir="ltr" required />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : tr("rem.add")}
        </Button>
      </form>
    </Card>
  );
}
