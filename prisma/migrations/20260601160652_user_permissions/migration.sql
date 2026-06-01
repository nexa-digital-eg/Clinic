-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[],
ADD COLUMN     "title" TEXT;

-- Backfill: existing non-admin users keep full access until the admin restricts them
UPDATE "User" SET "permissions" = ARRAY[
  'patients','appointments','queue','dental-chart','billing','treasury',
  'packages','reminders','inventory','whatsapp','assistant','reports'
] WHERE "role" <> 'ADMIN';
