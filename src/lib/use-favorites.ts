import { useEffect, useState, useCallback } from "react";
import { supabase, hasSupabase } from "./supabase";
import { useAuth } from "./auth-context";

const FAVORITES_KEY = "kusanga_kitadi_favorites_v2";

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(FAVORITES_KEY) || localStorage.getItem("atm_kota_favorites_v1");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 1. Sincronização com o Supabase quando o utilizador está autenticado
  useEffect(() => {
    if (!user || !hasSupabase) return;

    let isMounted = true;

    async function syncRemoteFavorites() {
      try {
        const { data, error } = await supabase
          .from("user_favorites" as any)
          .select("atm_id")
          .eq("user_id", user.id);

        if (error) {
          console.warn("Aviso ao carregar favoritos remotos:", error.message);
          return;
        }

        if (isMounted && data) {
          const remoteIds = data.map((item: any) => item.atm_id);
          
          // Fazer merge dos favoritos locais não sincronizados
          const merged = Array.from(new Set([...remoteIds, ...favoriteIds]));
          setFavoriteIds(merged);

          // Se existiam favoritos locais que não estavam na nuvem, salvá-los no Supabase
          const newToRemote = favoriteIds.filter((id) => !remoteIds.includes(id));
          if (newToRemote.length > 0) {
            const records = newToRemote.map((atm_id) => ({
              user_id: user.id,
              atm_id,
            }));
            await supabase.from("user_favorites" as any).upsert(records, { onConflict: "user_id,atm_id" });
          }
        }
      } catch (err) {
        console.warn("Erro na sincronização de favoritos:", err);
      }
    }

    syncRemoteFavorites();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 2. Persistência em cache local como fallback offline
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn("Erro ao guardar favoritos no localStorage:", e);
    }
  }, [favoriteIds]);

  const isFavorite = useCallback(
    (id: string): boolean => {
      return favoriteIds.includes(id);
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<void> => {
      const isCurrentlyFav = favoriteIds.includes(id);

      // Atualização otimista no estado local
      setFavoriteIds((prev) =>
        isCurrentlyFav ? prev.filter((item) => item !== id) : [...prev, id]
      );

      // Sincronização remota se autenticado
      if (user && hasSupabase) {
        try {
          if (isCurrentlyFav) {
            await supabase
              .from("user_favorites" as any)
              .delete()
              .eq("user_id", user.id)
              .eq("atm_id", id);
          } else {
            await supabase
              .from("user_favorites" as any)
              .insert({
                user_id: user.id,
                atm_id: id,
              });
          }
        } catch (err) {
          console.warn("Erro ao sincronizar favorito com Supabase:", err);
        }
      }
    },
    [favoriteIds, user]
  );

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
  };
}
