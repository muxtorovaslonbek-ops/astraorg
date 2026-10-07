import { Link } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div className="user-avatar" aria-hidden="true">·</div>;

  if (!user) {
    return (
      <Button variant="cosmic" size="sm" asChild>
        <Link to="/auth">
          <LogIn /> Kirish
        </Link>
      </Button>
    );
  }

  const meta = user.user_metadata ?? {};
  const name: string = meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "O‘quvchi";
  const avatar: string | undefined = meta.avatar_url ?? meta.picture;

  return (
    <>
      <div className="user-avatar">
        {avatar ? <img src={avatar} alt="" className="user-avatar-img" referrerPolicy="no-referrer" /> : name.charAt(0).toUpperCase()}
      </div>
      <div className="user-label">
        <strong>{name}</strong>
        <small>O‘quvchi</small>
      </div>
      <Button variant="ghost" size="icon" aria-label="Chiqish" onClick={() => void signOut()}>
        <LogOut />
      </Button>
    </>
  );
}
