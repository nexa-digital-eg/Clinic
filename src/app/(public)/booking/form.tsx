"use client";

import { useActionState } from "react";
import { bookOnline } from "./actions";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { CalendarCheck, CheckCircle2 } from "lucide-react";

type DoctorOpt = { id: string; name: string; specialty: string; branch: string };

export function BookingForm({ doctors }: { doctors: DoctorOpt[] }) {
  const [state, formAction, pending] = useActionState(bookOnline, undefined);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.success) {
    return (
      <Card className="p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
        <h1 className="text-xl font-bold text-slate-800">تم استلام طلب الحجز ✅</h1>
        <p className="mt-2 text-sm text-slate-500">
          سيتم التواصل معك لتأكيد الموعد. شكراً لاختيارك Smart Clinic.
        </p>
        <a
          href="/booking"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          حجز موعد آخر
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <CalendarCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">احجز موعدك أونلاين</h1>
        <p className="mt-1 text-sm text-slate-500">املأ البيانات وسنتواصل معك للتأكيد</p>
      </div>

      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">الاسم الأول *</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div>
              <Label htmlFor="lastName">اسم العائلة *</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input id="phone" name="phone" dir="ltr" placeholder="01XXXXXXXXX" required />
          </div>

          <div>
            <Label htmlFor="doctorId">الطبيب *</Label>
            <Select id="doctorId" name="doctorId" required>
              <option value="">— اختر الطبيب —</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  د. {d.name}
                  {d.specialty ? ` - ${d.specialty}` : ""}
                  {d.branch ? ` (${d.branch})` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">التاريخ *</Label>
              <Input id="date" name="date" type="date" dir="ltr" min={today} defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="time">الوقت *</Label>
              <Input id="time" name="time" type="time" dir="ltr" defaultValue="10:00" required />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">سبب الزيارة</Label>
            <Input id="reason" name="reason" placeholder="مثال: ألم في الضرس" />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "جارٍ الإرسال..." : "تأكيد الحجز"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
