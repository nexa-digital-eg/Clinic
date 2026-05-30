"use client";

import { useActionState, useTransition } from "react";
import { createPackage, assignPackage, deletePackage } from "./actions";
import { Card, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n-client";

export function PackageCatalogForm() {
  const tr = useT();
  const [state, action, pending] = useActionState(createPackage, undefined);
  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("pkg.newPackage")}</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="name">{tr("pkg.name")}</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="description">{tr("set.desc")}</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="sessionCount">{tr("pkg.sessionCount")}</Label>
            <Input id="sessionCount" name="sessionCount" type="number" dir="ltr" defaultValue="4" />
          </div>
          <div>
            <Label htmlFor="price">{tr("pkg.price")}</Label>
            <Input id="price" name="price" type="number" step="0.01" dir="ltr" defaultValue="0" />
          </div>
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "..." : tr("pkg.create")}
        </Button>
      </form>
    </Card>
  );
}

export function AssignPackageForm({
  patients,
  packages,
}: {
  patients: { id: string; name: string; code: string }[];
  packages: { id: string; name: string }[];
}) {
  const tr = useT();
  const [state, action, pending] = useActionState(assignPackage, undefined);
  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-slate-800">{tr("pkg.assignTitle")}</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor="patientId">{tr("form.patient")}</Label>
          <Select id="patientId" name="patientId" required defaultValue="">
            <option value="">{tr("form.choosePatient")}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="packageId">{tr("packages.title")}</Label>
          <Select id="packageId" name="packageId" required defaultValue="">
            <option value="">{tr("form.choose")}</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
          {pending ? "..." : tr("pkg.assign")}
        </Button>
      </form>
    </Card>
  );
}

export function DeletePackageButton({ id }: { id: string }) {
  const tr = useT();
  const [, startTransition] = useTransition();
  return (
    <button
      title="حذف"
      onClick={() => {
        if (confirm(tr("pkg.confirmDel"))) startTransition(() => deletePackage(id));
      }}
      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
