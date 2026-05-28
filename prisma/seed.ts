import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // الفرع الرئيسي
  const branch = await db.branch.upsert({
    where: { id: "main-branch" },
    update: {},
    create: {
      id: "main-branch",
      name: "الفرع الرئيسي",
      address: "القاهرة",
      phone: "0227000000",
    },
  });

  // مستخدم المدير
  const adminPass = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: "admin@clinic.com" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "admin@clinic.com",
      passwordHash: adminPass,
      role: "ADMIN",
      branchId: branch.id,
    },
  });

  // طبيب
  const docPass = await bcrypt.hash("doctor123", 10);
  const docUser = await db.user.upsert({
    where: { email: "doctor@clinic.com" },
    update: {},
    create: {
      name: "أحمد محمد",
      email: "doctor@clinic.com",
      passwordHash: docPass,
      role: "DOCTOR",
      branchId: branch.id,
    },
  });
  await db.doctor.upsert({
    where: { userId: docUser.id },
    update: {},
    create: {
      userId: docUser.id,
      specialty: "أسنان عام",
      branchId: branch.id,
    },
  });

  // إجراءات شائعة بأسعارها
  const procedures = [
    { name: "كشف", price: 200 },
    { name: "حشو عصب", price: 1500 },
    { name: "خلع", price: 500 },
    { name: "تنظيف وتلميع", price: 600 },
    { name: "حشو ضوئي", price: 700 },
  ];
  for (const p of procedures) {
    const existing = await db.procedure.findFirst({ where: { name: p.name } });
    if (!existing) {
      await db.procedure.create({ data: p });
    }
  }

  // مرضى تجريبيون
  const samplePatients = [
    { code: "P-00001", firstName: "سارة", lastName: "علي", phone: "01000000001", gender: "FEMALE" as const },
    { code: "P-00002", firstName: "محمود", lastName: "حسن", phone: "01000000002", gender: "MALE" as const },
  ];
  for (const p of samplePatients) {
    await db.patient.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  console.log("✅ Seed done.");
  console.log("   Admin:  admin@clinic.com / admin123");
  console.log("   Doctor: doctor@clinic.com / doctor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
