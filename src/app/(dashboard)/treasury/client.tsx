"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExpense, deleteExpense } from "./actions";
import { Card, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { useT, useLocale } from "@/lib/i18n-client";
import { formatDate } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";

export function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  return (
    <Input
      type="month"
      dir="ltr"
      value={value}
      onChange={(e) => router.push(`/treasury?month=${e.target.value}`)}
      className="w-44"
    />
  );
}

export function ExpenseForm() {
  const tr = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(addExpense, undefined);
  const today = new Date().toISOString().slice(0, 10);

  const categories =
    locale === "ar"
      ? ["إيجار", "رواتب", "خامات ومستلزمات", "مشتريات", "كهرباء ومياه", "صيانة", "تسويق وإعلان", "نظافة", "ضرائب", "مصاريف بنكية", "أخرى"]
      : ["Rent", "Salaries", "Supplies", "Purchases", "Utilities", "Maintenance", "Marketing", "Cleaning", "Taxes", "Bank fees", "Other"];

  return (
    <Card className="p-5 lg:col-span-1">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("treasury.addExpense")}</h3>
      <datalist id="expense-cats">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="amount">{tr("treasury.amount")}</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="category">{tr("treasury.category")}</Label>
          <Input id="category" name="category" list="expense-cats" autoComplete="off" required placeholder={categories[0]} />
        </div>
        <div>
          <Label htmlFor="method">{tr("treasury.method")}</Label>
          <Select id="method" name="method" defaultValue="CASH">
            <option value="CASH">{tr("method.CASH")}</option>
            <option value="CARD">{tr("method.CARD")}</option>
            <option value="TRANSFER">{tr("method.TRANSFER")}</option>
            <option value="OTHER">{tr("method.OTHER")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="spentAt">{tr("treasury.spentAt")}</Label>
          <Input id="spentAt" name="spentAt" type="date" dir="ltr" defaultValue={today} />
        </div>
        <div>
          <Label htmlFor="note">{tr("form.notes")}</Label>
          <Textarea id="note" name="note" rows={2} />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{tr("treasury.saved")}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          <Plus className="h-4 w-4" />
          {pending ? "..." : tr("treasury.addExpense")}
        </Button>
      </form>
    </Card>
  );
}

export function ExpenseRow({
  id,
  amount,
  category,
  method,
  note,
  spentAt,
}: {
  id: string;
  amount: string;
  category: string;
  method: string;
  note: string | null;
  spentAt: string;
}) {
  const tr = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800">{category}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{method}</span>
        </div>
        <p className="text-xs text-slate-400">
          {formatDate(spentAt)}
          {note ? ` · ${note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-red-600" dir="ltr">
          {amount}
        </span>
        <button
          title={tr("common.delete")}
          onClick={() => {
            if (confirm(tr("common.delete") + "؟")) startTransition(() => deleteExpense(id));
          }}
          disabled={pending}
          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
