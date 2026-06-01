import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// تصدير تقرير مالي شامل (الإيرادات + المصروفات + جرد الفئات) كملف إكسيل
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = sp.get("to") ? new Date(`${sp.get("to")}T23:59:59`) : now;
  const range = { gte: from, lte: to };

  const [payments, expenses, invoicesAgg] = await Promise.all([
    db.payment.findMany({ where: { createdAt: range }, include: { patient: true } }),
    db.expense.findMany({ where: { spentAt: range }, orderBy: { spentAt: "desc" } }),
    db.invoice.aggregate({ _sum: { total: true, paidAmount: true }, where: { createdAt: range } }),
  ]);

  const income = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const net = income - totalExpense;
  const billed = invoicesAgg._sum.total ?? 0;
  const collected = invoicesAgg._sum.paidAmount ?? 0;

  const methodLabel: Record<string, string> = {
    CASH: "نقدي", CARD: "بطاقة", TRANSFER: "تحويل", OTHER: "أخرى",
  };
  const fmtD = (d: Date) => d.toISOString().slice(0, 10);

  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // 1) ملخص
  const summary = [
    ["الفترة", `${fmtD(from)} → ${fmtD(to)}`],
    ["إجمالي الإيرادات", income],
    ["إجمالي المصروفات", totalExpense],
    ["صافي الخزنة", net],
    ["إجمالي الفواتير", billed],
    ["المحصّل من الفواتير", collected],
    ["المتبقي على المرضى", billed - collected],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet([["الملخص المالي", ""], ...summary]);
  wsSummary["!cols"] = [{ wch: 28 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "الملخص");

  // 2) جرد المصروفات بالفئات
  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const catRows = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const wsCat = XLSX.utils.aoa_to_sheet([
    ["الفئة", "الإجمالي", "النسبة %"],
    ...catRows.map(([c, s]) => [c, s, totalExpense ? Math.round((s / totalExpense) * 100) : 0]),
  ]);
  wsCat["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsCat, "جرد الفئات");

  // 3) سجل المصروفات
  const wsExp = XLSX.utils.aoa_to_sheet([
    ["التاريخ", "الفئة", "المبلغ", "طريقة الدفع", "ملاحظات"],
    ...expenses.map((e) => [fmtD(e.spentAt), e.category, e.amount, methodLabel[e.method] ?? e.method, e.note ?? ""]),
  ]);
  wsExp["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsExp, "المصروفات");

  // 4) سجل المدفوعات (الإيراد)
  const wsPay = XLSX.utils.aoa_to_sheet([
    ["التاريخ", "المريض", "المبلغ", "طريقة الدفع", "ملاحظات"],
    ...payments.map((p) => [
      fmtD(p.createdAt),
      `${p.patient.firstName} ${p.patient.lastName}`,
      p.amount,
      methodLabel[p.method] ?? p.method,
      p.note ?? "",
    ]),
  ]);
  wsPay["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsPay, "المدفوعات");

  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `treasury-report-${fmtD(from)}_${fmtD(to)}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
