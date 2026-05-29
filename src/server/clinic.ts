import "server-only";
import { db } from "@/lib/db";

export async function getClinicSettings() {
  const existing = await db.clinicSettings.findUnique({ where: { id: "clinic" } });
  if (existing) return existing;
  return db.clinicSettings.create({ data: { id: "clinic" } });
}
