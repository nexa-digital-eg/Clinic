import { db } from "@/lib/db";
import { NewAppointmentForm } from "./form";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const sp = await searchParams;
  const [patients, branches] = await Promise.all([
    db.patient.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
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
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      defaultPatientId={sp.patientId}
    />
  );
}
