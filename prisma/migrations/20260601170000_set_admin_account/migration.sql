-- تحديث حساب المدير الافتراضي إلى حساب صاحب العيادة
-- (يُنفَّذ مرة واحدة على قاعدة البيانات عند النشر)
UPDATE "User"
SET "email" = 'ahmedelsaidy847@gmail.com',
    "passwordHash" = '$2a$10$x7f1VJ7C6oFbiGb5OmiwuuGQzwfXNoi/8lOlaR/3E7mObyP85wYva'
WHERE "email" = 'admin@clinic.com';
