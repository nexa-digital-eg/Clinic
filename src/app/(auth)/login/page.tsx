import { getLocale } from "@/lib/locale";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const locale = await getLocale();
  return <LoginForm locale={locale} />;
}
