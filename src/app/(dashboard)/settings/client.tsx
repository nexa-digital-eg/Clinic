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
import { useT } from "@/lib/i18n-client";

/* ===== بيانات العيادة ===== */
export function ClinicForm({
  clinic,
}: {
  clinic: { name: string; logoUrl: string; address: string; phone: string; email: string; currency: string };
}) {
  const [state, action, pending] = useActionState(updateClinic, undefined);
  const tr = useT();
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">{tr("set.clinicName")}</Label>
          <Input id="name" name="name" defaultValue={clinic.name} required />
        </div>
        <div>
          <Label htmlFor="currency">{tr("set.currency")}</Label>
          <Input id="currency" name="currency" defaultValue={clinic.currency} />
        </div>
        <div>
          <Label htmlFor="phone">{tr("form.phone")}</Label>
          <Input id="phone" name="phone" dir="ltr" defaultValue={clinic.phone} />
        </div>
        <div>
          <Label htmlFor="email">{tr("form.email")}</Label>
          <Input id="email" name="email" dir="ltr" defaultValue={clinic.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">{tr("form.address")}</Label>
        <Input id="address" name="address" defaultValue={clinic.address} />
      </div>
      <div>
        <Label htmlFor="logoUrl">{tr("set.logoUrl")}</Label>
        <Input id="logoUrl" name="logoUrl" dir="ltr" defaultValue={clinic.logoUrl} placeholder="https://..." />
        <p className="mt-1 text-xs text-slate-400">{tr("set.logoHint")}</p>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{tr("set.saved")}</p>}
      <Button type="submit" disabled={pending}>{pending ? tr("form.saving") : tr("set.saveInfo")}</Button>
    </form>
  );
}

/* ===== الإجراءات ===== */
export function ProcedureForm() {
  const [state, action, pending] = useActionState(createProcedure, undefined);
  const tr = useT();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("set.newProcedure")}</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="pname">{tr("set.procName")}</Label>
          <Input id="pname" name="name" required />
        </div>
        <div>
          <Label htmlFor="pprice">{tr("set.price")}</Label>
          <Input id="pprice" name="price" type="number" step="0.01" dir="ltr" defaultValue="0" />
        </div>
        <div>
          <Label htmlFor="pdesc">{tr("set.desc")}</Label>
          <Textarea id="pdesc" name="description" rows={2} />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : tr("common.add")}</Button>
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
  const tr = useT();

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
            <Label>{tr("col.name")}</Label>
            <Input name="name" defaultValue={name} />
          </div>
          <div className="w-32">
            <Label>{tr("set.price")}</Label>
            <Input name="price" type="number" step="0.01" dir="ltr" defaultValue={price} />
          </div>
          <Button type="submit">{tr("common.save")}</Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>{tr("common.cancel")}</Button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{name}</span>
            {!isActive && <Badge color="red">{tr("set.disabled")}</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-brand-700">{formatCurrency(price)}</span>
            <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:underline">{tr("common.edit")}</button>
            <button
              onClick={() => startTransition(() => toggleProcedure(id, !isActive))}
              title={isActive ? tr("set.deactivate") : tr("set.activate")}
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
  const tr = useT();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("set.newBranch")}</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="bname">{tr("set.branchName")}</Label>
          <Input id="bname" name="name" required />
        </div>
        <div>
          <Label htmlFor="baddr">{tr("form.address")}</Label>
          <Input id="baddr" name="address" />
        </div>
        <div>
          <Label htmlFor="bphone">{tr("form.phone")}</Label>
          <Input id="bphone" name="phone" dir="ltr" />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : tr("set.addBranch")}</Button>
      </form>
    </div>
  );
}

export function BranchToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [, startTransition] = useTransition();
  const tr = useT();
  return (
    <button
      onClick={() => startTransition(() => toggleBranch(id, !isActive))}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${isActive ? "text-slate-500 hover:bg-slate-100" : "text-green-600 hover:bg-green-50"}`}
    >
      <Power className="h-4 w-4" />
      {isActive ? tr("set.deactivate") : tr("set.activate")}
    </button>
  );
}

/* ===== المستخدمون ===== */
export function StaffForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createStaff, undefined);
  const [role, setRole] = useState("RECEPTIONIST");
  const tr = useT();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("set.newUser")}</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="sname">{tr("col.name")}</Label>
          <Input id="sname" name="name" required />
        </div>
        <div>
          <Label htmlFor="semail">{tr("form.email")}</Label>
          <Input id="semail" name="email" type="email" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="spass">{tr("set.password")}</Label>
          <Input id="spass" name="password" type="text" dir="ltr" required />
        </div>
        <div>
          <Label htmlFor="srole">{tr("set.userRole")}</Label>
          <Select id="srole" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="RECEPTIONIST">{tr("role.RECEPTIONIST")}</option>
            <option value="DOCTOR">{tr("role.DOCTOR")}</option>
            <option value="ADMIN">{tr("role.ADMIN")}</option>
          </Select>
        </div>
        {role === "DOCTOR" && (
          <div>
            <Label htmlFor="sspec">{tr("set.specialty")}</Label>
            <Input id="sspec" name="specialty" />
          </div>
        )}
        <div>
          <Label htmlFor="sbranch">{tr("form.branch")}</Label>
          <Select id="sbranch" name="branchId" defaultValue="">
            <option value="">{tr("common.none")}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{tr("set.userCreated")}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : tr("set.createUser")}</Button>
      </form>
    </div>
  );
}

export function StaffToggle({ id, isActive, self }: { id: string; isActive: boolean; self: boolean }) {
  const [, startTransition] = useTransition();
  const tr = useT();
  if (self) return <span className="text-xs text-slate-400">{tr("set.you")}</span>;
  return (
    <button
      onClick={() => startTransition(() => toggleStaff(id, !isActive))}
      title={isActive ? tr("set.deactivate") : tr("set.activate")}
      className={`rounded p-1.5 ${isActive ? "text-slate-400 hover:bg-slate-100" : "text-green-600 hover:bg-green-50"}`}
    >
      {isActive ? <Power className="h-4 w-4" /> : <Check className="h-4 w-4" />}
    </button>
  );
}
