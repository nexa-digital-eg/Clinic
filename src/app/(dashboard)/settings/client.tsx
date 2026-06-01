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
  updateStaff,
  deleteStaff,
  importMedications,
  clearMedications,
} from "./actions";
import { Button, Card, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Check, Power, Upload, Pill, Trash2, FileSpreadsheet, ShieldCheck, ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n-client";
import { GRANTABLE_SECTIONS } from "@/lib/permissions";

// يصغّر الصورة ويحوّلها إلى data URL (تُخزَّن في قاعدة البيانات مباشرة)
function fileToDataUrl(file: File, maxDim = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}

/* ===== بيانات العيادة ===== */
export function ClinicForm({
  clinic,
}: {
  clinic: { name: string; logoUrl: string; address: string; phone: string; email: string; currency: string };
}) {
  const [state, action, pending] = useActionState(updateClinic, undefined);
  const tr = useT();
  const [logoUrl, setLogoUrl] = useState<string | null>(clinic.logoUrl || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const onLogo = async (file: File) => {
    setLogoError(null);
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToDataUrl(file, 400);
      setLogoUrl(dataUrl);
    } catch (e) {
      setLogoError((e as Error).message || "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

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
        <Label>{tr("set.logo")}</Label>
        {/* الرابط يُحفظ تلقائياً بعد الرفع */}
        <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="logo" className="h-16 w-16 rounded-lg border border-slate-200 object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-2xl text-slate-300">🦷</div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Upload className="h-4 w-4" />
            {uploadingLogo ? tr("set.uploadingLogo") : tr("set.uploadLogo")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLogo(f);
              }}
            />
          </label>
          {logoUrl && (
            <button
              type="button"
              onClick={() => setLogoUrl(null)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              {tr("common.delete")}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">{tr("set.logoHint")}</p>
        {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
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
// قائمة اختيار الأقسام المسموح بها
function PermissionChecklist({ selected }: { selected?: string[] }) {
  const tr = useT();
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 p-3">
      {GRANTABLE_SECTIONS.map((s) => (
        <label key={s.key} className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="permissions"
            value={s.key}
            defaultChecked={selected?.includes(s.key)}
            className="h-4 w-4 rounded border-slate-300"
          />
          {tr(s.navKey)}
        </label>
      ))}
    </div>
  );
}

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
          <Label htmlFor="stitle">{tr("set.jobTitle")}</Label>
          <Input id="stitle" name="title" placeholder={tr("set.jobTitleHint")} />
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
        <div>
          <Label>{tr("set.permissions")}</Label>
          {role === "ADMIN" ? (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">{tr("set.adminAll")}</p>
          ) : (
            <>
              <PermissionChecklist />
              <p className="mt-1 text-xs text-slate-400">{tr("set.permHint")}</p>
            </>
          )}
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{tr("set.userCreated")}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "..." : tr("set.createUser")}</Button>
      </form>
    </div>
  );
}

// محرّر بيانات المستخدم (الاسم/البريد/الدور/المسمى/الصلاحيات) + الحذف
export function StaffAccessEditor({
  id,
  name,
  email,
  role,
  title,
  permissions,
  isSelf,
}: {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  permissions: string[];
  isSelf: boolean;
}) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [curRole, setCurRole] = useState(role);
  const bound = updateStaff.bind(null, id);
  const [state, action, pending] = useActionState(bound, undefined);
  const [deleting, startDelete] = useTransition();

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {tr("set.editUser")}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <form action={action} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor={`name-${id}`}>{tr("col.name")}</Label>
              <Input id={`name-${id}`} name="name" defaultValue={name} required />
            </div>
            <div>
              <Label htmlFor={`email-${id}`}>{tr("form.email")}</Label>
              <Input id={`email-${id}`} name="email" type="email" dir="ltr" defaultValue={email} required />
            </div>
            <div>
              <Label htmlFor={`role-${id}`}>{tr("set.userRole")}</Label>
              <Select id={`role-${id}`} name="role" value={curRole} onChange={(e) => setCurRole(e.target.value)}>
                <option value="RECEPTIONIST">{tr("role.RECEPTIONIST")}</option>
                <option value="DOCTOR">{tr("role.DOCTOR")}</option>
                <option value="ADMIN">{tr("role.ADMIN")}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor={`title-${id}`}>{tr("set.jobTitle")}</Label>
              <Input id={`title-${id}`} name="title" defaultValue={title ?? ""} placeholder={tr("set.jobTitleHint")} />
            </div>
          </div>
          {curRole === "ADMIN" ? (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">{tr("set.adminAll")}</p>
          ) : (
            <PermissionChecklist selected={permissions} />
          )}
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state?.ok && <p className="text-xs text-green-600">{tr("set.saved")}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" className="flex-1" disabled={pending}>
              {pending ? "..." : tr("common.save")}
            </Button>
            {!isSelf && (
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  if (confirm(`${tr("set.deleteUserConfirm")}\n${name}`)) {
                    startDelete(async () => {
                      const res = await deleteStaff(id);
                      if (res?.error) alert(res.error);
                    });
                  }
                }}
                className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {tr("common.delete")}
              </button>
            )}
          </div>
        </form>
      )}
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

export function MedicationsManager({
  count,
  sample,
}: {
  count: number;
  sample: string[];
}) {
  const tr = useT();
  const [state, action, pending] = useActionState(importMedications, undefined);
  const [, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-1">
        <div className="mb-3 flex items-center gap-2">
          <Pill className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-slate-800">{tr("med.title")}</h2>
        </div>
        <p className="mb-4 text-sm text-slate-500">{tr("med.desc")}</p>

        <div className="mb-4 rounded-lg bg-brand-50 px-4 py-3">
          <p className="text-xs text-slate-500">{tr("med.count")}</p>
          <p className="text-2xl font-bold text-brand-700" dir="ltr">{count}</p>
        </div>

        <form action={action} className="space-y-3">
          <Label htmlFor="file">{tr("med.upload")}</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            required
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
          />
          <p className="text-xs text-slate-400">{tr("med.cols")}</p>
          <Button type="submit" className="w-full" disabled={pending}>
            <Upload className="h-4 w-4" />
            {pending ? tr("med.uploading") : tr("med.upload")}
          </Button>
        </form>

        {state?.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
            {tr("med.imported")
              .replace("{n}", String(state.added ?? 0))
              .replace("{total}", String(state.total ?? 0))}
          </p>
        )}

        {count > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm(tr("med.clearConfirm"))) startTransition(() => clearMedications());
            }}
            className="mt-3 flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            {tr("med.clear")}
          </button>
        )}
      </Card>

      <Card className="p-6 lg:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">{tr("med.sample")}</h3>
        </div>
        {sample.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{tr("med.none")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sample.map((n) => (
              <span key={n} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {n}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
