"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { composeMessage, retryMessage, deleteMessage, runScheduledNow } from "./actions";
import { Card, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { Send, RefreshCw, Trash2, RotateCw } from "lucide-react";
import { useT } from "@/lib/i18n-client";

type PatientOpt = { id: string; name: string; phone: string };

export function ComposeForm({ patients }: { patients: PatientOpt[] }) {
  const tr = useT();
  const [state, action, pending] = useActionState(composeMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [phone, setPhone] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setPhone("");
      setShowSchedule(false);
    }
  }, [state]);

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("wa.newMessage")}</h3>
      <form ref={formRef} action={action} className="space-y-3">
        <div>
          <Label htmlFor="patientId">{tr("wa.patientOpt")}</Label>
          <Select
            id="patientId"
            name="patientId"
            defaultValue=""
            onChange={(e) => {
              const p = patients.find((x) => x.id === e.target.value);
              if (p) setPhone(p.phone);
            }}
          >
            <option value="">{tr("wa.manualPhone")}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="toPhone">{tr("form.phone")}</Label>
          <Input
            id="toPhone"
            name="toPhone"
            dir="ltr"
            placeholder="201001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="body">{tr("wa.body")}</Label>
          <Textarea id="body" name="body" rows={3} />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="mediaUrl">{tr("wa.mediaUrl")}</Label>
            <Input id="mediaUrl" name="mediaUrl" dir="ltr" placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="mediaType">{tr("wa.type")}</Label>
            <Select id="mediaType" name="mediaType" defaultValue="image">
              <option value="image">{tr("wa.image")}</option>
              <option value="video">{tr("wa.video")}</option>
              <option value="document">{tr("wa.document")}</option>
            </Select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showSchedule}
            onChange={(e) => setShowSchedule(e.target.checked)}
          />
          {tr("wa.schedule")}
        </label>

        {showSchedule && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-3">
            <div>
              <Label htmlFor="scheduledAt">{tr("wa.sendAt")}</Label>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="repeatEvery">{tr("wa.repeat")}</Label>
                <Select id="repeatEvery" name="repeatEvery" defaultValue="none">
                  <option value="none">{tr("wa.repeatNone")}</option>
                  <option value="daily">{tr("wa.daily")}</option>
                  <option value="weekly">{tr("wa.weekly")}</option>
                  <option value="monthly">{tr("wa.monthly")}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="repeatUntil">{tr("wa.until")}</Label>
                <Input id="repeatUntil" name="repeatUntil" type="date" dir="ltr" />
              </div>
            </div>
          </div>
        )}

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          <Send className="h-4 w-4" />
          {pending ? "..." : showSchedule ? tr("wa.scheduleBtn") : tr("wa.send")}
        </Button>
      </form>
    </Card>
  );
}

export function MessageActions({ id, status }: { id: string; status: string }) {
  const tr = useT();
  const [, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1">
      {status === "FAILED" && (
        <button
          title="إعادة المحاولة"
          onClick={() => startTransition(() => retryMessage(id))}
          className="rounded p-1.5 text-brand-600 hover:bg-brand-50"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
      <button
        title="حذف"
        onClick={() => {
          if (confirm(tr("wa.confirmDel"))) startTransition(() => deleteMessage(id));
        }}
        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RunScheduledButton({ count }: { count: number }) {
  const tr = useT();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      onClick={() => startTransition(() => runScheduledNow())}
      disabled={pending}
    >
      <RotateCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {tr("wa.runScheduled")} ({count})
    </Button>
  );
}
