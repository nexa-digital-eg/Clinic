import "server-only";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

type Provider = "anthropic" | "gemini" | "none";

// قراءة مفتاح من البيئة مع تجاهل المسافات الزائدة والقيم الفارغة
function envKey(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function aiProvider(): Provider {
  if (envKey("ANTHROPIC_API_KEY")) return "anthropic";
  if (envKey("GEMINI_API_KEY")) return "gemini";
  return "none";
}

export function isAIConfigured(): boolean {
  return aiProvider() !== "none";
}

export function aiProviderName(): string {
  switch (aiProvider()) {
    case "anthropic":
      return "Claude API";
    case "gemini":
      return "Google Gemini";
    default:
      return "محاكاة";
  }
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

export async function askAI(p: AskParams): Promise<AskResult> {
  switch (aiProvider()) {
    case "anthropic":
      return askAnthropic(p);
    case "gemini":
      return askGemini(p);
    default:
      return { text: simulate(p), simulated: true };
  }
}

// توافق للخلف
export const askClaude = askAI;

async function askAnthropic(p: AskParams): Promise<AskResult> {
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": envKey("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
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

async function askGemini(p: AskParams): Promise<AskResult> {
  const key = envKey("GEMINI_API_KEY")!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: p.system }] },
        contents: p.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: p.maxTokens ?? 1500 },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { text: "", simulated: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part.text ?? "")
      .join("\n");
    return { text, simulated: false };
  } catch (e) {
    return { text: "", simulated: false, error: (e as Error).message };
  }
}

function simulate(p: AskParams): string {
  const last = p.messages[p.messages.length - 1]?.content ?? "";
  return [
    "⚠️ وضع المحاكاة (لا يوجد مفتاح AI مفعّل).",
    "",
    `سؤالك: «${last.slice(0, 200)}»`,
    "",
    "في الوضع الحقيقي، يقرأ المساعد ملف المريض كاملاً ويجيب بدقة ويقترح خطة علاج أو روشتة أو تقريراً.",
    "",
    "أضف ANTHROPIC_API_KEY أو GEMINI_API_KEY في .env لتفعيل الردود الحقيقية.",
  ].join("\n");
}
