import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Clock, ShieldX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const OPEN_PATHS = ["/auth", "/admin"];

export function AccessGate({ children, introOpen }: { children: ReactNode; introOpen: boolean }) {
  const { user, loading, status, isAdmin, refresh, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const open = OPEN_PATHS.includes(pathname);

  useEffect(() => {
    if (!open && !introOpen && !loading && !user) {
      void navigate({ to: "/auth", search: { next: pathname === "/" ? undefined : pathname }, replace: true });
    }
  }, [open, introOpen, loading, user, pathname, navigate]);

  if (open) return <>{children}</>;
  if (loading || !user) return <div className="gate-card"><p>Yuklanmoqda…</p></div>;
  if (isAdmin || status === "approved") return <>{children}</>;

  const rejected = status === "rejected";
  return (
    <section className="gate-wrap">
      <div className="gate-card">
        {rejected ? <ShieldX /> : <Clock />}
        <h1>{rejected ? "So‘rovingiz rad etildi" : "Admin tasdig‘i kutilmoqda"}</h1>
        <p>
          {rejected
            ? "Afsuski, administrator kirishingizni tasdiqlamadi. Savollar bo‘lsa, administratorga murojaat qiling."
            : "Ro‘yxatdan o‘tdingiz! Administrator tasdiqlagach, barcha fanlardan foydalana olasiz."}
        </p>
        <div className="hero-actions">
          {!rejected && <Button variant="cosmic" onClick={() => void refresh()}>Holatni tekshirish</Button>}
          <Button variant="glass" onClick={() => void signOut()}>Chiqish</Button>
        </div>
      </div>
    </section>
  );
}

export function AdminLink() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <Button variant="nav" asChild>
      <Link to="/admin"><Shield /><span>Admin panel</span></Link>
    </Button>
  );
}
