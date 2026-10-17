import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getTelegramConfig, telegramLogin } from "@/lib/telegram.functions";
import type { TelegramAuthData } from "@/lib/telegram-verify";
import { safeAuthPath } from '@/lib/auth-path';

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? safeAuthPath(s["next"]) : undefined,
  }),
  loader: () => getTelegramConfig(),
  head: () => ({
    meta: [
      { title: "Kirish va ro‘yxatdan o‘tish — ASTRA" },
      { name: "description", content: "ASTRA’ga email, Google yoki Telegram orqali kiring yoki ro‘yxatdan o‘ting." },
      { property: "og:title", content: "Kirish va ro‘yxatdan o‘tish — ASTRA" },
      { property: "og:description", content: "Email, Google yoki Telegram orqali ASTRA’ga kiring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => <div className="auth-card"><p>{error instanceof Error ? error.message : "Xatolik yuz berdi"}</p></div>,
  component: AuthPage,
});

function TelegramButton({ bot, onAuth }: { bot: string; onAuth: (u: TelegramAuthData) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onAuth);
  cb.current = onAuth;
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    (window as unknown as Record<string, unknown>)["onTelegramAuth"] = (u: TelegramAuthData) => cb.current(u);
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "10");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    host.appendChild(s);
    return () => {
      host.innerHTML = "";
      delete (window as unknown as Record<string, unknown>)["onTelegramAuth"];
    };
  }, [bot]);
  return <div ref={ref} className="auth-telegram" />;
}

function AuthPage() {
  const config = Route.useLoaderData();
  const { next } = Route.useSearch();
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const saved = sessionStorage.getItem('astra-auth-next');
    sessionStorage.removeItem('astra-auth-next');
    router.history.replace(safeAuthPath(next ?? saved));
  }, [user, next, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setMsg({ type: "ok", text: "Emailingizga tasdiqlash havolasi yuborildi. Havolani bosing, so‘ng kiring." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` });
        if (error) throw error;
        setMsg({ type: "ok", text: "Parolni tiklash havolasi emailingizga yuborildi." });
      }
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Xatolik yuz berdi" });
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setMsg(null);
    sessionStorage.setItem('astra-auth-next', safeAuthPath(next));
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) setMsg({ type: "error", text: "Google orqali kirib bo‘lmadi. Qayta urinib ko‘ring." });
    } catch { setMsg({ type: "error", text: "Google orqali kirib bo‘lmadi. Qayta urinib ko‘ring." }); }
  }

  async function telegram(u: TelegramAuthData) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await telegramLogin({ data: u });
      if (!res.ok) throw new Error(res.error);
      const { error } = await supabase.auth.verifyOtp({ token_hash: res.tokenHash, type: "magiclink" });
      if (error) throw error;
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Telegram orqali kirib bo‘lmadi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <h1>{mode === "signin" ? "ASTRA’ga kirish" : mode === "signup" ? "Ro‘yxatdan o‘tish" : "Parolni tiklash"}</h1>
        <p className="auth-sub">Bilim olamiga xush kelibsiz.</p>

        {mode !== "forgot" && (
          <div className="auth-social">
            <Button type="button" variant="glass" onClick={() => void google()}>Google bilan davom etish</Button>
            {config.enabled && config.botUsername ? (
              <TelegramButton bot={config.botUsername} onAuth={(u) => void telegram(u)} />
            ) : (
              <small className="auth-hint">Telegram orqali kirish hozircha mavjud emas.</small>
            )}
            <span className="auth-or">yoki email bilan</span>
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="auth-form">
          {mode === "signup" && (
            <input className="auth-input" aria-label="Ismingiz" autoComplete="name" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          )}
          <input className="auth-input" type="email" aria-label="Email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "forgot" && (
            <input className="auth-input" type="password" aria-label="Parol" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="Parol (kamida 6 belgi)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          )}
          {msg && <p className={msg.type === "error" ? "auth-error" : "auth-ok"} role="status">{msg.text}</p>}
          <Button type="submit" variant="cosmic" disabled={busy}>
            {busy ? "Kuting…" : mode === "signin" ? "Kirish" : mode === "signup" ? "Ro‘yxatdan o‘tish" : "Havola yuborish"}
          </Button>
        </form>

        <div className="auth-links">
          {mode !== "signin" && <Button variant="link" type="button" onClick={() => { setMode("signin"); setMsg(null); }}>Kirish</Button>}
          {mode !== "signup" && <Button variant="link" type="button" onClick={() => { setMode("signup"); setMsg(null); }}>Ro‘yxatdan o‘tish</Button>}
          {mode === "signin" && <Button variant="link" type="button" onClick={() => { setMode("forgot"); setMsg(null); }}>Parolni unutdingizmi?</Button>}
        </div>
      </div>
    </section>
  );
}
