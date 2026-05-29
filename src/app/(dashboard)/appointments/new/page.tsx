import { db } from "@/lib/db";
import { NewAppointmentForm } from "./form";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const sp = await searchParams;
  const [patients, doctors, branches] = await Promise.all([
    db.patient.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.doctor.findMany({ include: { user: true } }),
    db.branch.findMany(),
  ]);

  return (
    <NewAppointmentForm
      patients={patients.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        code: p.code,
        phone: p.phone,
      }))}
      doctors={doctors.map((d) => ({ id: d.id, name: d.user.name }))}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      defaultPatientId={sp.patientId}
    />
  );
}
