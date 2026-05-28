import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="التقارير"
      phase="المرحلة 9"
      features={[
        "تقارير الإيرادات والحجوزات وأداء الأطباء",
        "تقارير المخزون والمستحقات",
        "تصدير PDF / Excel",
      ]}
    />
  );
}
