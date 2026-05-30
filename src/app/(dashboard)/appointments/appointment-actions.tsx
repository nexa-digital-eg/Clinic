"use client";

import { useState, useTransition } from "react";
import { updateAppointmentStatus, deleteAppointment } from "./actions";
import type { AppointmentStatus } from "@prisma/client";
import { Check, X, Clock, Trash2, MoreVertical } from "lucide-react";
import { useT } from "@/lib/i18n-client";

export function AppointmentActions({
  id,
  status,
}: {
  id: string;
  status: AppointmentStatus;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const tr = useT();

  const setStatus = (s: AppointmentStatus) => {
    startTransition(async () => {
      await updateAppointmentStatus(id, s);
      setOpen(false);
    });
  };

  const remove = () => {
    if (!confirm(tr("apptAct.confirmDelete"))) return;
    startTransition(async () => {
      await deleteAppointment(id);
      setOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <MenuItem icon={<Check className="h-4 w-4 text-green-600" />} label={tr("apptAct.complete")} onClick={() => setStatus("COMPLETED")} active={status === "COMPLETED"} />
            <MenuItem icon={<Clock className="h-4 w-4 text-brand-600" />} label={tr("apptAct.confirm")} onClick={() => setStatus("CONFIRMED")} active={status === "CONFIRMED"} />
            <MenuItem icon={<X className="h-4 w-4 text-slate-500" />} label={tr("apptAct.noShow")} onClick={() => setStatus("NO_SHOW")} active={status === "NO_SHOW"} />
            <MenuItem icon={<X className="h-4 w-4 text-red-600" />} label={tr("apptAct.cancel")} onClick={() => setStatus("CANCELLED")} active={status === "CANCELLED"} />
            <div className="my-1 border-t border-slate-100" />
            <MenuItem icon={<Trash2 className="h-4 w-4 text-red-600" />} label={tr("apptAct.delete")} onClick={remove} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-right text-sm hover:bg-slate-50 ${active ? "bg-slate-50 font-medium" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}
