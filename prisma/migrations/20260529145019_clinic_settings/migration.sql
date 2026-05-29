-- CreateTable
CREATE TABLE "ClinicSettings" (
    "id" TEXT NOT NULL DEFAULT 'clinic',
    "name" TEXT NOT NULL DEFAULT 'Smart Clinic',
    "logoUrl" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ج.م',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
);
