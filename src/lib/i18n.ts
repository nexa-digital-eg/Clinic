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

  // أعمدة وعناصر مشتركة
  "col.code": { ar: "الكود", en: "Code" },
  "col.name": { ar: "الاسم", en: "Name" },
  "col.phone": { ar: "الهاتف", en: "Phone" },
  "col.age": { ar: "العمر", en: "Age" },
  "col.registered": { ar: "تاريخ التسجيل", en: "Registered" },
  "col.balance": { ar: "الرصيد", en: "Balance" },
  "col.patient": { ar: "المريض", en: "Patient" },
  "col.doctor": { ar: "الطبيب", en: "Doctor" },
  "col.date": { ar: "التاريخ", en: "Date" },
  "col.datetime": { ar: "الموعد", en: "Date/Time" },
  "col.status": { ar: "الحالة", en: "Status" },
  "col.actions": { ar: "إجراءات", en: "Actions" },
  "col.reason": { ar: "السبب", en: "Reason" },
  "col.amount": { ar: "المبلغ", en: "Amount" },
  "col.method": { ar: "الطريقة", en: "Method" },
  "col.price": { ar: "السعر", en: "Price" },
  "col.qty": { ar: "الكمية", en: "Qty" },
  "col.unitPrice": { ar: "سعر الوحدة", en: "Unit Price" },
  "col.total": { ar: "الإجمالي", en: "Total" },
  "col.paid": { ar: "المدفوع", en: "Paid" },
  "col.due": { ar: "المتبقي", en: "Due" },
  "col.number": { ar: "رقم الفاتورة", en: "Invoice #" },
  "col.tooth": { ar: "السن", en: "Tooth" },
  "col.surface": { ar: "الجزء", en: "Surface" },
  "col.procedure": { ar: "الإجراء", en: "Procedure" },
  "col.description": { ar: "الوصف", en: "Description" },

  "common.all": { ar: "الكل", en: "All" },
  "common.none": { ar: "بدون", en: "None" },
  "common.noResults": { ar: "لا توجد نتائج", en: "No results" },
  "common.filter": { ar: "تصفية", en: "Filter" },

  // حالات الحجز
  "apptStatus.PENDING": { ar: "منتظر", en: "Pending" },
  "apptStatus.CONFIRMED": { ar: "مؤكد", en: "Confirmed" },
  "apptStatus.COMPLETED": { ar: "تم", en: "Completed" },
  "apptStatus.CANCELLED": { ar: "ملغي", en: "Cancelled" },
  "apptStatus.NO_SHOW": { ar: "لم يحضر", en: "No-show" },

  // حالات الفاتورة
  "invStatus.OPEN": { ar: "مفتوحة", en: "Open" },
  "invStatus.PARTIAL": { ar: "مدفوعة جزئياً", en: "Partial" },
  "invStatus.PAID": { ar: "مدفوعة", en: "Paid" },
  "invStatus.CANCELLED": { ar: "ملغاة", en: "Cancelled" },

  // طرق الدفع
  "method.CASH": { ar: "نقدي", en: "Cash" },
  "method.CARD": { ar: "بطاقة", en: "Card" },
  "method.TRANSFER": { ar: "تحويل", en: "Transfer" },
  "method.OTHER": { ar: "أخرى", en: "Other" },

  // الحجوزات
  "appt.title": { ar: "الحجوزات والمواعيد", en: "Appointments" },
  "appt.subtitle": { ar: "تقويم شهري لكل طبيب وفرع", en: "Monthly calendar per doctor & branch" },
  "appt.new": { ar: "حجز جديد", en: "New Appointment" },
  "appt.bookingLink": { ar: "رابط الحجز الإلكتروني", en: "Online Booking Link" },
  "appt.allDoctors": { ar: "كل الأطباء", en: "All Doctors" },
  "appt.allBranches": { ar: "كل الفروع", en: "All Branches" },
  "appt.monthAppointments": { ar: "حجوزات الشهر", en: "This Month's Appointments" },
  "appt.none": { ar: "لا توجد حجوزات هذا الشهر", en: "No appointments this month" },
  "appt.online": { ar: "إلكتروني", en: "Online" },

  // الفوترة
  "billing.title": { ar: "الفواتير والمدفوعات", en: "Billing & Payments" },
  "billing.subtitle": { ar: "إدارة الكشوفات والتحصيل", en: "Manage invoices & collections" },
  "billing.totalBilled": { ar: "إجمالي الفواتير", en: "Total Billed" },
  "billing.collected": { ar: "المحصّل", en: "Collected" },
  "billing.remaining": { ar: "المتبقي", en: "Remaining" },
  "billing.none": { ar: "لا توجد فواتير", en: "No invoices" },
  "billing.print": { ar: "طباعة / PDF", en: "Print / PDF" },

  // المخزون
  "inventory.title": { ar: "المخزون", en: "Inventory" },
  "inventory.subtitle": { ar: "إدارة المنتجات والكميات", en: "Manage products & stock" },
  "inventory.linkProducts": { ar: "ربط المنتجات بالإجراءات", en: "Link Products to Procedures" },
  "inventory.productCount": { ar: "عدد المنتجات", en: "Products" },
  "inventory.stockValue": { ar: "قيمة المخزون", en: "Stock Value" },
  "inventory.lowStock": { ar: "منتجات تحت الحد", en: "Low Stock" },

  // الباقات
  "packages.title": { ar: "الباقات", en: "Packages" },
  "packages.subtitle": { ar: "باقات متعددة الجلسات ومتابعتها", en: "Multi-session packages & tracking" },

  // التذكيرات
  "reminders.title": { ar: "التذكيرات", en: "Reminders" },
  "reminders.subtitle": { ar: "تأكيد الحجوزات ومتابعة الباقات", en: "Confirm bookings & follow packages" },

  // واتساب
  "whatsapp.title": { ar: "واتساب", en: "WhatsApp" },
  "whatsapp.subtitle": { ar: "إرسال وجدولة الرسائل ومتابعة حالتها", en: "Send, schedule & track messages" },

  // المساعد الذكي
  "assistant.title": { ar: "المساعد الذكي", en: "AI Assistant" },
  "assistant.subtitle": { ar: "اختر مريضاً ليساعدك المساعد على علم بملفه", en: "Pick a patient — the assistant knows their file" },

  // التقارير
  "reports.title": { ar: "التقارير", en: "Reports" },
  "reports.subtitle": { ar: "أداء العيادة خلال الفترة المحددة", en: "Clinic performance for the selected period" },

  // الإعدادات
  "settings.title": { ar: "الإعدادات", en: "Settings" },
  "settings.subtitle": { ar: "إدارة بيانات العيادة والإجراءات والفروع والمستخدمين", en: "Manage clinic, procedures, branches & users" },
  "settings.tabClinic": { ar: "بيانات العيادة", en: "Clinic Info" },
  "settings.tabProcedures": { ar: "الإجراءات والأسعار", en: "Procedures & Prices" },
  "settings.tabBranches": { ar: "الفروع", en: "Branches" },
  "settings.tabStaff": { ar: "الأطباء والمستخدمين", en: "Doctors & Users" },

  // مخطط الأسنان
  "dental.title": { ar: "مخطط الأسنان", en: "Dental Chart" },
  "dental.pickPatient": { ar: "اختر مريضاً لفتح مخطط أسنانه", en: "Pick a patient to open their dental chart" },
  "dental.searchPatient": { ar: "ابحث عن مريض...", en: "Search for a patient..." },
};

export function t(key: string, locale: Locale): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[locale] ?? entry.ar;
}
