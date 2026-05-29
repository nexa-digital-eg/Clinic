"use client";

import { useTransition } from "react";
import { completeSession, scheduleSession } from "../actions";
import { Button } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

export function SessionRow({
  id,
  patientPackageId,
  sessionNumber,
  scheduledAt,
  completed,
}: {
  id: string;
  patientPackageId: string;
  sessionNumber: number;
  scheduledAt: string | null;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const scheduleBound = scheduleSession.bind(null, id, patientPackageId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        ) : (
          <Circle className="h-6 w-6 text-slate-300" />
        )}
        <div>
          <p className="font-medium text-slate-800">الجلسة {sessionNumber}</p>
          {scheduledAt && (
            <p className="text-xs text-slate-400">موعد: {formatDateTime(scheduledAt)}</p>
          )}
        </div>
      </div>

      {!completed && (
        <div className="flex items-center gap-2">
          <form action={scheduleBound} className="flex items-center gap-2">
            <input
              type="datetime-local"
              name="scheduledAt"
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              dir="ltr"
            />
            <Button type="submit" variant="secondary">جدولة</Button>
          </form>
          <Button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => completeSession(id, patientPackageId))}
          >
            {pending ? "..." : "إتمام الجلسة"}
          </Button>
        </div>
      )}
    </div>
  );
}
