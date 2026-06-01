import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditPatientForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await db.patient.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <EditPatientForm
      id={p.id}
      patient={{
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        email: p.email ?? "",
        gender: p.gender ?? "",
        birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : "",
        address: p.address ?? "",
        bloodType: p.bloodType ?? "",
        allergies: p.allergies ?? "",
        chronicConditions: p.chronicConditions ?? "",
        notes: p.notes ?? "",
      }}
    />
  );
}
