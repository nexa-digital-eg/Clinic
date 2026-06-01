"use client";

import { useTransition } from "react";
import { deletePatient } from "../actions";
import { useT } from "@/lib/i18n-client";
import { Trash2 } from "lucide-react";

export function DeletePatientButton({ id, name }: { id: string; name: string }) {
  const tr = useT();
  const [pending, startTransition] = useTransition();

  return (
    <button
      title={tr("common.delete")}
      disabled={pending}
      onClick={() => {
        if (confirm(`${tr("patientDelete.confirm")}\n${name}`)) {
          startTransition(() => deletePatient(id));
        }
      }}
      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );
}
