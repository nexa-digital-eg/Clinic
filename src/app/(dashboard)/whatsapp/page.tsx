import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="واتساب بوت"
      phase="المرحلة 7"
      features={[
        "تتبع جميع الرسائل الصادرة وحالتها",
        "إرسال ملفات متعددة الصيغ (فيديو / صور / PDF)",
        "جدولة الرسائل تلقائياً مع إمكانية التكرار",
      ]}
    />
  );
}
