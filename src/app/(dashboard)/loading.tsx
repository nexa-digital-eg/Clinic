// هيكل تحميل موحّد لكل صفحات لوحة التحكم — يظهر فوراً أثناء جلب البيانات
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-slate-200" />
      </div>

      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-slate-200" />
            <div className="mt-3 h-3.5 w-24 rounded bg-slate-100" />
            <div className="mt-2 h-6 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* محتوى رئيسي */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-1/2 rounded bg-slate-100" />
                  <div className="h-3 w-1/3 rounded bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
