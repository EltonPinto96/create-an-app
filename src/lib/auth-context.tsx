import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, hasSupabase } from "./supabase";

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isModerator: boolean;
  canModerate: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega perfil e permissões de admin/moderador para o utilizador
  async function loadUserData(currentUser: User | null) {
    if (!currentUser || !hasSupabase) {
      setProfile(null);
      setIsAdmin(false);
      setIsModerator(false);
      return;
    }

    try {
      // 1. Buscar perfil
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (prof) {
        setProfile(prof as UserProfile);
      } else {
        setProfile({
          id: currentUser.id,
          display_name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.user_metadata?.display_name ||
            currentUser.email?.split("@")[0] ||
            "Utilizador",
          avatar_url:
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            null,
        });
      }

      // 2. Verificar se é admin
      const { data: adminRecord } = await supabase
        .from("admin_roles")
        .select("id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      const adminActive = Boolean(adminRecord);
      setIsAdmin(adminActive);

      // 3. Verificar se é moderador
      if (adminActive) {
        setIsModerator(true);
      } else {
        try {
          const { data: modRecord } = await (supabase as any)
            .from("moderator_roles")
            .select("id, status")
            .or(`user_id.eq.${currentUser.id},email.ilike.${currentUser.email}`)
            .eq("status", "active")
            .maybeSingle();

          setIsModerator(Boolean(modRecord));
        } catch {
          setIsModerator(false);
        }
      }
    } catch (err) {
      console.warn("Erro ao carregar dados do perfil/admin:", err);
      setProfile({
        id: currentUser.id,
        display_name: currentUser.email?.split("@")[0] || "Utilizador",
        avatar_url: null,
      });
      setIsAdmin(false);
      setIsModerator(false);
    }
  }

  useEffect(() => {
    // Se não há Supabase configurado, encerrar o loading imediatamente
    if (!hasSupabase) {
      setLoading(false);
      return;
    }

    // 1. Obter sessão inicial
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        return loadUserData(initialSession?.user ?? null);
      })
      .catch((err) => {
        console.error("Erro ao verificar sessão Supabase:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Escutar mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      await loadUserData(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (!hasSupabase) return { error: new Error("Backend não configurado. Contacta o administrador.") };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async function signUp(email: string, password: string, displayName?: string) {
    if (!hasSupabase) return { error: new Error("Backend não configurado. Contacta o administrador.") };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split("@")[0] } },
      });

      if (error) return { error: new Error(error.message) };

      const requiresEmailConfirmation = !data.session;
      return { error: null, requiresEmailConfirmation };
    } catch (err: any) {
      return { error: err };
    }
  }

  async function signInWithGoogle() {
    if (!hasSupabase) return { error: new Error("Backend não configurado. Contacta o administrador.") };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async function signOut() {
    if (!hasSupabase) {
      setProfile(null);
      setIsAdmin(false);
      setIsModerator(false);
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signOut();
      setProfile(null);
      setIsAdmin(false);
      setIsModerator(false);
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isModerator,
        canModerate: isAdmin || isModerator,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
