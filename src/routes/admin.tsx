import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AccessStatus } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — ASTRA" },
      { name: "description", content: "ASTRA foydalanuvchilarini tasdiqlash va boshqarish paneli." },
      { property: "og:title", content: "Admin panel — ASTRA" },
      { property: "og:description", content: "Foydalanuvchilarni tasdiqlash, rad etish va kutish rejimiga qo‘yish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Row = {
  id: string; display_name: string | null; email: string | null; avatar_url: string | null;
  telegram_username: string | null; provider: string | null; status: string; created_at: string;
};

const LABEL: Record<string, string> = { pending: "Kutilmoqda", approved: "Tasdiqlangan", rejected: "Rad etilgan" };

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | AccessStatus>("all");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url, telegram_username, provider, status, created_at")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message); else { setErr(null); setRows(data as Row[]); }
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  async function setStatus(id: string, status: AccessStatus) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) setErr(error.message);
    else setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  if (loading) return <div className="gate-card"><p>Yuklanmoqda…</p></div>;
  if (!user) return <div className="gate-card"><h1>Admin panel</h1><p>Avval tizimga kiring.</p><Button variant="cosmic" asChild><Link to="/auth" search={{ next: "/admin" }}>Kirish</Link></Button></div>;
  if (!isAdmin) return <div className="gate-card"><h1>Ruxsat yo‘q</h1><p>Bu sahifa faqat administratorlar uchun.</p></div>;

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div className="content-page admin-page">
      <div className="admin-head">
        <div><span className="eyebrow">ASTRA / ADMIN</span><h1>Foydalanuvchilar</h1></div>
        <Button variant="glass" size="sm" onClick={() => void load()}><RefreshCw /> Yangilash</Button>
      </div>
      <div className="admin-filters">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "cosmic" : "glass"} onClick={() => setFilter(f)}>
            {f === "all" ? `Barchasi (${rows.length})` : `${LABEL[f]} (${count(f)})`}
          </Button>
        ))}
      </div>
      {err && <p className="auth-error">{err}</p>}
      <div className="admin-list">
        {shown.length === 0 && <p className="auth-sub">Foydalanuvchilar yo‘q.</p>}
        {shown.map((r) => (
          <div key={r.id} className="admin-row">
            <div className="user-avatar">{r.avatar_url ? <img src={r.avatar_url} alt="" className="user-avatar-img" referrerPolicy="no-referrer" /> : (r.display_name ?? "?").charAt(0).toUpperCase()}</div>
            <div className="admin-info">
              <strong>{r.display_name ?? "Nomsiz"}{r.id === user.id ? " (siz)" : ""}</strong>
              <small>{r.email ?? (r.telegram_username ? `@${r.telegram_username}` : "—")} · {r.provider ?? "email"} · {new Date(r.created_at).toLocaleDateString("uz-UZ")}</small>
            </div>
            <span className={`status-badge status-${r.status}`}>{LABEL[r.status] ?? r.status}</span>
            <div className="admin-actions">
              <Button size="sm" variant={r.status === "approved" ? "cosmic" : "glass"} onClick={() => void setStatus(r.id, "approved")}><Check /> Tasdiqlash</Button>
              <Button size="sm" variant={r.status === "pending" ? "cosmic" : "glass"} onClick={() => void setStatus(r.id, "pending")}><Clock /> Kutish</Button>
              <Button size="sm" variant={r.status === "rejected" ? "cosmic" : "glass"} onClick={() => void setStatus(r.id, "rejected")}><X /> Rad etish</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
