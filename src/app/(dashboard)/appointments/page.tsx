import { ComingSoon } from "@/components/coming-soon";

export default function Page() {
  return (
    <ComingSoon
      title="الحجوزات والمواعيد"
      phase="المرحلة 2"
      features={[
        "تقويم شهري لكل طبيب وفرع منفصل",
        "حالات الحجز (مؤكد / منتظر / ملغي / تم)",
        "نظام الحجز الإلكتروني للمرضى عبر الإنترنت",
      ]}
    />
  );
}
