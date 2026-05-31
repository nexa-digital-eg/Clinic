"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import {
  addToothRecord,
  setToothStatus,
  deleteToothRecord,
} from "../actions";
import {
  UPPER_TEETH,
  LOWER_TEETH,
  UPPER_PRIMARY_TEETH,
  LOWER_PRIMARY_TEETH,
  SURFACES,
  surfaceLabel,
  toothName,
} from "@/lib/teeth";
import { Card, Button, Label, Select, Textarea, Badge, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n-client";
import { Check, RotateCcw, Trash2 } from "lucide-react";

type Procedure = { id: string; name: string; price: number };
type Rec = {
  id: string;
  toothNumber: number;
  surface: string | null;
  procedureName: string | null;
  price: number;
  status: string;
};

const PLANNED = "#f97316"; // برتقالي
const DONE = "#1d4ed8"; // أزرق
const EMPTY = "#e5e7eb";
const CENTER_EMPTY = "#eef2f7";
const CROWN_EMPTY = "#fbf3da";
const STROKE = "#94a3b8";

function toothType(num: number): "anterior" | "premolar" | "molar" {
  const pos = num % 10;
  if (pos <= 3) return "anterior";
  if (pos <= 5) return "premolar";
  return "molar";
}

/* ===== عجلة الأسطح (odontogram) ===== */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function donutSeg(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number) {
  const o0 = polar(cx, cy, rOut, a0);
  const o1 = polar(cx, cy, rOut, a1);
  const i1 = polar(cx, cy, rIn, a1);
  const i0 = polar(cx, cy, rIn, a0);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M${o0.x},${o0.y} A${rOut},${rOut},0,${large},1,${o1.x},${o1.y} L${i1.x},${i1.y} A${rIn},${rIn},0,${large},0,${i0.x},${i0.y} Z`;
}

// المواضع: أعلى=دهليزي، يمين=وحشي، أسفل=لساني، يسار=إنسي، المركز=إطباق
const WHEEL_SEGMENTS: { surface: string; a0: number; a1: number }[] = [
  { surface: "buccal", a0: -45, a1: 45 },
  { surface: "distal", a0: 45, a1: 135 },
  { surface: "lingual", a0: 135, a1: 225 },
  { surface: "mesial", a0: 225, a1: 315 },
];

function SurfaceWheel({
  fillFor,
  onPick,
  selectedSurface,
}: {
  fillFor: (surface: string) => string;
  onPick: (surface: string) => void;
  selectedSurface?: string | null;
}) {
  const cx = 22, cy = 22, rIn = 9, rOut = 20;
  const sel = (s: string) => selectedSurface === s;
  return (
    <svg viewBox="0 0 44 44" className="h-12 w-12">
      {WHEEL_SEGMENTS.map((s) => (
        <path
          key={s.surface}
          d={donutSeg(cx, cy, rIn, rOut, s.a0, s.a1)}
          fill={fillFor(s.surface)}
          stroke={sel(s.surface) ? "#2563eb" : STROKE}
          strokeWidth={sel(s.surface) ? 2.4 : 0.7}
          className="cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => onPick(s.surface)}
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={rIn}
        fill={fillFor("occlusal")}
        stroke={sel("occlusal") ? "#2563eb" : STROKE}
        strokeWidth={sel("occlusal") ? 2.4 : 0.7}
        className="cursor-pointer transition-opacity hover:opacity-80"
        onClick={() => onPick("occlusal")}
      />
    </svg>
  );
}

/* ===== تعريفات التدرّجات (إحساس ثلاثي الأبعاد) ===== */
function ChartDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <radialGradient id="gCrownHealthy" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="60%" stopColor="#f3e8c8" />
          <stop offset="100%" stopColor="#e2d2a6" />
        </radialGradient>
        <radialGradient id="gCrownPlanned" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
        <radialGradient id="gCrownDone" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
        <linearGradient id="gRoot" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5edd6" />
          <stop offset="100%" stopColor="#d9c9a0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function crownFillId(state: "none" | "planned" | "done"): string {
  if (state === "planned") return "url(#gCrownPlanned)";
  if (state === "done") return "url(#gCrownDone)";
  return "url(#gCrownHealthy)";
}

/* ===== شكل السن التشريحي (تاج بحُديبات + جذور) ===== */
function ToothSVG({
  type,
  state,
  flip,
  onPick,
}: {
  type: "anterior" | "premolar" | "molar";
  state: "none" | "planned" | "done";
  flip: boolean;
  onPick: () => void;
}) {
  const fill = crownFillId(state);
  let body: React.ReactNode;

  if (type === "anterior") {
    body = (
      <>
        {/* جذر واحد طويل */}
        <path d="M18,26 C18,40 19,52 22,55 C25,52 26,40 26,26 Z" fill="url(#gRoot)" stroke={STROKE} strokeWidth={0.8} />
        {/* تاج القاطع (حافة مستقيمة) */}
        <path d="M13,26 L13,12 C13,5 18,3 22,3 C26,3 31,5 31,12 L31,26 Z" fill={fill} stroke={STROKE} strokeWidth={1} />
        {/* خطوط النمو */}
        <path d="M18,8 L18,24 M22,7 L22,24 M26,8 L26,24" stroke="#00000018" strokeWidth={0.8} fill="none" />
      </>
    );
  } else if (type === "premolar") {
    body = (
      <>
        <path d="M18,26 C18,42 19,53 22,56 C25,53 26,42 26,26 Z" fill="url(#gRoot)" stroke={STROKE} strokeWidth={0.8} />
        {/* تاج بحُديبتين */}
        <path d="M11,25 L11,15 C11,9 14,6 17,6 C18.5,6 19.5,8 22,8 C24.5,8 25.5,6 27,6 C30,6 33,9 33,15 L33,25 Z" fill={fill} stroke={STROKE} strokeWidth={1} />
        <path d="M22,9 L22,24 M16,12 L16,24 M28,12 L28,24" stroke="#00000018" strokeWidth={0.8} fill="none" />
      </>
    );
  } else {
    body = (
      <>
        {/* جذرين متباعدين */}
        <path d="M13,26 C12,40 10,50 12,54 C14,52 15,40 16,28 Z" fill="url(#gRoot)" stroke={STROKE} strokeWidth={0.8} />
        <path d="M31,26 C32,40 34,50 32,54 C30,52 29,40 28,28 Z" fill="url(#gRoot)" stroke={STROKE} strokeWidth={0.8} />
        {/* تاج عريض بأربع حُديبات */}
        <path d="M8,26 L8,15 C8,9 11,6 14,6 C15.5,6 16.5,8 18.5,8 C20,8 20.5,6.5 22,6.5 C23.5,6.5 24,8 25.5,8 C27.5,8 28.5,6 30,6 C33,6 36,9 36,15 L36,26 Z" fill={fill} stroke={STROKE} strokeWidth={1} />
        {/* أخدود الإطباق */}
        <path d="M22,10 L22,25 M11,16 L33,16" stroke="#00000020" strokeWidth={0.9} fill="none" />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 44 58"
      className="h-14 w-11 cursor-pointer transition-transform hover:scale-105"
      onClick={onPick}
    >
      <g transform={flip ? "rotate(180 22 29)" : undefined}>
        {body}
        {/* لمعة لإحساس ثلاثي الأبعاد */}
        <ellipse cx="17" cy="12" rx="4.5" ry="3" fill="#ffffff" opacity="0.4" />
      </g>
    </svg>
  );
}

/* ===== سن كامل (شكل + عجلة + رقم) ===== */
function ToothUnit({
  num,
  upper,
  records,
  selectedKey,
  onPick,
}: {
  num: number;
  upper: boolean;
  records: Rec[];
  selectedKey: string | null;
  onPick: (tooth: number, surface: string) => void;
}) {
  const fillFor = (surface: string) => {
    const rec = records.find((r) => (r.surface || "whole") === surface);
    if (!rec) return surface === "occlusal" ? CENTER_EMPTY : EMPTY;
    return rec.status === "done" ? DONE : PLANNED;
  };
  const crownState: "none" | "planned" | "done" = (() => {
    const rec = records.find((r) => (r.surface || "whole") === "whole");
    if (!rec) return "none";
    return rec.status === "done" ? "done" : "planned";
  })();

  const sel = selectedKey?.startsWith(`${num}-`);
  const selSurface = sel ? selectedKey!.slice(`${num}-`.length) : null;
  const tooth = (
    <ToothSVG
      type={toothType(num)}
      state={crownState}
      flip={!upper}
      onPick={() => onPick(num, "whole")}
    />
  );
  const wheel = <SurfaceWheel fillFor={fillFor} selectedSurface={selSurface} onPick={(s) => onPick(num, s)} />;
  // العرض بترقيم 1-8 لكل ربع (مع الاحتفاظ برقم FDI داخلياً للبيانات)
  const label = <span className="text-xs font-medium text-slate-500">{num % 10}</span>;

  return (
    <div
      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1 ${sel ? "bg-brand-50 ring-1 ring-brand-300" : ""}`}
    >
      {upper ? (
        <>
          {tooth}
          {wheel}
          {label}
        </>
      ) : (
        <>
          {label}
          {wheel}
          {tooth}
        </>
      )}
    </div>
  );
}

