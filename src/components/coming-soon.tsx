import { Card } from "@/components/ui";
import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  phase,
  features,
}: {
  title: string;
  phase: string;
  features: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500">{phase}</p>
      </div>
      <Card className="p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Construction className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            هذه الميزة قيد التطوير
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ستتوفر في {phase} حسب خطة المشروع
          </p>
          <ul className="mt-6 space-y-2 text-right text-sm text-slate-600">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
