import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="المخزون"
      phase="المرحلة 5"
      features={[
        "إدارة المنتجات والكميات",
        "ربط منتج بأكثر من إجراء / كشف",
        "السحب التلقائي من الكمية عند تنفيذ الإجراء",
      ]}
    />
  );
}
