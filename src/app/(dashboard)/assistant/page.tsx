import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="المساعد الذكي"
      phase="المرحلة 8"
      features={[
        "مساعد على علم كامل بملف المريض",
        "إضافة بيانات المريض بالأوامر الصوتية",
        "إنشاء روشتة كاملة وبدائل وحفظها كنموذج",
        "إنشاء تقرير طبي شامل للمريض",
      ]}
    />
  );
}
