import { db } from "@/lib/db";
import { BookingForm } from "./form";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const doctors = await db.doctor.findMany({
    where: { user: { isActive: true } },
    include: { user: true, branch: true },
  });

  return (
    <BookingForm
      doctors={doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        specialty: d.specialty ?? "",
        branch: d.branch?.name ?? "",
      }))}
    />
  );
}
