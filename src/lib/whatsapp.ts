import "server-only";

const API_VERSION = "v21.0";

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
}

export interface SendParams {
  to: string;
  body?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null; // image | video | document
}

export interface SendResult {
  id: string;
  simulated: boolean;
  error?: string;
}

// تطبيع رقم الهاتف لصيغة دولية بسيطة (إزالة المسافات والرموز)
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

function buildPayload(p: SendParams) {
  const to = normalizePhone(p.to);
  if (p.mediaUrl && p.mediaType) {
    const type = p.mediaType; // image | video | document
    const mediaObj: Record<string, unknown> = { link: p.mediaUrl };
    if (p.body) mediaObj.caption = p.body;
    if (type === "document") {
      mediaObj.filename = p.mediaUrl.split("/").pop() ?? "file";
    }
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type,
      [type]: mediaObj,
    };
  }
  // رسالة نصية
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: p.body ?? "" },
  };
}

// إرسال رسالة عبر WhatsApp Cloud API — أو محاكاة لو لا توجد مفاتيح
export async function sendWhatsApp(p: SendParams): Promise<SendResult> {
  if (!isWhatsAppConfigured()) {
    // وضع المحاكاة: لا إرسال فعلي
    return { id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, simulated: true };
  }

  const token = process.env.WHATSAPP_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const url = `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPayload(p)),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        id: "",
        simulated: false,
        error: data?.error?.message ?? `HTTP ${res.status}`,
      };
    }
    const id = data?.messages?.[0]?.id ?? "";
    return { id, simulated: false };
  } catch (e) {
    return { id: "", simulated: false, error: (e as Error).message };
  }
}
