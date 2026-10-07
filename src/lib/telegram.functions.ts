import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyTelegramAuth, type TelegramAuthData } from "./telegram-verify";

const telegramSchema = z
  .object({
    id: z.number(),
    first_name: z.string().max(256),
    last_name: z.string().max(256).optional(),
    username: z.string().max(256).optional(),
    photo_url: z.string().max(1024).optional(),
    auth_date: z.number(),
    hash: z.string().max(256),
  })
  .passthrough();

// Public: tells the login page whether the Telegram button can be shown.
export const getTelegramConfig = createServerFn({ method: "GET" }).handler(async () => {
  const botUsername = (process.env["TELEGRAM_BOT_USERNAME"] ?? "").replace(/^@/, "").trim();
  const enabled = Boolean(process.env["TELEGRAM_BOT_TOKEN"]) && botUsername.length > 0;
  return { enabled, botUsername: enabled ? botUsername : null };
});

type TelegramLoginResult = { ok: true; tokenHash: string } | { ok: false; error: string };

// Verifies the Telegram signature, then mints a one-time sign-in token for the matching user.
export const telegramLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => telegramSchema.parse(input))
  .handler(async ({ data }): Promise<TelegramLoginResult> => {
    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    if (!botToken) return { ok: false, error: "Telegram orqali kirish hali sozlanmagan." };

    const valid = await verifyTelegramAuth(data as TelegramAuthData, botToken);
    if (!valid) return { ok: false, error: "Telegram ma’lumotlari tasdiqlanmadi. Qayta urinib ko‘ring." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `tg-${data.id}@telegram.astra.local`;
    const displayName = [data.first_name, data.last_name].filter(Boolean).join(" ");

    // Creates the account on first login; an "already registered" error is expected afterwards.
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        avatar_url: data.photo_url,
        telegram_id: data.id,
        telegram_username: data.username,
        provider: "telegram",
      },
    });

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (error || !tokenHash || !link?.user) {
      console.error("telegram generateLink failed", error);
      return { ok: false, error: "Kirish tokenini yaratib bo‘lmadi. Keyinroq urinib ko‘ring." };
    }

    await supabaseAdmin.from("profiles").upsert(
      {
        id: link.user.id,
        display_name: displayName,
        avatar_url: data.photo_url ?? null,
        telegram_id: data.id,
        telegram_username: data.username ?? null,
        provider: "telegram",
      },
      { onConflict: "id" },
    );

    return { ok: true, tokenHash };
  });
