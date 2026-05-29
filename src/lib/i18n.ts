export type Locale = "ar" | "en";

export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "ar";

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

// قاموس الترجمة — مفتاح لكل من العربية والإنجليزية
const DICT: Record<string, { ar: string; en: string }> = {
  // العلامة التجارية
  "brand.tagline": { ar: "نظام إدارة العيادات", en: "Clinic Management System" },

  // التنقل
  "nav.dashboard": { ar: "الرئيسية", en: "Dashboard" },
  "nav.patients": { ar: "المرضى", en: "Patients" },
  "nav.appointments": { ar: "الحجوزات", en: "Appointments" },
  "nav.dentalChart": { ar: "مخطط الأسنان", en: "Dental Chart" },
  "nav.billing": { ar: "الفواتير والمدفوعات", en: "Billing & Payments" },
  "nav.packages": { ar: "الباقات", en: "Packages" },
  "nav.reminders": { ar: "التذكيرات", en: "Reminders" },
  "nav.inventory": { ar: "المخزون", en: "Inventory" },
  "nav.whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "nav.assistant": { ar: "المساعد الذكي", en: "AI Assistant" },
  "nav.reports": { ar: "التقارير", en: "Reports" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },

  // الأدوار
  "role.ADMIN": { ar: "مدير النظام", en: "Administrator" },
  "role.DOCTOR": { ar: "طبيب", en: "Doctor" },
  "role.RECEPTIONIST": { ar: "سكرتارية", en: "Receptionist" },
  "role.PATIENT": { ar: "مريض", en: "Patient" },

  // عام
  "common.logout": { ar: "خروج", en: "Logout" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.add": { ar: "إضافة", en: "Add" },
  "common.edit": { ar: "تعديل", en: "Edit" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.loading": { ar: "جارٍ التحميل...", en: "Loading..." },
  "common.language": { ar: "اللغة", en: "Language" },

  // تسجيل الدخول
  "login.title": { ar: "تسجيل الدخول", en: "Sign In" },
  "login.email": { ar: "البريد الإلكتروني", en: "Email" },
  "login.password": { ar: "كلمة المرور", en: "Password" },
  "login.submit": { ar: "تسجيل الدخول", en: "Sign In" },
  "login.loading": { ar: "جارٍ الدخول...", en: "Signing in..." },
  "login.demo": { ar: "حساب تجريبي", en: "Demo account" },

  // لوحة التحكم
  "dashboard.title": { ar: "لوحة التحكم", en: "Dashboard" },
  "dashboard.subtitle": { ar: "نظرة عامة على نشاط العيادة", en: "Overview of clinic activity" },
  "dashboard.totalPatients": { ar: "إجمالي المرضى", en: "Total Patients" },
  "dashboard.todayAppointments": { ar: "حجوزات اليوم", en: "Today's Appointments" },
  "dashboard.outstanding": { ar: "مستحقات غير محصّلة", en: "Outstanding Balance" },
  "dashboard.lowStock": { ar: "منتجات تحت الحد", en: "Low Stock Items" },
  "dashboard.upcoming": { ar: "الحجوزات القادمة", en: "Upcoming Appointments" },
  "dashboard.noUpcoming": { ar: "لا توجد حجوزات قادمة", en: "No upcoming appointments" },

  // عناوين الأقسام
  "patients.title": { ar: "المرضى", en: "Patients" },
  "patients.subtitle": { ar: "إدارة ملفات المرضى", en: "Manage patient records" },
  "patients.new": { ar: "مريض جديد", en: "New Patient" },
  "patients.searchPlaceholder": { ar: "ابحث بالاسم أو الهاتف أو الكود...", en: "Search by name, phone, or code..." },
};

export function t(key: string, locale: Locale): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[locale] ?? entry.ar;
}
