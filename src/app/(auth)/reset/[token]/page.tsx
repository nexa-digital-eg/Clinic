import { getLocale } from "@/lib/locale";
import { getClinicSettings } from "@/server/clinic";
import { ResetForm } from "./reset-form";

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const clinic = await getClinicSettings();
  return <ResetForm token={token} locale={locale} clinicName={clinic.name} logoUrl={clinic.logoUrl} />;
}
