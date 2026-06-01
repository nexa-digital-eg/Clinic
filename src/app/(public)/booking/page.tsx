import { BookingForm } from "./form";
import { getClinicSettings } from "@/server/clinic";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const clinic = await getClinicSettings();
  return <BookingForm clinicName={clinic.name} />;
}
