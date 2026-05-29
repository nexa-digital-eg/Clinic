"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateClinic,
  createProcedure,
  updateProcedurePrice,
  toggleProcedure,
  createBranch,
  toggleBranch,
  createStaff,
  toggleStaff,
} from "./actions";
import { Button, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Check, Power } from "lucide-react";

/* ===== بيانات العيادة ===== */
export function ClinicForm({
  clinic,
}: {
  clinic: { name: string; logoUrl: string; address: string; phone: string; email: string; currency: string };
}) {
  const [state, action, pending] = useActionState(updateClinic, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">اسم العيادة</Label>
          <Input id="name" name="name" defaultValue={clinic.name} required />
        </div>
        <div>
          <Label htmlFor="currency">العملة</Label>
          <Input id="currency" name="currency" defaultValue={clinic.currency} />
        </div>
        <div>
          <Label htmlFor="phone">الهاتف</Label>
          <Input id="phone" name="phone" dir="ltr" defaultValue={clinic.phone} />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" dir="ltr" defaultValue={clinic.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">العنوان</Label>
        <Input id="address" name="address" defaultValue={clinic.address} />
      </div>
      <div>
        <Label htmlFor="logoUrl">رابط الشعار (Logo URL)</Label>
        <Input id="logoUrl" name="logoUrl" dir="ltr" defaultValue={clinic.logoUrl} placeholder="https://..." />
        <p className="mt-1 text-xs text-slate-400">يظهر في الفواتير والروشتات المطبوعة</p>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">تم الحفظ ✅</p>}
      <Button type="submit" disabled={pending}>{pending ? "جارٍ الحفظ..." : "حفظ البيانات"}</Button>
    </form>
  );
}

/* ===== الإجراءات ===== */
export function ProcedureForm() {
  const [state, action, pending] = useActionState(createProcedure, undefined);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">إجراء جديد</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="pname">اسم الإجراء</Label>
          <Input id="pname" name="name" required />
        </div>
        <div>
          <Label htmlFor="pprice">السعر</Label>
          <Input id="pprice" name="price" type="number" step="0.01" dir="ltr" defaultValue="0" />
        </div>
        <div>
          <Label htmlFor="pdesc">الوصف</Label>
          <Textarea id="pdesc" name="description" rows={2} />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : "إضافة"}</Button>
      </form>
    </div>
  );
}

export function ProcedureRow({
  id,
  name,
  price,
  isActive,
}: {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();
  const updateBound = updateProcedurePrice.bind(null, id);

  return (
    <div className="px-5 py-3">
      {editing ? (
        <form
          action={(fd) => {
            startTransition(async () => {
              await updateBound(fd);
              setEditing(false);
            });
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <Label>الاسم</Label>
            <Input name="name" defaultValue={name} />
          </div>
          <div className="w-32">
            <Label>السعر</Label>
            <Input name="price" type="number" step="0.01" dir="ltr" defaultValue={price} />
          </div>
          <Button type="submit">حفظ</Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>إلغاء</Button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{name}</span>
            {!isActive && <Badge color="red">معطّل</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-brand-700">{formatCurrency(price)}</span>
            <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:underline">تعديل</button>
            <button
              onClick={() => startTransition(() => toggleProcedure(id, !isActive))}
              title={isActive ? "تعطيل" : "تفعيل"}
              className={`rounded p-1.5 ${isActive ? "text-slate-400 hover:bg-slate-100" : "text-green-600 hover:bg-green-50"}`}
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== الفروع ===== */
export function BranchForm() {
  const [state, action, pending] = useActionState(createBranch, undefined);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">فرع جديد</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="bname">اسم الفرع</Label>
          <Input id="bname" name="name" required />
        </div>
        <div>
          <Label htmlFor="baddr">العنوان</Label>
          <Input id="baddr" name="address" />
        </div>
        <div>
          <Label htmlFor="bphone">الهاتف</Label>
          <Input id="bphone" name="phone" dir="ltr" />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : "إضافة الفرع"}</Button>
      </form>
    </div>
  );
}

export function BranchToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => toggleBranch(id, !isActive))}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${isActive ? "text-slate-500 hover:bg-slate-100" : "text-green-600 hover:bg-green-50"}`}
    >
      <Power className="h-4 w-4" />
      {isActive ? "تعطيل" : "تفعيل"}
    </button>
  );
}

/* ===== المستخدمون ===== */
export function StaffForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createStaff, undefined);
  const [role, setRole] = useState("RECEPTIONIST");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">مستخدم جديد</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="sname">الاسم</Label>
          <Input id="sname" name="name" required />
        </div>
        <div>
          <Label htmlFor="semail">البريد الإلكتروني</Label>
          <Input id="semail" name="email" type="email" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="spass">كلمة المرور</Label>
          <Input id="spass" name="password" type="text" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="srole">الدور</Label>
          <Select id="srole" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="RECEPTIONIST">سكرتارية</option>
            <option value="DOCTOR">طبيب</option>
            <option value="ADMIN">مدير</option>
          </Select>
        </div>
        {role === "DOCTOR" && (
          <div>
            <Label htmlFor="sspec">التخصص</Label>
            <Input id="sspec" name="specialty" placeholder="أسنان عام" />
          </div>
        )}
        <div>
          <Label htmlFor="sbranch">الفرع</Label>
          <Select id="sbranch" name="branchId" defaultValue="">
            <option value="">— بدون —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">تم إنشاء المستخدم ✅</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : "إنشاء المستخدم"}</Button>
      </form>
    </div>
  );
}

export function StaffToggle({ id, isActive, self }: { id: string; isActive: boolean; self: boolean }) {
  const [, startTransition] = useTransition();
  if (self) return <span className="text-xs text-slate-400">(أنت)</span>;
  return (
    <button
      onClick={() => startTransition(() => toggleStaff(id, !isActive))}
      title={isActive ? "تعطيل" : "تفعيل"}
      className={`rounded p-1.5 ${isActive ? "text-slate-400 hover:bg-slate-100" : "text-green-600 hover:bg-green-50"}`}
    >
      {isActive ? <Power className="h-4 w-4" /> : <Check className="h-4 w-4" />}
    </button>
  );
}
