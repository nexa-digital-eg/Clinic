import { db } from "@/lib/db";
import { BookingForm } from "./form";
import { getClinicSettings } from "@/server/clinic";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const [doctors, clinic] = await Promise.all([
    db.doctor.findMany({
      where: { user: { isActive: true } },
      include: { user: true, branch: true },
    }),
    getClinicSettings(),
  ]);

  return (
    <BookingForm
      clinicName={clinic.name}
      doctors={doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        specialty: d.specialty ?? "",
        branch: d.branch?.name ?? "",
      }))}
    />
  );
}
