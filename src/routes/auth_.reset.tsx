import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/auth_/reset')({
  head: () => ({ meta: [
    { title: 'Yangi parol — ASTRA' },
    { name: 'description', content: 'ASTRA hisobingiz uchun yangi parol belgilang.' },
    { property: 'og:title', content: 'Yangi parol — ASTRA' },
    { property: 'og:description', content: 'ASTRA hisobingiz parolini xavfsiz yangilang.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null);
    if (password !== confirm) { setError('Parollar bir xil emas.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSaved(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Parolni yangilab bo‘lmadi.'); }
    finally { setBusy(false); }
  }
  return <section className="auth-wrap"><div className="auth-card">
    <h1>Yangi parol</h1>
    {loading ? <p>Yuklanmoqda…</p> : saved ? <><p className="auth-ok" role="status">Parolingiz yangilandi.</p><Button variant="cosmic" asChild><Link to="/">Davom etish</Link></Button></> : !user ? <><p className="auth-sub">Tiklash havolasi eskirgan yoki ochilmagan. Yangi havola so‘rang.</p><Button variant="glass" asChild><Link to="/auth" search={{ next: undefined }}>Kirishga qaytish</Link></Button></> : <form className="auth-form" onSubmit={event => void submit(event)}>
      <input className="auth-input" type="password" aria-label="Yangi parol" placeholder="Yangi parol" autoComplete="new-password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} />
      <input className="auth-input" type="password" aria-label="Parolni takrorlang" placeholder="Parolni takrorlang" autoComplete="new-password" required minLength={6} value={confirm} onChange={event => setConfirm(event.target.value)} />
      {error && <p className="auth-error" role="alert">{error}</p>}
      <Button variant="cosmic" disabled={busy}>{busy ? 'Kuting…' : 'Parolni saqlash'}</Button>
    </form>}
  </div></section>;
}