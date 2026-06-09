"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getWaitingStatus, type WaitingStatus } from "./actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { useT } from "@/lib/i18n-client";
import { Users, Phone, RefreshCw, CheckCircle2, Stethoscope, Hourglass } from "lucide-react";

export function WaitingClient() {
  const tr = useT();
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [status, setStatus] = useState<WaitingStatus | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = (p: string) => {
    startTransition(async () => {
      setStatus(await getWaitingStatus(p));
    });
  };

  // تحديث تلقائي كل 8 ثوانٍ بعد إدخال الرقم
  useEffect(() => {
    if (!submitted) return;
    refresh(submitted);
    timer.current = setInterval(() => refresh(submitted), 8000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 6) return;
    setSubmitted(phone.trim());
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setSubmitted(null);
    setStatus(null);
  };

  // شاشة إدخال الرقم
  if (!submitted) {
    return (
      <Card className="mx-auto max-w-md p-7">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg">
            <Hourglass className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{tr("wait.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{tr("wait.subtitle")}</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">{tr("wait.phone")}</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoFocus
                required
                className="ps-9"
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            {tr("wait.check")}
          </Button>
        </form>
      </Card>
    );
  }

  // شاشة الحالة
  return (
    <div className="mx-auto max-w-md space-y-4">
      {status === null ? (
        <Card className="p-10 text-center text-sm text-slate-400">{tr("wait.checking")}</Card>
      ) : !status.found ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600">{tr("wait.notFound")}</p>
          <Button variant="secondary" className="mt-5" onClick={reset}>
            {tr("wait.change")}
          </Button>
        </Card>
      ) : (
        <>
          {/* البطاقة الكبيرة: حالة الدور */}
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 px-6 py-8 text-center text-white">
              {status.myPos === null ? (
                // جاري الكشف على المريض الآن
                <>
                  <Stethoscope className="mx-auto mb-2 h-10 w-10" />
                  <p className="text-2xl font-bold">{tr("wait.yourTurn")}</p>
                </>
              ) : status.ahead === 0 ? (
                <>
                  <CheckCircle2 className="mx-auto mb-2 h-10 w-10" />
                  <p className="text-2xl font-bold">{tr("wait.nextUp")}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/70">{tr("wait.aheadOfYou")}</p>
                  <p className="my-1 text-6xl font-extrabold tabular-nums">{status.ahead}</p>
                  <p className="text-sm text-white/80">
                    {status.ahead === 1 ? tr("wait.person") : tr("wait.persons")}
                  </p>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100 text-center">
              <div className="px-4 py-3">
                <p className="text-xs text-slate-400">{tr("wait.yourPosition")}</p>
                <p className="text-xl font-bold text-slate-800 tabular-nums">
                  {status.myPos ?? "—"}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-slate-400">{tr("wait.totalWaiting")}</p>
                <p className="text-xl font-bold text-slate-800 tabular-nums">{status.total}</p>
              </div>
            </div>
          </Card>

          {/* قائمة الانتظار بأسماء مموّهة عدا اسمك */}
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="h-4 w-4" />
                <span className="font-semibold">{tr("wait.queueList")}</span>
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <RefreshCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
                {tr("wait.autoRefresh")}
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {status.entries.map((e, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 px-5 py-3 ${
                    e.isMe ? "bg-brand-50" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                      e.serving
                        ? "bg-green-100 text-green-700"
                        : e.isMe
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {e.serving ? <Stethoscope className="h-4 w-4" /> : e.pos}
                  </div>
                  <span
                    className={`flex-1 text-sm ${
                      e.isMe
                        ? "font-bold text-brand-800"
                        : "select-none text-slate-500 blur-[5px]"
                    }`}
                  >
                    {e.label}
                  </span>
                  {e.isMe && (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                      {tr("wait.you")}
                    </span>
                  )}
                  {e.serving && !e.isMe && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {tr("wait.serving")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <button
            onClick={reset}
            className="mx-auto block text-sm font-medium text-slate-500 hover:text-brand-600"
          >
            {tr("wait.change")}
          </button>
        </>
      )}
    </div>
  );
}
