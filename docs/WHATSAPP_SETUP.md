# إعداد واتساب (WhatsApp Cloud API)

النظام يعمل في **وضع محاكاة** تلقائياً بدون أي مفاتيح (الرسائل تُسجَّل وتُعلَّم
كمُرسلة دون إرسال فعلي). لتفعيل الإرسال الحقيقي اتبع الخطوات.

## 1) الحصول على المفاتيح من Meta
1. [developers.facebook.com](https://developers.facebook.com) ← **My Apps** ← **Create App** (نوع Business).
2. أضف منتج **WhatsApp** ← **Set up**، واختر/أنشئ Meta Business Account.
3. من صفحة **WhatsApp ← API Setup** انسخ:
   - **Temporary access token** → `WHATSAPP_TOKEN` (مؤقت 24 ساعة).
   - **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
4. للإنتاج: أنشئ **System User** دائم من business.facebook.com وولّد توكن دائم
   بصلاحيتي `whatsapp_business_messaging` و `whatsapp_business_management`.

## 2) ضبط متغيرات البيئة (.env)
```
WHATSAPP_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_VERIFY_TOKEN="اخترع_أي_نص_سري"
```

## 3) إعداد الـ Webhook (لتتبّع الحالة)
- في إعدادات WhatsApp بالتطبيق ← **Configuration** ← Webhook:
  - **Callback URL**: `https://YOUR_APP/api/whatsapp/webhook`
  - **Verify token**: نفس قيمة `WHATSAPP_VERIFY_TOKEN`.
- اشترك في حقل **messages**.

## 4) جدولة الرسائل (cron)
الرسائل المجدولة تُرسل عند استدعاء نقطة المعالجة. اربط cron خارجي:
```
* * * * * curl -s https://YOUR_APP/api/whatsapp/dispatch
```
أو استخدم زر **«تشغيل المجدولة الآن»** في صفحة واتساب يدوياً.

> ملاحظة: الرسائل خارج نافذة 24 ساعة من تفاعل المريض قد تتطلب **قوالب معتمدة
> (Message Templates)** من Meta حسب سياساتهم.
