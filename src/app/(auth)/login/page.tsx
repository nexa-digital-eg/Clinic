import { getLocale } from "@/lib/locale";
import { getClinicSettings } from "@/server/clinic";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const locale = await getLocale();
  const clinic = await getClinicSettings();
  return <LoginForm locale={locale} clinicName={clinic.name} logoUrl={clinic.logoUrl} />;
}
