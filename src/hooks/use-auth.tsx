import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccessStatus = "pending" | "approved" | "rejected";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  status: AccessStatus | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null, session: null, loading: true, status: null, isAdmin: false,
  refresh: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const userId = session?.user.id ?? null;

  const loadAccess = useCallback(async (id: string | null) => {
    if (!id) { setStatus(null); setIsAdmin(false); return; }
    setAccessLoading(true);
    const [{ data: profile }, { data: admin }] = await Promise.all([
      supabase.from("profiles").select("status").eq("id", id).maybeSingle(),
      supabase.rpc("has_role", { _user_id: id, _role: "admin" }),
    ]);
    setStatus((profile?.status as AccessStatus | undefined) ?? "pending");
    setIsAdmin(Boolean(admin));
    setAccessLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { void loadAccess(userId); }, [userId, loadAccess]);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading: sessionLoading || accessLoading,
      status,
      isAdmin,
      refresh: () => loadAccess(userId),
      signOut: async () => { await supabase.auth.signOut(); },
    }),
    [session, sessionLoading, accessLoading, status, isAdmin, userId, loadAccess],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
