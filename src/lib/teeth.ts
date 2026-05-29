// ترقيم الأسنان الدولي (FDI) للأسنان الدائمة + المسميات العربية

export const UPPER_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
export const LOWER_TEETH = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

// أسطح السن المصابة
export const SURFACES: { value: string; label: string }[] = [
  { value: "mesial", label: "إنسي (Mesial)" },
  { value: "distal", label: "وحشي (Distal)" },
  { value: "occlusal", label: "سطح الإطباق (Occlusal)" },
  { value: "buccal", label: "دهليزي (Buccal)" },
  { value: "lingual", label: "لساني (Lingual)" },
  { value: "whole", label: "السن كاملاً" },
];

export function surfaceLabel(value: string | null): string {
  if (!value) return "—";
  return SURFACES.find((s) => s.value === value)?.label ?? value;
}

// اسم السن التقريبي حسب موضعه
export function toothName(num: number): string {
  const pos = num % 10; // 1..8
  const names: Record<number, string> = {
    1: "القاطع المركزي",
    2: "القاطع الجانبي",
    3: "الناب",
    4: "الضاحك الأول",
    5: "الضاحك الثاني",
    6: "الرحى الأولى",
    7: "الرحى الثانية",
    8: "ضرس العقل",
  };
  return names[pos] ?? "سن";
}
