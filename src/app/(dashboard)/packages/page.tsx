import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="الباقات"
      phase="المرحلة 6"
      features={[
        "إنشاء باقة تحتوي على أكثر من جلسة",
        "متابعة الباقات أوتوماتيك مع المريض",
        "تذكيرات (Reminders) لتأكيد الحجز وتغيير الموعد",
      ]}
    />
  );
}
