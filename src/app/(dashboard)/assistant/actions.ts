"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { askClaude, type ChatMessage } from "@/lib/ai";
import { buildPatientContext } from "@/server/ai-context";
import { logActivity } from "@/server/audit";

// محادثة المساعد مع سياق ملف المريض
export async function chatAssistant(
  patientId: string,
  history: ChatMessage[],
): Promise<{ text: string; simulated: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { text: "", simulated: false, error: "غير مصرح" };

  const context = await buildPatientContext(patientId);
  const system = [
    "أنت مساعد طبي ذكي داخل نظام إدارة عيادة أسنان.",
    "لديك ملف المريض كاملاً أدناه. أجب باللغة العربية بدقة وإيجاز،",
    "وساعد الطبيب في التشخيص والخطة العلاجية والروشتات والتقارير.",
    "لا تخترع معلومات غير موجودة في الملف، ونبّه عند الحاجة لمزيد من الفحوصات.",
    "",
    context,
  ].join("\n");

  const result = await askClaude({ system, messages: history, maxTokens: 1200 });
  return { text: result.text, simulated: result.simulated, error: result.error };
}

// توليد تقرير طبي شامل وحفظه
export async function generateReport(
  patientId: string,
): Promise<{ ok?: boolean; error?: string; simulated?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const context = await buildPatientContext(patientId);
  const result = await askClaude({
    system:
      "أنت طبيب أسنان خبير. اكتب تقريراً طبياً شاملاً ومنظّماً بالعربية بناءً على ملف المريض التالي، يشمل: الملخص، التشخيصات، الإجراءات المنفّذة والمخططة، والتوصيات.\n\n" +
      context,
    messages: [{ role: "user", content: "اكتب التقرير الطبي الشامل الآن." }],
    maxTokens: 2000,
  });

  if (result.error) return { error: result.error };

  await db.medicalReport.create({
    data: {
      patientId,
      title: `تقرير طبي — ${new Date().toLocaleDateString("ar-EG")}`,
      content: result.text,
    },
  });

  revalidatePath(`/assistant/${patientId}`);
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, simulated: result.simulated };
}

// إضافة بيانات للمريض عبر أمر صوتي/نصي (استخراج ذكي + تطبيق)
export async function addDataByVoice(
  patientId: string,
  transcript: string,
): Promise<{ ok?: boolean; applied?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };
  if (!transcript.trim()) return { error: "النص فارغ" };

  const result = await askClaude({
    system:
      'أنت محرّك استخراج بيانات. حوّل ملاحظة الطبيب الصوتية إلى JSON فقط بالحقول المتاحة: ' +
      '{"allergies"?:string,"chronicConditions"?:string,"notes"?:string,"diagnosis"?:string}. ' +
      "أرجع JSON صالحاً فقط دون أي نص إضافي. استخدم diagnosis لأي تشخيص جديد.",
    messages: [{ role: "user", content: transcript }],
    maxTokens: 400,
  });

  let data: Record<string, string> = {};
  try {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) data = JSON.parse(match[0]);
  } catch {
    data = {};
  }

  // وضع المحاكاة أو فشل الاستخراج: أضف النص للملاحظات
  if (result.simulated || Object.keys(data).length === 0) {
    data = { notes: transcript };
  }

  const applied: string[] = [];
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) return { error: "المريض غير موجود" };

  const update: Record<string, string> = {};
  if (data.allergies) {
    update.allergies = [patient.allergies, data.allergies].filter(Boolean).join("، ");
    applied.push("الحساسية");
  }
  if (data.chronicConditions) {
    update.chronicConditions = [patient.chronicConditions, data.chronicConditions]
      .filter(Boolean)
      .join("، ");
    applied.push("أمراض مزمنة");
  }
  if (data.notes) {
    update.notes = [patient.notes, data.notes].filter(Boolean).join("\n");
    applied.push("ملاحظات");
  }
  if (Object.keys(update).length) {
    await db.patient.update({ where: { id: patientId }, data: update });
  }
  if (data.diagnosis) {
    await db.diagnosis.create({ data: { patientId, title: data.diagnosis } });
    applied.push("تشخيص");
  }

  revalidatePath(`/assistant/${patientId}`);
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, applied: applied.join("، ") || "ملاحظات" };
}

// إنشاء روشتة (أدوية + بدائل) وحفظها — واختيارياً كنموذج
export async function createPrescription(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  const patientId = String(formData.get("patientId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const saveAsTemplate = formData.get("saveAsTemplate") === "on";
  const templateName = String(formData.get("templateName") ?? "");

  // الأدوية تأتي كمصفوفات متوازية
  const drugNames = formData.getAll("drugName").map(String);
  const doses = formData.getAll("dose").map(String);
  const freqs = formData.getAll("frequency").map(String);
  const durations = formData.getAll("duration").map(String);
  const alternatives = formData.getAll("alternatives").map(String);

  const items = drugNames
    .map((name, i) => ({
      drugName: name.trim(),
      dose: doses[i]?.trim() || null,
      frequency: freqs[i]?.trim() || null,
      duration: durations[i]?.trim() || null,
      alternatives: alternatives[i]?.trim() || null,
    }))
    .filter((it) => it.drugName);

  if (!patientId || items.length === 0) {
    return { error: "اختر المريض وأضف دواءً واحداً على الأقل" };
  }

  await db.prescription.create({
    data: {
      patientId,
      notes: notes || null,
      items: { create: items },
    },
  });

  if (saveAsTemplate && templateName.trim()) {
    await db.prescriptionTemplate.create({
      data: { name: templateName.trim(), body: items },
    });
  }

  await logActivity("PRESCRIPTION_CREATE", `${items.length} دواء`);
  revalidatePath(`/assistant/${patientId}`);
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}

export async function deleteTemplate(id: string) {
  const session = await getSession();
  if (!session) return;
  await db.prescriptionTemplate.delete({ where: { id } });
  revalidatePath("/assistant");
}
