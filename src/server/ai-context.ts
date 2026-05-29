import "server-only";
import { db } from "@/lib/db";
import { surfaceLabel, toothName } from "@/lib/teeth";

// يبني ملخص ملف المريض ليكون سياقاً للمساعد الذكي
export async function buildPatientContext(patientId: string): Promise<string> {
  const p = await db.patient.findUnique({
    where: { id: patientId },
    include: {
      diagnoses: { orderBy: { createdAt: "desc" }, take: 20 },
      prescriptions: { orderBy: { createdAt: "desc" }, take: 10, include: { items: true } },
      appointments: { orderBy: { startsAt: "desc" }, take: 10 },
      toothRecords: { orderBy: { createdAt: "desc" }, include: { procedure: true } },
      complaints: { orderBy: { createdAt: "desc" }, take: 10 },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!p) return "لا يوجد مريض بهذا المعرّف.";

  const age = p.birthDate
    ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / 3.15576e10)
    : null;

  const lines: string[] = [];
  lines.push(`# ملف المريض`);
  lines.push(`الاسم: ${p.firstName} ${p.lastName} | الكود: ${p.code}`);
  lines.push(`الهاتف: ${p.phone}${age !== null ? ` | العمر: ${age}` : ""}${p.gender ? ` | النوع: ${p.gender === "MALE" ? "ذكر" : "أنثى"}` : ""}`);
  if (p.bloodType) lines.push(`فصيلة الدم: ${p.bloodType}`);
  if (p.allergies) lines.push(`الحساسية: ${p.allergies}`);
  if (p.chronicConditions) lines.push(`أمراض مزمنة: ${p.chronicConditions}`);
  if (p.notes) lines.push(`ملاحظات: ${p.notes}`);
  lines.push(`الرصيد المالي: ${p.balance} ج.م`);

  if (p.diagnoses.length) {
    lines.push(`\n## التشخيصات`);
    p.diagnoses.forEach((d) => lines.push(`- ${d.title}${d.details ? `: ${d.details}` : ""}`));
  }
  if (p.toothRecords.length) {
    lines.push(`\n## سجل الأسنان`);
    p.toothRecords.forEach((t) =>
      lines.push(`- سن ${t.toothNumber} (${toothName(t.toothNumber)}) ${surfaceLabel(t.surface)} — ${t.procedure?.name ?? "بدون إجراء"} [${t.status}]`),
    );
  }
  if (p.prescriptions.length) {
    lines.push(`\n## الروشتات`);
    p.prescriptions.forEach((pr) => {
      const meds = pr.items.map((i) => `${i.drugName}${i.dose ? ` ${i.dose}` : ""}`).join("، ");
      lines.push(`- ${new Date(pr.createdAt).toLocaleDateString("ar-EG")}: ${meds || "—"}`);
    });
  }
  if (p.complaints.length) {
    lines.push(`\n## الشكاوي`);
    p.complaints.forEach((c) => lines.push(`- ${c.title} [${c.status}]`));
  }
  if (p.appointments.length) {
    lines.push(`\n## آخر الحجوزات`);
    p.appointments.forEach((a) =>
      lines.push(`- ${new Date(a.startsAt).toLocaleString("ar-EG")} [${a.status}]${a.reason ? ` - ${a.reason}` : ""}`),
    );
  }

  return lines.join("\n");
}
