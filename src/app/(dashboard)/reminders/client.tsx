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

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: "حجز",
  PACKAGE: "باقة",
  CUSTOM: "مخصص",
};

const STATUS_META: Record<
  string,
  { label: string; color: "slate" | "green" | "yellow" | "red" | "blue" }
> = {
  PENDING: { label: "منتظر", color: "yellow" },
  SENT: { label: "أُرسل", color: "blue" },
  CONFIRMED: { label: "مؤكد", color: "green" },
  RESCHEDULED: { label: "أُعيدت جدولته", color: "blue" },
  CANCELLED: { label: "ملغي", color: "red" },
};

export function GenerateButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      onClick={() => startTransition(() => generateAppointmentReminders())}
      disabled={pending}
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      توليد تذكيرات الحجوزات
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
  const [pending, startTransition] = useTransition();
  const [showReschedule, setShowReschedule] = useState(false);
  const meta = STATUS_META[status];
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
              <Badge color="slate">{TYPE_LABELS[type]}</Badge>
              <Badge color={meta.color}>{meta.label}</Badge>
            </div>
            {message && <p className="mt-0.5 text-sm text-slate-600">{message}</p>}
            <p className="mt-0.5 text-xs text-slate-400">موعد التذكير: {formatDateTime(remindAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isPending && appointmentId && (
            <>
              <button
                title="تأكيد الحجز"
                onClick={() => startTransition(() => confirmFromReminder(id, appointmentId))}
                disabled={pending}
                className="rounded p-1.5 text-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                title="تغيير الموعد"
                onClick={() => setShowReschedule((v) => !v)}
                className="rounded p-1.5 text-brand-600 hover:bg-brand-50"
              >
                <CalendarClock className="h-4 w-4" />
              </button>
            </>
          )}
          {isPending && (
            <button
              title="تحديد كمُرسل"
              onClick={() => startTransition(() => setReminderStatus(id, "SENT"))}
              disabled={pending}
              className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              أُرسل
            </button>
          )}
          <button
            title="حذف"
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
          <Button type="submit" variant="secondary">حفظ الموعد الجديد</Button>
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
  const [state, action, pending] = useActionState(createReminder, undefined);
  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">تذكير يدوي</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="patientId">المريض</Label>
          <Select id="patientId" name="patientId" required defaultValue="">
            <option value="">— اختر المريض —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="message">نص التذكير</Label>
          <Textarea id="message" name="message" rows={3} required />
        </div>
        <div>
          <Label htmlFor="remindAt">موعد التذكير</Label>
          <Input id="remindAt" name="remindAt" type="datetime-local" dir="ltr" required />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : "إضافة تذكير"}
        </Button>
      </form>
    </Card>
  );
}
