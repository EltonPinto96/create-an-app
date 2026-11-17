import { useEffect, useState } from "react";

const FAVORITES_KEY = "atm_kota_favorites_v1";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn("Erro ao guardar favoritos no localStorage:", e);
    }
  }, [favoriteIds]);

  function isFavorite(id: string): boolean {
    return favoriteIds.includes(id);
  }

  function toggleFavorite(id: string): void {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
  };
}
