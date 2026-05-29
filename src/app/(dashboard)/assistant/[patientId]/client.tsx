"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  chatAssistant,
  generateReport,
  addDataByVoice,
  createPrescription,
} from "../actions";
import type { ChatMessage } from "@/lib/ai";
import { Card, Button, Input, Label, Textarea } from "@/components/ui";
import { Send, Mic, MicOff, FileText, Plus, Trash2, Sparkles } from "lucide-react";

/* ============ Web Speech API hook (تحويل الصوت لنص) ============ */
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function useSpeech(onText: (t: string) => void) {
  const [listening, setListening] = useState(false);
  const ref = useRef<RecognitionLike | null>(null);

  const supported =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown })
        .webkitSpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition,
    );

  const toggle = () => {
    if (!supported) return;
    if (listening) {
      ref.current?.stop();
      return;
    }
    const Ctor = (
      window as unknown as { webkitSpeechRecognition?: new () => RecognitionLike; SpeechRecognition?: new () => RecognitionLike }
    ).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => RecognitionLike }).SpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "ar-EG";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    ref.current = rec;
    rec.start();
    setListening(true);
  };

  return { listening, toggle, supported };
}

/* ============ الدردشة ============ */
export function AssistantChat({ patientId }: { patientId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const { listening, toggle, supported } = useSpeech((t) =>
    setInput((prev) => (prev ? prev + " " + t : t)),
  );

  const send = () => {
    const text = input.trim();
    if (!text || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      const res = await chatAssistant(patientId, next);
      setMessages([...next, { role: "assistant", content: res.error ? `خطأ: ${res.error}` : res.text }]);
    });
  };

  return (
    <Card className="flex h-[28rem] flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
        <Sparkles className="h-5 w-5 text-brand-500" />
        <h2 className="font-semibold text-slate-800">محادثة</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            اسأل عن أي شيء يخص المريض — مثلاً: «ما آخر التشخيصات؟» أو «اقترح خطة علاج».
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {pending && <p className="text-center text-xs text-slate-400">يفكّر...</p>}
      </div>

      <div className="flex items-end gap-2 border-t border-slate-200 p-3">
        {supported && (
          <button
            onClick={toggle}
            title="إدخال صوتي"
            className={`rounded-lg p-2 ${listening ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="اكتب سؤالك..."
          className="flex-1 resize-none"
        />
        <Button onClick={send} disabled={pending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

/* ============ إضافة بيانات بالصوت ============ */
export function VoicePanel({ patientId }: { patientId: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { listening, toggle, supported } = useSpeech((t) =>
    setText((p) => (p ? p + " " + t : t)),
  );

  const apply = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await addDataByVoice(patientId, text);
      setResult(res.error ? `خطأ: ${res.error}` : `تم تحديث: ${res.applied}`);
      if (res.ok) setText("");
    });
  };

  return (
    <Card className="p-5">
      <h3 className="mb-2 font-semibold text-slate-800">إضافة بيانات بالصوت</h3>
      <p className="mb-3 text-xs text-slate-400">
        تكلّم أو اكتب ملاحظة، وسيستخرج المساعد البيانات ويضيفها لملف المريض.
      </p>
      <div className="flex items-start gap-2">
        {supported && (
          <button
            onClick={toggle}
            title="تسجيل صوتي"
            className={`rounded-lg p-2 ${listening ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="مثال: المريض عنده حساسية من البنسلين..."
          className="flex-1"
        />
      </div>
      {!supported && (
        <p className="mt-1 text-xs text-amber-500">المتصفح لا يدعم الإدخال الصوتي — استخدم الكتابة.</p>
      )}
      <Button onClick={apply} disabled={pending} className="mt-3 w-full" variant="secondary">
        {pending ? "..." : "استخراج وإضافة"}
      </Button>
      {result && <p className="mt-2 text-xs text-green-600">{result}</p>}
    </Card>
  );
}

/* ============ توليد تقرير طبي ============ */
export function ReportPanel({ patientId }: { patientId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const gen = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await generateReport(patientId);
      setMsg(res.error ? `خطأ: ${res.error}` : "تم إنشاء التقرير وحفظه بالأسفل.");
    });
  };

  return (
    <Card className="p-5">
      <h3 className="mb-2 font-semibold text-slate-800">تقرير طبي شامل</h3>
      <p className="mb-3 text-xs text-slate-400">
        يولّد المساعد تقريراً من ملف المريض ويحفظه.
      </p>
      <Button onClick={gen} disabled={pending} className="w-full">
        <FileText className="h-4 w-4" />
        {pending ? "جارٍ التوليد..." : "توليد تقرير"}
      </Button>
      {msg && <p className="mt-2 text-xs text-green-600">{msg}</p>}
    </Card>
  );
}

/* ============ بناء روشتة + بدائل + نموذج ============ */
type Row = { id: number };

export function PrescriptionBuilder({ patientId }: { patientId: string }) {
  const [state, action, pending] = useActionState(createPrescription, undefined);
  const [rows, setRows] = useState<Row[]>([{ id: 1 }]);
  const formRef = useRef<HTMLFormElement>(null);
  const [saveTpl, setSaveTpl] = useState(false);

  if (state?.ok && formRef.current) {
    // reset بعد النجاح
    formRef.current.reset();
  }

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">روشتة جديدة</h3>
      <form ref={formRef} action={action} className="space-y-3">
        <input type="hidden" name="patientId" value={patientId} />

        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div key={r.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <Label>الدواء</Label>
                <Input name="drugName" placeholder="اسم الدواء" />
              </div>
              <div className="sm:col-span-2">
                <Label>الجرعة</Label>
                <Input name="dose" placeholder="500mg" dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <Label>التكرار</Label>
                <Input name="frequency" placeholder="مرتين يومياً" />
              </div>
              <div className="sm:col-span-2">
                <Label>المدة</Label>
                <Input name="duration" placeholder="5 أيام" />
              </div>
              <div className="sm:col-span-2">
                <Label>بدائل</Label>
                <Input name="alternatives" placeholder="بديل اختياري" />
              </div>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, i) => i !== idx) : rs))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { id: Date.now() }])}
          className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" />
          إضافة دواء
        </button>

        <div>
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="saveAsTemplate" checked={saveTpl} onChange={(e) => setSaveTpl(e.target.checked)} />
          حفظ كنموذج لإعادة الاستخدام
        </label>
        {saveTpl && (
          <Input name="templateName" placeholder="اسم النموذج" />
        )}

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">تم حفظ الروشتة ✅</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "حفظ الروشتة"}
        </Button>
      </form>
    </Card>
  );
}
