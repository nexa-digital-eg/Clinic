/* ترويسة العيادة للمستندات المطبوعة */
export function ClinicHeader({
  clinic,
}: {
  clinic: { name: string; logoUrl: string | null; address: string | null; phone: string | null; email: string | null };
}) {
  return (
    <div className="flex items-center justify-between border-b-2 border-brand-600 pb-4">
      <div className="flex items-center gap-3">
        {clinic.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinic.logoUrl} alt="logo" className="h-14 w-14 rounded-lg object-contain" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-600 text-2xl text-white">
            🦷
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{clinic.name}</h1>
          {clinic.address && <p className="text-xs text-slate-500">{clinic.address}</p>}
        </div>
      </div>
      <div className="text-end text-xs text-slate-500">
        {clinic.phone && <p dir="ltr">📞 {clinic.phone}</p>}
        {clinic.email && <p dir="ltr">✉ {clinic.email}</p>}
      </div>
    </div>
  );
}
