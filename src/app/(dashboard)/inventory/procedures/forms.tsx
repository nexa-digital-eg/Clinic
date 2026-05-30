"use client";

import { useActionState, useTransition } from "react";
import { linkProductToProcedure, unlinkProduct } from "../actions";
import { Card, Button, Label, Select, Input } from "@/components/ui";
import { Link2, X } from "lucide-react";
import { useT } from "@/lib/i18n-client";

type Opt = { id: string; name: string };

export function LinkForm({
  procedures,
  products,
}: {
  procedures: Opt[];
  products: (Opt & { unit: string })[];
}) {
  const tr = useT();
  const [state, formAction, pending] = useActionState(linkProductToProcedure, undefined);

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("inv.newLink")}</h3>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Label htmlFor="procedureId">{tr("dent.procedure")}</Label>
          <Select id="procedureId" name="procedureId" required defaultValue="">
            <option value="">{tr("form.choose")}</option>
            {procedures.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="min-w-48 flex-1">
          <Label htmlFor="productId">{tr("inv.productName")}</Label>
          <Select id="productId" name="productId" required defaultValue="">
            <option value="">{tr("form.choose")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <Label htmlFor="quantity">{tr("inv.qtyPerProc")}</Label>
          <Input id="quantity" name="quantity" type="number" step="0.01" dir="ltr" defaultValue="1" />
        </div>
        <Button type="submit" disabled={pending}>
          <Link2 className="h-4 w-4" />
          {pending ? "..." : tr("inv.link")}
        </Button>
      </form>
      {state?.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
    </Card>
  );
}

export function UnlinkButton({ id }: { id: string }) {
  const [, startTransition] = useTransition();
  return (
    <button
      title="إلغاء الربط"
      onClick={() => startTransition(() => unlinkProduct(id))}
      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
