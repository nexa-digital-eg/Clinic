# النشر السحابي (Deployment)

النظام جاهز للنشر السحابي والوصول من أي جهاز (لابتوب/موبايل/تابلت) وهو
**Responsive** + قابل للتثبيت كتطبيق (PWA).

## الخيار 1: Docker Compose (الأسهل)

```bash
# 1) جهّز المتغيرات
cp .env.example .env   # عدّل AUTH_SECRET (مهم) والمفاتيح الاختيارية

# 2) شغّل قاعدة البيانات + التطبيق (يبني الصورة ويطبّق الهجرات تلقائياً)
docker compose --profile app up -d --build

# 3) (أول مرة) أضف بيانات تجريبية اختيارياً
docker compose exec app node node_modules/prisma/build/index.js db seed
```
التطبيق على `http://SERVER_IP:3000`. ضع Nginx/Caddy أمامه للـ HTTPS.

## الخيار 2: Vercel / منصة Next

1. ارفع المشروع على GitHub (تم).
2. أنشئ مشروعاً على المنصة واربط الريبو.
3. أضف متغيرات البيئة:
   `DATABASE_URL` (PostgreSQL سحابي مثل Neon/Supabase)، `AUTH_SECRET`،
   واختيارياً مفاتيح واتساب و Claude.
4. أمر البناء: `npm run build` — وبعد النشر طبّق الهجرات:
   `npx prisma migrate deploy`.

## متغيرات البيئة الأساسية

| المتغير | إلزامي | الوصف |
|---------|--------|-------|
| `DATABASE_URL` | ✅ | رابط PostgreSQL |
| `AUTH_SECRET` | ✅ | مفتاح تشفير الجلسات (`openssl rand -base64 32`) |
| `APP_URL` | — | عنوان التطبيق العام |
| `ANTHROPIC_API_KEY` | — | لتفعيل المساعد الذكي (المرحلة 8) |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | — | لتفعيل واتساب (المرحلة 7) |
| `WHATSAPP_VERIFY_TOKEN` | — | للتحقق من webhook واتساب |

## مهمة مجدولة (واتساب)
اربط cron يستدعي معالج الرسائل المجدولة كل دقيقة:
```
* * * * * curl -s https://YOUR_APP/api/whatsapp/dispatch
```

## ملاحظات أمان
- غيّر `AUTH_SECRET` و كلمات مرور الحسابات التجريبية قبل الإنتاج.
- لا تضع `.env` في git (مستثنى مسبقاً).
- فعّل HTTPS دائماً في الإنتاج.
