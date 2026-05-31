import { db } from "@/lib/db";
import { Card, Badge, LinkButton } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Boxes, Link2 } from "lucide-react";
import { ProductForms, ProductRow } from "./forms";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export default async function InventoryPage() {
  const locale = await getLocale();
  const products = await db.product.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { procedures: true } } },
  });

  const lowStock = products.filter((p) => p.quantity <= p.minQuantity);
  const totalValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("inventory.title", locale)}</h1>
          <p className="text-sm text-slate-500">{t("inventory.subtitle", locale)}</p>
        </div>
        <LinkButton href="/inventory/procedures" variant="secondary">
          <Link2 className="h-4 w-4" />
          {t("inventory.linkProducts", locale)}
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("inventory.productCount", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{products.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("inventory.stockValue", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{formatCurrency(totalValue, locale)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">{t("inventory.lowStock", locale)}</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{lowStock.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="font-semibold text-slate-800">المنتجات</h2>
            </div>
            {products.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Boxes className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">لا توجد منتجات</p>
                <p className="mt-1 text-xs text-slate-400">أضف أول منتج من النموذج</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-start text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">المنتج</th>
                      <th className="px-4 py-2 font-medium">الكمية</th>
                      <th className="px-4 py-2 font-medium">حد التنبيه</th>
                      <th className="px-4 py-2 font-medium">مرتبط بإجراءات</th>
                      <th className="px-4 py-2 font-medium">الحالة</th>
                      <th className="px-4 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <ProductRow
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        sku={p.sku}
                        unit={p.unit}
                        quantity={p.quantity}
                        minQuantity={p.minQuantity}
                        linkedCount={p._count.procedures}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <ProductForms />
      </div>
    </div>
  );
}
