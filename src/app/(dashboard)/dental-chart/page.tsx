import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="مخطط الأسنان"
      phase="المرحلة 3"
      features={[
        "مخطط أسنان تفاعلي لتحديد الجزء المصاب",
        "إضافة إجراء (حشو عصب / خلع / تنظيف) للسن",
        "إضافة سعر الإجراء تلقائياً على الكشف",
      ]}
    />
  );
}
