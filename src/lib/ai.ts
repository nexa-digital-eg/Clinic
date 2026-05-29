import "server-only";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskParams {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export interface AskResult {
  text: string;
  simulated: boolean;
  error?: string;
}

// استدعاء Claude — أو محاكاة عند غياب المفتاح
export async function askClaude(p: AskParams): Promise<AskResult> {
  if (!isAIConfigured()) {
    return { text: simulate(p), simulated: true };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: p.maxTokens ?? 1500,
        system: p.system,
        messages: p.messages,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { text: "", simulated: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    const text = (data?.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");
    return { text, simulated: false };
  } catch (e) {
    return { text: "", simulated: false, error: (e as Error).message };
  }
}

// رد محاكاة منطقي عند عدم وجود مفتاح (لتجربة الواجهة)
function simulate(p: AskParams): string {
  const last = p.messages[p.messages.length - 1]?.content ?? "";
  return [
    "⚠️ وضع المحاكاة (لا يوجد مفتاح Claude API).",
    "",
    `سؤالك: «${last.slice(0, 200)}»`,
    "",
    "في الوضع الحقيقي، سيقرأ المساعد ملف المريض كاملاً (التشخيصات، الروشتات، الحجوزات، المدفوعات) ويجيب بدقة، ويقترح خطة علاج أو روشتة أو تقريراً طبياً.",
    "",
    "أضف ANTHROPIC_API_KEY في ملف .env لتفعيل الردود الحقيقية.",
  ].join("\n");
}
