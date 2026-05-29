import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Package as PackageIcon } from "lucide-react";
import { PackageCatalogForm, AssignPackageForm, DeletePackageButton } from "./forms";

export default async function PackagesPage() {
  const [packages, patientPackages, patients] = await Promise.all([
    db.package.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    db.patientPackage.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { patient: true, package: true },
    }),
    db.patient.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">الباقات</h1>
        <p className="text-sm text-slate-500">باقات متعددة الجلسات ومتابعتها مع المرضى</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* كتالوج الباقات */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">كتالوج الباقات</h2>
            </div>
            {packages.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <PackageIcon className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">لا توجد باقات</p>
                <p className="mt-1 text-xs text-slate-400">أنشئ أول باقة من النموذج</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-slate-800">{pkg.name}</h3>
                      <DeletePackageButton id={pkg.id} />
                    </div>
                    {pkg.description && (
                      <p className="mt-1 text-xs text-slate-500">{pkg.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <Badge color="blue">{pkg.sessionCount} جلسة</Badge>
                      <span className="font-bold text-brand-700">{formatCurrency(pkg.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* باقات المرضى النشطة */}
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">باقات المرضى</h2>
            </div>
            {patientPackages.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">لا توجد باقات مُسندة</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {patientPackages.map((pp) => {
                  const pct = Math.round((pp.usedSessions / pp.totalSessions) * 100);
                  return (
                    <Link
                      key={pp.id}
                      href={`/packages/${pp.id}`}
                      className="block px-5 py-4 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">
                            {pp.patient.firstName} {pp.patient.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{pp.package.name}</p>
                        </div>
                        <div className="text-left">
                          {pp.isActive ? (
                            <Badge color="green">نشطة</Badge>
                          ) : (
                            <Badge color="slate">منتهية</Badge>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            {pp.usedSessions} / {pp.totalSessions} جلسة
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* النماذج */}
        <div className="space-y-6">
          <PackageCatalogForm />
          <AssignPackageForm
            patients={patients.map((p) => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              code: p.code,
            }))}
            packages={packages.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>
      </div>
    </div>
  );
}
