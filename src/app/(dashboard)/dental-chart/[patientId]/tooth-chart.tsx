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
type Record = {
  id: string;
  toothNumber: number;
  surface: string | null;
  procedureName: string | null;
  price: number;
  status: string;
};

export function ToothChart({
  patientId,
  procedures,
  records,
}: {
  patientId: string;
  procedures: Procedure[];
  records: Record[];
}) {
  const tr = useT();
  const [selected, setSelected] = useState<number | null>(null);
  const [dentition, setDentition] = useState<"permanent" | "primary">("permanent");
  const [state, formAction, pending] = useActionState(addToothRecord, undefined);
  const [, startTransition] = useTransition();

  const upperTeeth = dentition === "permanent" ? UPPER_TEETH : UPPER_PRIMARY_TEETH;
  const lowerTeeth = dentition === "permanent" ? LOWER_TEETH : LOWER_PRIMARY_TEETH;

  // أغلق نموذج الإضافة بعد الحفظ الناجح
  useEffect(() => {
    if (state && !state.error) setSelected(null);
  }, [state]);

  const recordsByTooth = new Map<number, Record[]>();
  for (const r of records) {
    if (!recordsByTooth.has(r.toothNumber)) recordsByTooth.set(r.toothNumber, []);
    recordsByTooth.get(r.toothNumber)!.push(r);
  }

  const toothState = (num: number): "none" | "planned" | "done" => {
    const recs = recordsByTooth.get(num);
    if (!recs || recs.length === 0) return "none";
    return recs.some((r) => r.status !== "done") ? "planned" : "done";
  };

  const Tooth = ({ num }: { num: number }) => {
    const st = toothState(num);
    const isSel = selected === num;
    const colors = {
      none: "bg-white border-slate-200 text-slate-600 hover:border-brand-400",
      planned: "bg-yellow-50 border-yellow-300 text-yellow-700",
      done: "bg-green-50 border-green-300 text-green-700",
    };
    return (
      <button
        onClick={() => setSelected(isSel ? null : num)}
        title={`${tr("dent.tooth")} ${num} - ${toothName(num)}`}
        className={`flex h-11 w-9 flex-col items-center justify-center rounded-md border text-xs font-medium transition-all ${colors[st]} ${isSel ? "ring-2 ring-brand-500 ring-offset-1" : ""}`}
      >
        <span className="text-[10px]">{num}</span>
        <span className="mt-0.5 h-1.5 w-1.5 rounded-full" />
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* المخطط */}
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-6">
          {/* تبديل بين الأسنان الدائمة واللبنية */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => {
                  setDentition("permanent");
                  setSelected(null);
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${dentition === "permanent" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
              >
                {tr("dent.permanent")}
              </button>
              <button
                onClick={() => {
                  setDentition("primary");
                  setSelected(null);
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${dentition === "primary" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
              >
                {tr("dent.primary")}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-center text-xs text-slate-400">{tr("dent.upper")}</p>
              <div className="flex flex-wrap justify-center gap-1">
                {upperTeeth.map((n) => (
                  <Tooth key={n} num={n} />
                ))}
              </div>
            </div>
            <div className="border-t border-dashed border-slate-200" />
            <div>
              <div className="flex flex-wrap justify-center gap-1">
                {lowerTeeth.map((n) => (
                  <Tooth key={n} num={n} />
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">{tr("dent.lower")}</p>
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-slate-200 bg-white" /> {tr("dent.healthy")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-yellow-300 bg-yellow-50" /> {tr("dent.planned")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-green-300 bg-green-50" /> {tr("dent.done")}
            </span>
          </div>
        </Card>

        {/* قائمة سجلات الأسنان */}
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
                <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
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
                                setToothStatus(
                                  r.id,
                                  patientId,
                                  r.status === "done" ? "planned" : "done",
                                ),
                              )
                            }
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                          >
                            {r.status === "done" ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
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
              <input type="hidden" name="toothNumber" value={selected} />

              <div className="rounded-lg bg-brand-50 p-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{tr("dent.tooth")} {selected}</p>
                <p className="text-xs text-brand-600">{toothName(selected)}</p>
              </div>

              <div>
                <Label htmlFor="surface">{tr("dent.surface")}</Label>
                <Select id="surface" name="surface" defaultValue="whole">
                  {SURFACES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
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
                <p className="mt-1 text-xs text-slate-400">
                  {tr("dent.priceAuto")}
                </p>
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
