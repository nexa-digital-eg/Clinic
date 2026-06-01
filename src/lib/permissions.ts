import type { Role } from "@prisma/client";

// الأقسام القابلة للمنح (الأدمن يحدد أيّها يراها المستخدم)
// dashboard متاح دائماً لأي مستخدم، و settings للأدمن فقط
export type SectionKey =
  | "patients"
  | "appointments"
  | "queue"
  | "dental-chart"
  | "billing"
  | "treasury"
  | "packages"
  | "reminders"
  | "inventory"
  | "whatsapp"
  | "assistant"
  | "reports";

export const GRANTABLE_SECTIONS: { key: SectionKey; path: string; navKey: string }[] = [
  { key: "patients", path: "/patients", navKey: "nav.patients" },
  { key: "appointments", path: "/appointments", navKey: "nav.appointments" },
  { key: "queue", path: "/queue", navKey: "nav.queue" },
  { key: "dental-chart", path: "/dental-chart", navKey: "nav.dentalChart" },
  { key: "billing", path: "/billing", navKey: "nav.billing" },
  { key: "treasury", path: "/treasury", navKey: "nav.treasury" },
  { key: "packages", path: "/packages", navKey: "nav.packages" },
  { key: "reminders", path: "/reminders", navKey: "nav.reminders" },
  { key: "inventory", path: "/inventory", navKey: "nav.inventory" },
  { key: "whatsapp", path: "/whatsapp", navKey: "nav.whatsapp" },
  { key: "assistant", path: "/assistant", navKey: "nav.assistant" },
  { key: "reports", path: "/reports", navKey: "nav.reports" },
];

// حوّل مساراً إلى مفتاح القسم
export function pathToSection(pathname: string): SectionKey | "dashboard" | "settings" | null {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return "dashboard";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "settings";
  for (const s of GRANTABLE_SECTIONS) {
    if (pathname === s.path || pathname.startsWith(s.path + "/")) return s.key;
  }
  return null;
}

// هل يُسمح للمستخدم بالوصول لهذا المسار؟
export function canAccessPath(
  pathname: string,
  role: Role,
  permissions: string[],
): boolean {
  if (role === "ADMIN") return true;
  const section = pathToSection(pathname);
  if (section === null) return true; // مسار عام (غير مقيّد)
  if (section === "dashboard") return true; // متاح دائماً
  if (section === "settings") return false; // للأدمن فقط
  return permissions.includes(section);
}
