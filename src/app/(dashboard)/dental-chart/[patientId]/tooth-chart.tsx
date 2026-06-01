"use client";

import { useActionState, useState, useTransition, useEffect, useRef } from "react";
import { teethPaths } from "@/lib/teeth-paths";
import {
  addToothRecord,
  addToothRecordsBulk,
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

/* ===== أشكال أسنان واقعية (react-odontogram, MIT) ===== */
const POS_TYPE: Record<number, string> = {
  1: "Central Incisor",
  2: "Lateral Incisor",
  3: "Canine",
  4: "First Premolar",
  5: "Second Premolar",
  6: "First Molar",
  7: "Second Molar",
  8: "Third Molar",
};
function pathFor(num: number) {
  const wanted = POS_TYPE[num % 10] ?? "First Molar";
  return (
    teethPaths.find((p) => p.type === wanted) ??
    teethPaths.find((p) => p.type.includes("Molar")) ??
    teethPaths[0]
  );
}

function RealTooth({
  num,
  state,
  flip,
  onPick,
}: {
  num: number;
  state: "none" | "planned" | "done";
  flip: boolean;
  onPick: () => void;
}) {
  const tp = pathFor(num);
  const gref = useRef<SVGGElement>(null);
  const [vb, setVb] = useState<string | undefined>();
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (!gref.current) return;
    try {
      const b = gref.current.getBBox();
      const pad = Math.max(b.width, b.height) * 0.07;
      setVb(`${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
      setCenter([b.x + b.width / 2, b.y + b.height / 2]);
    } catch {
      /* getBBox غير متاح */
    }
  }, [tp]);

  const fill = crownFillId(state);
  const toArr = (v: string | string[] | undefined): string[] =>
    v == null ? [] : Array.isArray(v) ? v : [v];

  return (
    <svg
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      className="h-16 w-12 cursor-pointer transition-transform hover:scale-105"
      onClick={onPick}
    >
      <g ref={gref} transform={flip ? `rotate(180 ${center[0]} ${center[1]})` : undefined}>
        {toArr(tp.outlinePath).map((d, i) => (
          <path key={`o${i}`} d={d} fill={fill} stroke={STROKE} strokeWidth={1.4} strokeLinejoin="round" />
        ))}
        {toArr(tp.shadowPath).map((d, i) => (
          <path key={`s${i}`} d={d} fill="#00000018" />
        ))}
        {toArr(tp.lineHighlightPath).map((d, i) => (
          <path key={`h${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" />
        ))}
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
  multiActive,
  onPick,
}: {
  num: number;
  upper: boolean;
  records: Rec[];
  selectedKey: string | null;
  multiActive?: boolean;
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

  const sel = selectedKey?.startsWith(`${num}-`) || multiActive;
  const selSurface = selectedKey?.startsWith(`${num}-`) ? selectedKey!.slice(`${num}-`.length) : null;
  const tooth = (
    <RealTooth
      num={num}
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
      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1 ${multiActive ? "bg-brand-100 ring-2 ring-brand-500" : sel ? "bg-brand-50 ring-1 ring-brand-300" : ""}`}
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

  // وضع تحديد عدّة أسنان
  const [multiMode, setMultiMode] = useState(false);
  const [multi, setMulti] = useState<number[]>([]);
  const [bulkSurface, setBulkSurface] = useState<string>("whole");
  const [bulkProcedure, setBulkProcedure] = useState<string>("");
  const [bulkNotes, setBulkNotes] = useState<string>("");
  const [bulkPending, startBulk] = useTransition();

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
  const pick = (tooth: number, surface: string) => {
    if (multiMode) {
      setMulti((prev) => (prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]));
    } else {
      setSelected({ tooth, surface });
    }
  };

  const submitBulk = () => {
    if (multi.length === 0) return;
    startBulk(async () => {
      await addToothRecordsBulk(
        patientId,
        multi,
        bulkSurface || null,
        bulkProcedure || null,
        bulkNotes || null,
      );
      setMulti([]);
      setBulkNotes("");
      setBulkProcedure("");
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <ChartDefs />
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-6">
          {/* تبديل دائمة / لبنية + وضع التحديد المتعدد */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
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
            <button
              onClick={() => { setMultiMode((v) => !v); setMulti([]); setSelected(null); }}
              className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${multiMode ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600 hover:border-brand-400"}`}
            >
              {multiMode ? tr("dent.multiOn") : tr("dent.multiSelect")}
            </button>
          </div>

          {/* الفك العلوي */}
          <p className="mb-1 text-center text-xs text-slate-400">{tr("dent.upper")}</p>
          <div className="flex justify-start gap-0.5 overflow-x-auto pb-2 sm:justify-center">
            {upperTeeth.map((n) => (
              <ToothUnit key={n} num={n} upper records={recordsByTooth.get(n) ?? []} selectedKey={selectedKey} multiActive={multi.includes(n)} onPick={pick} />
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-slate-200" />

          {/* الفك السفلي */}
          <div className="flex justify-start gap-0.5 overflow-x-auto pt-1 sm:justify-center">
            {lowerTeeth.map((n) => (
              <ToothUnit key={n} num={n} upper={false} records={recordsByTooth.get(n) ?? []} selectedKey={selectedKey} multiActive={multi.includes(n)} onPick={pick} />
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
          {multiMode ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-brand-50 p-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{multi.length}</p>
                <p className="text-xs text-brand-600">{tr("dent.teethSelected")}</p>
              </div>
              {multi.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">{tr("dent.multiHint")}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {multi.map((n) => (
                      <span key={n} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {n % 10}
                      </span>
                    ))}
                  </div>
                  <div>
                    <Label>{tr("dent.surface")}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SURFACES.map((s) => {
                        const active = bulkSurface === s.value;
                        return (
                          <button
                            type="button"
                            key={s.value}
                            onClick={() => setBulkSurface(s.value)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>{tr("dent.procedure")}</Label>
                    <Select value={bulkProcedure} onChange={(e) => setBulkProcedure(e.target.value)}>
                      <option value="">{tr("dent.noProcedure")}</option>
                      {procedures.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                      ))}
                    </Select>
                    <p className="mt-1 text-xs text-slate-400">{tr("dent.priceAuto")}</p>
                  </div>
                  <div>
                    <Label>{tr("form.notes")}</Label>
                    <Textarea rows={2} value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" className="flex-1" disabled={bulkPending} onClick={submitBulk}>
                      {bulkPending ? tr("form.saving") : tr("dent.applyToAll")}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setMulti([])}>
                      {tr("common.cancel")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : selected === null ? (
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
