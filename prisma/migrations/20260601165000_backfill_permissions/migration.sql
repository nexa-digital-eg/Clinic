-- منح المستخدمين الحاليين (غير الأدمن) كل الصلاحيات حتى لا يُقفلوا خارج النظام
-- (يقدر الأدمن يقيّدهم بعد ذلك من الإعدادات)
UPDATE "User" SET "permissions" = ARRAY[
  'patients','appointments','queue','dental-chart','billing','treasury',
  'packages','reminders','inventory','whatsapp','assistant','reports'
]::text[]
WHERE "role" <> 'ADMIN' AND ("permissions" IS NULL OR cardinality("permissions") = 0);
