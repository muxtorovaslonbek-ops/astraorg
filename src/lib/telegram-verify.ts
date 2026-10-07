// Browser/worker-safe Telegram Login Widget verification (Web Crypto only).
// https://core.telegram.org/widgets/login#checking-authorization

export type TelegramAuthData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  [key: string]: unknown;
};

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function computeTelegramHash(data: Record<string, unknown>, botToken: string) {
  const checkString = Object.keys(data)
    .filter((key) => key !== "hash" && data[key] !== undefined && data[key] !== null)
    .sort()
    .map((key) => `${key}=${String(data[key])}`)
    .join("\n");
  const secret = await crypto.subtle.digest("SHA-256", encoder.encode(botToken));
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(checkString));
  return toHex(signature);
}

export async function verifyTelegramAuth(
  data: TelegramAuthData,
  botToken: string,
  maxAgeSeconds = 86400,
  nowMs = Date.now(),
) {
  if (!data.hash || !botToken) return false;
  const ageSeconds = nowMs / 1000 - Number(data.auth_date);
  if (!Number.isFinite(ageSeconds) || ageSeconds > maxAgeSeconds || ageSeconds < -300) return false;
  const expected = await computeTelegramHash(data, botToken);
  return safeEqual(expected, String(data.hash).toLowerCase());
}
