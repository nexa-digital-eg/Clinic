import { db } from "@/lib/db";
import { Card, EmptyState } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { LinkForm, UnlinkButton } from "./forms";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function ProcedureLinksPage() {
  const locale = await getLocale();
  const [procedures, products] = await Promise.all([
    db.procedure.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { products: { include: { product: true } } },
    }),
    db.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("inv.linkTitle", locale)}</h1>
          <p className="text-sm text-slate-500">
            {t("inv.linkSubtitle", locale)}
          </p>
        </div>
      </div>

      <LinkForm
        procedures={procedures.map((p) => ({ id: p.id, name: p.name }))}
        products={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {procedures.map((proc) => (
          <Card key={proc.id} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{proc.name}</h3>
              <span className="text-sm text-slate-400">{formatCurrency(proc.price)}</span>
            </div>
            {proc.products.length === 0 ? (
              <p className="text-sm text-slate-400">{t("inv.noLinked", locale)}</p>
            ) : (
              <ul className="space-y-2">
                {proc.products.map((pp) => (
                  <li
                    key={pp.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700">
                      {pp.product.name}
                      <span className="mr-2 text-xs text-slate-400">
                        ({pp.quantity} {pp.product.unit} / إجراء)
                      </span>
                    </span>
                    <UnlinkButton id={pp.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      {procedures.length === 0 && (
        <EmptyState title={t("common.noResults", locale)} description="أضف إجراءات أولاً" />
      )}
    </div>
  );
}
