import { createFileRoute } from "@tanstack/react-router";

const encoder = new TextEncoder();

async function deriveWebhookSecret(botToken: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`telegram-webhook:${botToken}`));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

async function sendMessage(botToken: string, chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) console.error(`Telegram sendMessage failed [${res.status}]: ${await res.text()}`);
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!botToken) return new Response("Not configured", { status: 503 });

        const expected = await deriveWebhookSecret(botToken);
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(actual, expected)) return new Response("Unauthorized", { status: 401 });

        const update = await request.json();
        const message = update.message ?? update.edited_message;
        const chatId = message?.chat?.id;
        const from = message?.from;
        if (!chatId || !from?.id) return Response.json({ ok: true, ignored: true });

        const code = generateCode();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // One active code per Telegram account: remove previous unused codes.
        await supabaseAdmin.from("telegram_codes").delete().eq("telegram_id", from.id).eq("used", false);

        const { error } = await supabaseAdmin.from("telegram_codes").insert({
          code,
          telegram_id: from.id,
          chat_id: chatId,
          first_name: from.first_name ?? null,
          last_name: from.last_name ?? null,
          username: from.username ?? null,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
        if (error) {
          console.error(`telegram_codes insert failed: ${error.message}`);
          await sendMessage(botToken, chatId, "Xatolik yuz berdi. Birozdan keyin qayta urinib ko‘ring.");
          return Response.json({ ok: false }, { status: 500 });
        }

        await sendMessage(
          botToken,
          chatId,
          `ASTRA’ga kirish kodingiz:\n\n<code>${code}</code>\n\nKod 10 daqiqa amal qiladi. Uni saytdagi kirish oynasiga kiriting.`,
        );
        // Telegram needs HTML parse mode for <code>; resend plainly if it failed is overkill — use HTML:
        return Response.json({ ok: true });
      },
    },
  },
});
