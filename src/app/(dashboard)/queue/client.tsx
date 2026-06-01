"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addToQueue,
  setQueueStatus,
  removeFromQueue,
  lookupPhone,
  queueSnapshot,
} from "./actions";
import { Card, Button, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { useT } from "@/lib/i18n-client";
import { Play, Check, Trash2, UserCheck, Phone, ExternalLink, Bell, BellRing } from "lucide-react";

// تنبيه صوتي + تحديث تلقائي عند وصول عميل جديد للطابور
export function QueueAlerts({ initialCount }: { initialCount: number }) {
  const tr = useT();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const lastCount = useRef(initialCount);
  const audioCtx = useRef<AudioContext | null>(null);

  const beep = () => {
    const ctx = audioCtx.current;
    if (!ctx) return;
    // نغمتان قصيرتان لطيفتان
    const play = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      osc.start(t0);
      osc.stop(t0 + 0.36);
    };
    play(880, 0);
    play(1175, 0.18);
  };

  const enable = () => {
    // يجب إنشاء AudioContext بعد تفاعل المستخدم (سياسة المتصفحات)
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx.current = new Ctx();
    void audioCtx.current.resume();
    setEnabled(true);
    beep();
  };

  // استطلاع دوري لاكتشاف وصول عميل جديد
  useEffect(() => {
    if (!enabled) return;
    const tick = async () => {
      try {
        const snap = await queueSnapshot();
        if (snap.count > lastCount.current) {
          beep();
          router.refresh();
        }
        lastCount.current = snap.count;
      } catch {
        // تجاهل أخطاء الشبكة العابرة
      }
    };
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [enabled, router]);

  return (
    <button
      onClick={enable}
      disabled={enabled}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        enabled
          ? "bg-green-50 text-green-700"
          : "bg-brand-600 text-white hover:bg-brand-700"
      }`}
    >
      {enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {enabled ? tr("queue.soundOff") : tr("queue.soundOn")}
    </button>
  );
}

export function AddToQueueForm({
  doctors,
}: {
  doctors: { id: string; name: string }[];
}) {
  const tr = useT();
  const [state, action, pending] = useActionState(addToQueue, undefined);
  const [phone, setPhone] = useState("");
  const [match, setMatch] = useState<
    { found: boolean; name?: string; code?: string } | null
  >(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // التعرّف الفوري على رقم الهاتف — عميل سابق؟
  useEffect(() => {
    const p = phone.trim();
    if (p.length < 6) {
      setMatch(null);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      const res = await lookupPhone(p);
      if (!active) return;
      setMatch(res);
      // املأ الاسم تلقائياً للعميل السابق إن كان الحقل فارغاً
      if (res.found && res.name && nameRef.current && !nameRef.current.value) {
        nameRef.current.value = res.name;
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [phone]);

  // أعد ضبط النموذج بعد الإضافة الناجحة
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setPhone("");
      setMatch(null);
    }
  }, [state]);

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("queue.add")}</h3>
      <form ref={formRef} action={action} className="space-y-3">
        <div>
          <Label htmlFor="phone">{tr("queue.phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {match?.found && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-green-600">
              <UserCheck className="h-4 w-4" />
              {tr("queue.returning")}
              {match.code && (
                <span className="text-slate-400">
                  ({tr("queue.code")}: {match.code})
                </span>
              )}
            </p>
          )}
          {match && !match.found && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="h-4 w-4" />
              {tr("queue.newClient")}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="name">{tr("queue.name")}</Label>
          <Input id="name" name="name" ref={nameRef} required />
        </div>
        <div>
          <Label htmlFor="reason">{tr("queue.reason")}</Label>
          <Textarea id="reason" name="reason" rows={2} />
        </div>
        <div>
          <Label htmlFor="doctorId">{tr("queue.doctor")}</Label>
          <Select id="doctorId" name="doctorId" defaultValue="">
            <option value="">{tr("queue.anyDoctor")}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : tr("queue.add")}
        </Button>
      </form>
    </Card>
  );
}

export function QueueRow({
  id,
  position,
  name,
  phone,
  reason,
  status,
  patientId,
  patientCode,
  doctorName,
}: {
  id: string;
  position: number | null;
  name: string;
  phone: string;
  reason: string | null;
  status: string;
  patientId: string | null;
  patientCode: string | null;
  doctorName: string | null;
}) {
  const tr = useT();
  const [pending, startTransition] = useTransition();
  const inProgress = status === "IN_PROGRESS";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            inProgress ? "bg-green-100 text-green-700" : "bg-brand-50 text-brand-700"
          }`}
        >
          {inProgress ? "•" : position}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800">{name}</p>
            {position === 1 && !inProgress && <Badge color="yellow">{tr("queue.next")}</Badge>}
            {patientCode && (
              <Badge color="slate">{patientCode}</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500" dir="ltr">
            {phone}
          </p>
          {reason && <p className="text-xs text-slate-400">{reason}</p>}
          {doctorName && <p className="text-xs text-brand-600">{doctorName}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {patientId && (
          <Link
            href={`/patients/${patientId}`}
            title={tr("queue.code")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        {!inProgress && (
          <button
            title={tr("queue.start")}
            onClick={() => startTransition(() => setQueueStatus(id, "IN_PROGRESS"))}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
          >
            <Play className="h-3.5 w-3.5" />
            {tr("queue.start")}
          </button>
        )}
        <button
          title={tr("queue.done")}
          onClick={() => startTransition(() => setQueueStatus(id, "DONE"))}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
        >
          <Check className="h-3.5 w-3.5" />
          {tr("queue.done")}
        </button>
        <button
          title={tr("common.delete")}
          onClick={() => startTransition(() => removeFromQueue(id))}
          disabled={pending}
          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