/* ===== المكوّن الرئيسي ===== */
export function ToothChart({
  patientId,
  procedures,
  records,
}: {
  patientId: string;
  procedures: Procedure[];
  records: Rec[];
}) {
  const tr = useT();
  const [selected, setSelected] = useState<{ tooth: number; surface: string } | null>(null);
  const [dentition, setDentition] = useState<"permanent" | "primary">("permanent");
  const [state, formAction, pending] = useActionState(addToothRecord, undefined);
  const [, startTransition] = useTransition();

  const upperTeeth = dentition === "permanent" ? UPPER_TEETH : UPPER_PRIMARY_TEETH;
  const lowerTeeth = dentition === "permanent" ? LOWER_TEETH : LOWER_PRIMARY_TEETH;

  useEffect(() => {
    if (state && !state.error) setSelected(null);
  }, [state]);

  const recordsByTooth = new Map<number, Rec[]>();
  for (const r of records) {
    if (!recordsByTooth.has(r.toothNumber)) recordsByTooth.set(r.toothNumber, []);
    recordsByTooth.get(r.toothNumber)!.push(r);
  }

  const selectedKey = selected ? `${selected.tooth}-${selected.surface}` : null;
  const pick = (tooth: number, surface: string) => setSelected({ tooth, surface });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <ChartDefs />
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-6">
          {/* تبديل دائمة / لبنية */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => { setDentition("permanent"); setSelected(null); }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${dentition === "permanent" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
              >
                {tr("dent.permanent")}
              </button>
              <button
                onClick={() => { setDentition("primary"); setSelected(null); }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${dentition === "primary" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
              >
                {tr("dent.primary")}
              </button>
            </div>
          </div>

          {/* الفك العلوي */}
          <p className="mb-1 text-center text-xs text-slate-400">{tr("dent.upper")}</p>
          <div className="flex justify-start gap-0.5 overflow-x-auto pb-2 sm:justify-center">
            {upperTeeth.map((n) => (
              <ToothUnit key={n} num={n} upper records={recordsByTooth.get(n) ?? []} selectedKey={selectedKey} onPick={pick} />
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-slate-200" />

          {/* الفك السفلي */}
          <div className="flex justify-start gap-0.5 overflow-x-auto pt-1 sm:justify-center">
            {lowerTeeth.map((n) => (
              <ToothUnit key={n} num={n} upper={false} records={recordsByTooth.get(n) ?? []} selectedKey={selectedKey} onPick={pick} />
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-slate-400">{tr("dent.lower")}</p>

          {/* مفتاح الألوان */}
          <div className="mt-5 flex justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border" style={{ background: CROWN_EMPTY, borderColor: STROKE }} /> {tr("dent.healthy")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: PLANNED }} /> {tr("dent.planned")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ background: DONE }} /> {tr("dent.done")}
            </span>
          </div>
        </Card>

        {/* سجلات الأسنان */}
        <Card>
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-800">{tr("dent.records")}</h2>
          </div>
          {records.length === 0 ? (
            <div className="p-5">
              <EmptyState title={tr("dent.noRecords")} description={tr("dent.pickToothHint")} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-start text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">{tr("col.tooth")}</th>
                    <th className="px-4 py-2 font-medium">{tr("col.surface")}</th>
                    <th className="px-4 py-2 font-medium">{tr("col.procedure")}</th>
                    <th className="px-4 py-2 font-medium">{tr("col.price")}</th>
                    <th className="px-4 py-2 font-medium">{tr("col.status")}</th>
                    <th className="px-4 py-2 font-medium">{tr("col.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono">{r.toothNumber}</td>
                      <td className="px-4 py-2 text-slate-600">{surfaceLabel(r.surface)}</td>
                      <td className="px-4 py-2">{r.procedureName ?? "—"}</td>
                      <td className="px-4 py-2">{formatCurrency(r.price)}</td>
                      <td className="px-4 py-2">
                        <Badge color={r.status === "done" ? "green" : "yellow"}>
                          {r.status === "done" ? tr("dent.done") : tr("dent.planned")}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            title={r.status === "done" ? tr("dent.planned") : tr("dent.done")}
                            onClick={() =>
                              startTransition(() =>
                                setToothStatus(r.id, patientId, r.status === "done" ? "planned" : "done"),
                              )
                            }
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                          >
                            {r.status === "done" ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4 text-green-600" />}
                          </button>
                          <button
                            title={tr("common.delete")}
                            onClick={() => {
                              if (confirm(tr("dent.confirmDel")))
                                startTransition(() => deleteToothRecord(r.id, patientId));
                            }}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* لوحة إضافة إجراء */}
      <div>
        <Card className="sticky top-4 p-5">
          {selected === null ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-600">{tr("dent.pickTooth")}</p>
              <p className="mt-1 text-xs text-slate-400">{tr("dent.pickToothHint")}</p>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="patientId" value={patientId} />
              <input type="hidden" name="toothNumber" value={selected.tooth} />

              <div className="rounded-lg bg-brand-50 p-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{tr("dent.tooth")} {selected.tooth}</p>
                <p className="text-xs text-brand-600">{toothName(selected.tooth)}</p>
              </div>

              <div>
                <Label>{tr("dent.surface")}</Label>
                <input type="hidden" name="surface" value={selected.surface} />
                <div className="flex flex-wrap gap-1.5">
                  {SURFACES.map((s) => {
                    const active = selected.surface === s.value;
                    return (
                      <button
                        type="button"
                        key={s.value}
                        onClick={() => setSelected({ tooth: selected.tooth, surface: s.value })}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="procedureId">{tr("dent.procedure")}</Label>
                <Select id="procedureId" name="procedureId" defaultValue="">
                  <option value="">{tr("dent.noProcedure")}</option>
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)})
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-slate-400">{tr("dent.priceAuto")}</p>
              </div>

              <div>
                <Label htmlFor="notes">{tr("form.notes")}</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>

              {state?.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? tr("form.saving") : tr("dent.addProcedure")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                  {tr("common.cancel")}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
