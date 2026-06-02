import { getLocale } from "@/lib/locale";
import { getClinicSettings } from "@/server/clinic";
import { ForgotForm } from "./forgot-form";

export default async function ForgotPage() {
  const locale = await getLocale();
  const clinic = await getClinicSettings();
  return <ForgotForm locale={locale} clinicName={clinic.name} logoUrl={clinic.logoUrl} />;
}
