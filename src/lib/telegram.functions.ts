import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyTelegramAuth, type TelegramAuthData } from "./telegram-verify";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const telegramSchema = z
  .object({
    id: z.number().int().positive().safe(),
    first_name: z.string().max(256),
    last_name: z.string().max(256).optional(),
    username: z.string().max(256).optional(),
    photo_url: z.string().max(1024).optional(),
    auth_date: z.number().int().positive(),
    hash: z.string().regex(/^[a-fA-F0-9]{64}$/),
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
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
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
    if (createError && createError.code !== "email_exists" && createError.code !== "user_already_exists") {
      return { ok: false, error: "Telegram hisobini yaratib bo‘lmadi. Keyinroq urinib ko‘ring." };
    }

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (error || !tokenHash || !link?.user) {
      return { ok: false, error: "Kirish tokenini yaratib bo‘lmadi. Keyinroq urinib ko‘ring." };
    }
    if (link.user.user_metadata?.['telegram_id'] !== data.id) {
      return { ok: false, error: "Bu hisob Telegram foydalanuvchisiga mos kelmadi. Administratorga murojaat qiling." };
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
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
    if (profileError) return { ok: false, error: "Profilni saqlab bo‘lmadi. Keyinroq urinib ko‘ring." };

    return { ok: true, tokenHash };
  });

const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

// Signs in with the 6-digit code the bot sent to the user's Telegram chat.
export const telegramCodeLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => codeSchema.parse(input))
  .handler(async ({ data }): Promise<TelegramLoginResult> => {
    if (!process.env["TELEGRAM_BOT_TOKEN"]) {
      return { ok: false, error: "Telegram orqali kirish hali sozlanmagan." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: codeError } = await supabaseAdmin
      .from("telegram_codes")
      .select("id, telegram_id, first_name, last_name, username, photo_url, expires_at, used")
      .eq("code", data.code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (codeError || !row) {
      return { ok: false, error: "Kod noto‘g‘ri yoki eskirgan. Botdan yangi kod oling." };
    }

    // Mark used immediately so the code cannot be replayed.
    const { error: useError } = await supabaseAdmin
      .from("telegram_codes")
      .update({ used: true })
      .eq("id", row.id)
      .eq("used", false);
    if (useError) return { ok: false, error: "Kodni tasdiqlab bo‘lmadi. Qayta urinib ko‘ring." };

    const email = `tg-${row.telegram_id}@telegram.astra.local`;
    const displayName = [row.first_name, row.last_name].filter(Boolean).join(" ") || "Telegram foydalanuvchi";

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        avatar_url: row.photo_url,
        telegram_id: row.telegram_id,
        telegram_username: row.username,
        provider: "telegram",
      },
    });
    if (createError && createError.code !== "email_exists" && createError.code !== "user_already_exists") {
      return { ok: false, error: "Telegram hisobini yaratib bo‘lmadi. Keyinroq urinib ko‘ring." };
    }

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (error || !tokenHash || !link?.user) {
      return { ok: false, error: "Kirish tokenini yaratib bo‘lmadi. Keyinroq urinib ko‘ring." };
    }
    if (link.user.user_metadata?.["telegram_id"] !== row.telegram_id) {
      return { ok: false, error: "Bu hisob Telegram foydalanuvchisiga mos kelmadi. Administratorga murojaat qiling." };
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: link.user.id,
        display_name: displayName,
        avatar_url: row.photo_url ?? null,
        telegram_id: row.telegram_id,
        telegram_username: row.username ?? null,
        provider: "telegram",
      },
      { onConflict: "id" },
    );
    if (profileError) return { ok: false, error: "Profilni saqlab bo‘lmadi. Keyinroq urinib ko‘ring." };

    return { ok: true, tokenHash };
  });

// Admin-only: registers the webhook URL with Telegram so the bot receives messages.
export const setupTelegramWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().url() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${botToken}`));
    const bytes = new Uint8Array(digest);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const secret = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: data.url,
        secret_token: secret,
        allowed_updates: ["message", "edited_message"],
      }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`Telegram setWebhook failed [${res.status}]: ${body}`);
    return { ok: true, response: body };
  });
