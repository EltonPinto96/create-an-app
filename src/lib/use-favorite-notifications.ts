import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { AtmData } from "@/routes/index";

export interface FavoriteNotification {
  id: string;
  atmId: string;
  atmName: string;
  bank: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = "atm_kota_fav_notifications_v1";
const STATUS_CACHE_KEY = "atm_kota_fav_status_cache_v1";

const statusLabelMap: Record<string, string> = {
  available: "Com dinheiro",
  "no-cash": "Sem dinheiro",
  "out-of-service": "Fora de serviço",
  stale: "Sem informação recente",
};

export function useFavoriteNotifications(favoriteIds: string[], atms: AtmData[]) {
  const [notifications, setNotifications] = useState<FavoriteNotification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const saveNotifications = useCallback((items: FavoriteNotification[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Erro ao guardar notificações:", e);
    }
  }, []);

  // Monitorizar alterações de estado nos ATMs favoritos
  useEffect(() => {
    if (!favoriteIds.length || !atms.length || typeof window === "undefined") return;

    let cachedStatuses: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(STATUS_CACHE_KEY);
      if (raw) cachedStatuses = JSON.parse(raw);
    } catch {
      cachedStatuses = {};
    }

    const newNotifications: FavoriteNotification[] = [];
    const updatedStatuses = { ...cachedStatuses };

    for (const atm of atms) {
      if (!favoriteIds.includes(atm.id)) continue;

      const currentStatus = atm.availability || "stale";
      const previousStatus = cachedStatuses[atm.id];

      // Se já tínhamos registo anterior e o estado mudou
      if (previousStatus && previousStatus !== currentStatus) {
        const notif: FavoriteNotification = {
          id: `notif-${Date.now()}-${atm.id}-${Math.random().toString(36).substring(2, 6)}`,
          atmId: atm.id,
          atmName: atm.name,
          bank: atm.bank,
          previousStatus,
          newStatus: currentStatus,
          timestamp: new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }),
          read: false,
        };
        newNotifications.push(notif);

        // Disparar toast do Sonner
        const oldLabel = statusLabelMap[previousStatus] || previousStatus;
        const newLabel = statusLabelMap[currentStatus] || currentStatus;

        if (currentStatus === "available") {
          toast.success(`🔔 ${atm.name} (${atm.bank})`, {
            description: `Passou de "${oldLabel}" para "${newLabel}"! Dinheiro confirmado.`,
            duration: 6000,
          });
        } else if (currentStatus === "no-cash") {
          toast.warning(`⚠️ ${atm.name} (${atm.bank})`, {
            description: `Atenção: agora está "${newLabel}".`,
            duration: 6000,
          });
        } else if (currentStatus === "out-of-service") {
          toast.error(`❌ ${atm.name} (${atm.bank})`, {
            description: `Caixa ficou "${newLabel}".`,
            duration: 6000,
          });
        } else {
          toast.info(`ℹ️ ${atm.name} (${atm.bank})`, {
            description: `O estado expirou e está "${newLabel}".`,
            duration: 5000,
          });
        }
      }

      // Atualizar cache
      updatedStatuses[atm.id] = currentStatus;
    }

    // Salvar novo cache de estados
    try {
      localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(updatedStatuses));
    } catch (e) {
      console.warn("Erro ao atualizar cache de status:", e);
    }

    // Se houver novas notificações, acrescentar à lista
    if (newNotifications.length > 0) {
      saveNotifications([...newNotifications, ...notifications]);
    }
  }, [favoriteIds, atms, notifications, saveNotifications]);

  // Função para simular ou forçar atualização de um favorito
  const simulateStatusChange = useCallback(
    (atmId: string, newStatus: "available" | "no-cash" | "out-of-service" | "stale") => {
      const atm = atms.find((a) => a.id === atmId);
      if (!atm) return;

      let cachedStatuses: Record<string, string> = {};
      try {
        const raw = localStorage.getItem(STATUS_CACHE_KEY);
        if (raw) cachedStatuses = JSON.parse(raw);
      } catch {
        cachedStatuses = {};
      }

      const prevStatus = cachedStatuses[atmId] || atm.availability || "stale";
      cachedStatuses[atmId] = newStatus;
      localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(cachedStatuses));

      const notif: FavoriteNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        atmId,
        atmName: atm.name,
        bank: atm.bank,
        previousStatus: prevStatus,
        newStatus,
        timestamp: `Hoje às ${new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}`,
        read: false,
      };

      const oldLabel = statusLabelMap[prevStatus] || prevStatus;
      const newLabel = statusLabelMap[newStatus] || newStatus;

      if (newStatus === "available") {
        toast.success(`🔔 ${atm.name} (${atm.bank})`, {
          description: `Atualização: passou de "${oldLabel}" para "${newLabel}"!`,
          duration: 6000,
        });
      } else if (newStatus === "no-cash") {
        toast.warning(`⚠️ ${atm.name} (${atm.bank})`, {
          description: `Atualização: agora está "${newLabel}".`,
          duration: 6000,
        });
      } else {
        toast.error(`❌ ${atm.name} (${atm.bank})`, {
          description: `Atualização: caixa está "${newLabel}".`,
          duration: 6000,
        });
      }

      saveNotifications([notif, ...notifications]);
    },
    [atms, notifications, saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const clearNotifications = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    simulateStatusChange,
  };
}
