import { supabase, hasSupabase } from "./supabase";
import { toast } from "sonner";

export interface UserRegistrationNotification {
  id: string;
  userId?: string | null;
  userEmail: string;
  userName: string;
  provider: "google" | "email" | "oauth";
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = "kusanga_admin_reg_notifications";

// Carregar notificações em cache local
export function getLocalRegistrationNotifications(): UserRegistrationNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialDemoNotifications();
    return JSON.parse(raw);
  } catch {
    return getInitialDemoNotifications();
  }
}

// Salvar notificações no cache local
export function saveLocalRegistrationNotifications(items: UserRegistrationNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Erro ao salvar notificações locais:", err);
  }
}

function getInitialDemoNotifications(): UserRegistrationNotification[] {
  return [
    {
      id: "reg-demo-1",
      userId: "user-1",
      userEmail: "elton.pinto@gmail.com",
      userName: "Elton Pinto",
      provider: "google",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min atrás
      read: false,
    },
    {
      id: "reg-demo-2",
      userId: "user-2",
      userEmail: "manuel.afonso@live.com",
      userName: "Manuel Afonso",
      provider: "email",
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h atrás
      read: true,
    },
    {
      id: "reg-demo-3",
      userId: "user-3",
      userEmail: "fatima.costa@bancobai.ao",
      userName: "Fátima Costa",
      provider: "google",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
      read: true,
    },
  ];
}

/**
 * Registar novo utilizador (acionado quando alguém se regista via Google ou Email)
 */
export async function recordNewUserRegistration({
  userId,
  userEmail,
  userName,
  provider = "google",
}: {
  userId?: string | null;
  userEmail: string;
  userName?: string | null;
  provider?: "google" | "email" | "oauth";
}): Promise<void> {
  const displayName = userName || userEmail.split("@")[0];
  const newNotif: UserRegistrationNotification = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: userId || null,
    userEmail,
    userName: displayName,
    provider,
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Salvar localmente
  const current = getLocalRegistrationNotifications();
  const updated = [newNotif, ...current.filter((n) => n.userEmail !== userEmail)];
  saveLocalRegistrationNotifications(updated);

  // Se tiver Supabase, persistir na tabela admin_notifications
  if (hasSupabase) {
    try {
      await supabase.from("admin_notifications").insert({
        user_id: userId || null,
        user_email: userEmail,
        user_name: displayName,
        provider,
        created_at: newNotif.createdAt,
        read: false,
      });
    } catch (e) {
      console.warn("Aviso ao guardar notificação de cadastro no Supabase:", e);
    }
  }

  // Notificar administradores e moderadores se estiverem conectados na app
  notifyAdminsInApp(newNotif);
}

/**
 * Disparar notificação visual Sonner para Administradores / Moderadores
 */
export function notifyAdminsInApp(notif: UserRegistrationNotification) {
  toast.info(`👤 Novo Cidadão Registado!`, {
    description: `${notif.userName} (${notif.userEmail}) juntou-se à rede Kusanga Kitadi via ${
      notif.provider === "google" ? "Google" : "Email"
    }.`,
    duration: 7000,
  });
}

/**
 * Obter lista combinada de cadastros (Supabase com fallback local)
 */
export async function fetchRegistrationNotifications(): Promise<UserRegistrationNotification[]> {
  const localItems = getLocalRegistrationNotifications();

  if (!hasSupabase) {
    return localItems;
  }

  try {
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return localItems;
    }

    const mapped: UserRegistrationNotification[] = data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      userEmail: d.user_email,
      userName: d.user_name || d.user_email?.split("@")[0] || "Cidadão",
      provider: d.provider || "google",
      createdAt: d.created_at,
      read: d.read || false,
    }));

    saveLocalRegistrationNotifications(mapped);
    return mapped;
  } catch (err) {
    console.warn("Erro ao buscar notificações do Supabase:", err);
    return localItems;
  }
}

/**
 * Marcar notificação de cadastro como lida
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const current = getLocalRegistrationNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveLocalRegistrationNotifications(updated);

  if (hasSupabase) {
    try {
      await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
    } catch (e) {
      console.warn("Aviso ao atualizar leitura no Supabase:", e);
    }
  }
}
