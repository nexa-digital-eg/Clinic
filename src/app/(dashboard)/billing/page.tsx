import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="الفواتير والمدفوعات"
      phase="المرحلة 4"
      features={[
        "فواتير ومدفوعات وأرصدة المرضى",
        "ربط أسعار الإجراءات تلقائياً بالفاتورة",
        "حالات الفاتورة (مفتوحة / مدفوعة / جزئية)",
      ]}
    />
  );
}
