"use client";

import { useTransition } from "react";
import { deleteTemplate } from "./actions";
import { Trash2 } from "lucide-react";

export function DeleteTemplateButton({ id }: { id: string }) {
  const [, startTransition] = useTransition();
  return (
    <button
      title="حذف النموذج"
      onClick={() => {
        if (confirm("حذف هذا النموذج؟")) startTransition(() => deleteTemplate(id));
      }}
      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
