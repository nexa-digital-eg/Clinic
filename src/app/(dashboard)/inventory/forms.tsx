"use client";

import { useActionState, useState, useTransition } from "react";
import { createProduct, adjustStock, deleteProduct } from "./actions";
import { Card, Button, Input, Label, Select, Badge } from "@/components/ui";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n-client";

export function ProductForms() {
  const tr = useT();
  const [state, formAction, pending] = useActionState(createProduct, undefined);

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("inv.newProduct")}</h3>
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="name">{tr("inv.productName")}</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="sku">{tr("inv.sku")}</Label>
            <Input id="sku" name="sku" dir="ltr" />
          </div>
          <div>
            <Label htmlFor="unit">{tr("inv.unit")}</Label>
            <Input id="unit" name="unit" placeholder={tr("common.piece")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="quantity">{tr("inv.currentQty")}</Label>
            <Input id="quantity" name="quantity" type="number" step="0.01" dir="ltr" defaultValue="0" />
          </div>
          <div>
            <Label htmlFor="minQuantity">{tr("inv.minQty")}</Label>
            <Input id="minQuantity" name="minQuantity" type="number" step="0.01" dir="ltr" defaultValue="0" />
          </div>
        </div>
        <div>
          <Label htmlFor="costPrice">{tr("inv.cost")}</Label>
          <Input id="costPrice" name="costPrice" type="number" step="0.01" dir="ltr" defaultValue="0" />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? tr("form.saving") : tr("common.add")}
        </Button>
      </form>
    </Card>
  );
}

export function ProductRow({
  id,
  name,
  sku,
  unit,
  quantity,
  minQuantity,
  linkedCount,
}: {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  linkedCount: number;
}) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const low = quantity <= minQuantity;

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-2">
          <p className="font-medium text-slate-800">{name}</p>
          {sku && <p className="font-mono text-xs text-slate-400">{sku}</p>}
        </td>
        <td className="px-4 py-2">
          <span className={low ? "font-bold text-red-600" : "text-slate-700"}>
            {quantity} {unit}
          </span>
        </td>
        <td className="px-4 py-2 text-slate-500">{minQuantity}</td>
        <td className="px-4 py-2 text-slate-500">{linkedCount}</td>
        <td className="px-4 py-2">
          {low ? <Badge color="red">{tr("inv.belowMin")}</Badge> : <Badge color="green">{tr("inv.available")}</Badge>}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              title={tr("inv.stockMovement")}
              onClick={() => setOpen((v) => !v)}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              title={tr("common.delete")}
              onClick={() => {
                if (confirm(tr("inv.confirmDel"))) startTransition(() => deleteProduct(id));
              }}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50">
          <td colSpan={6} className="px-4 py-3">
            <form action={adjustStock} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="productId" value={id} />
              <div>
                <Label htmlFor={`type-${id}`}>{tr("inv.movement")}</Label>
                <Select id={`type-${id}`} name="type" defaultValue="IN" className="w-36">
                  <option value="IN">{tr("inv.in")}</option>
                  <option value="OUT">{tr("inv.out")}</option>
                  <option value="ADJUST">{tr("inv.adjust")}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor={`qty-${id}`}>{tr("col.qty")}</Label>
                <Input id={`qty-${id}`} name="quantity" type="number" step="0.01" dir="ltr" className="w-28" defaultValue="1" />
              </div>
              <div className="flex-1">
                <Label htmlFor={`reason-${id}`}>{tr("col.reason")}</Label>
                <Input id={`reason-${id}`} name="reason" placeholder={tr("common.optional")} />
              </div>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                {tr("inv.apply")}
              </Button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
