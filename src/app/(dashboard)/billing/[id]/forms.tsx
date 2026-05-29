"use client";

import { useActionState, useTransition } from "react";
import {
  payInvoice,
  addInvoiceItem,
  deleteInvoiceItem,
  cancelInvoice,
} from "../actions";
import { Card, Button, Input, Label, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type Procedure = { id: string; name: string; price: number };

export function InvoiceForms({
  invoiceId,
  due,
  cancelled,
  procedures,
}: {
  invoiceId: string;
  due: number;
  cancelled: boolean;
  procedures: Procedure[];
}) {
  const [payState, payAction, payPending] = useActionState(payInvoice, undefined);
  const [itemState, itemAction, itemPending] = useActionState(addInvoiceItem, undefined);
  const [, startTransition] = useTransition();

  if (cancelled) {
    return (
      <Card className="p-5">
        <p className="text-center text-sm text-slate-500">هذه الفاتورة ملغاة</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* تسجيل دفعة */}
      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-slate-800">تسجيل دفعة</h3>
        <form action={payAction} className="space-y-3">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <div>
            <Label htmlFor="amount">المبلغ</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              dir="ltr"
              defaultValue={due > 0 ? due : ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="method">طريقة الدفع</Label>
            <Select id="method" name="method" defaultValue="CASH">
              <option value="CASH">نقدي</option>
              <option value="CARD">بطاقة</option>
              <option value="TRANSFER">تحويل</option>
              <option value="OTHER">أخرى</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">ملاحظة</Label>
            <Input id="note" name="note" />
          </div>
          {payState?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{payState.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={payPending}>
            {payPending ? "جارٍ الحفظ..." : "تسجيل الدفعة"}
          </Button>
        </form>
      </Card>

      {/* إضافة بند */}
      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-slate-800">إضافة بند</h3>
        <form action={itemAction} className="space-y-3">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <div>
            <Label htmlFor="procedureId">إجراء (اختياري)</Label>
            <Select id="procedureId" name="procedureId" defaultValue="">
              <option value="">— يدوي —</option>
              {procedures.map((p) => (
                <option key={p.id} value={p.id} data-price={p.price}>
                  {p.name} ({formatCurrency(p.price)})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="description">الوصف</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="quantity">الكمية</Label>
              <Input id="quantity" name="quantity" type="number" dir="ltr" defaultValue="1" />
            </div>
            <div>
              <Label htmlFor="unitPrice">سعر الوحدة</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" dir="ltr" defaultValue="0" />
            </div>
          </div>
          {itemState?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{itemState.error}</p>
          )}
          <Button type="submit" variant="secondary" className="w-full" disabled={itemPending}>
            {itemPending ? "..." : "إضافة بند"}
          </Button>
        </form>
      </Card>

      {/* إلغاء الفاتورة */}
      <Card className="p-5">
        <button
          onClick={() => {
            if (confirm("إلغاء هذه الفاتورة؟")) startTransition(() => cancelInvoice(invoiceId));
          }}
          className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          إلغاء الفاتورة
        </button>
      </Card>
    </div>
  );
}

export function InvoiceItemRow({
  id,
  description,
  quantity,
  unitPrice,
  total,
  cancelled,
}: {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cancelled: boolean;
}) {
  const [, startTransition] = useTransition();
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2 text-slate-800">{description}</td>
      <td className="px-4 py-2 text-slate-600">{quantity}</td>
      <td className="px-4 py-2 text-slate-600">{formatCurrency(unitPrice)}</td>
      <td className="px-4 py-2 font-medium">{formatCurrency(total)}</td>
      {!cancelled && (
        <td className="px-4 py-2">
          <button
            title="حذف"
            onClick={() => {
              if (confirm("حذف هذا البند؟")) startTransition(() => deleteInvoiceItem(id));
            }}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
