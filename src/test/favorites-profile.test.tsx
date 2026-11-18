import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "@/lib/use-favorites";

// Mock de useAuth
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-123", email: "elton@exemplo.ao" },
  }),
}));

describe("Fase 3 — Favoritos, Perfil e Experiência do Utilizador", () => {
  it("permite adicionar e remover caixas dos favoritos com persistência", async () => {
    const { result } = renderHook(() => useFavorites());

    // Inicialmente não deve conter o caixa de teste
    expect(result.current.isFavorite("atm-bfa-maianga")).toBe(false);

    // Adicionar aos favoritos
    await act(async () => {
      await result.current.toggleFavorite("atm-bfa-maianga");
    });

    expect(result.current.isFavorite("atm-bfa-maianga")).toBe(true);
    expect(result.current.favoriteIds).toContain("atm-bfa-maianga");

    // Remover dos favoritos
    await act(async () => {
      await result.current.toggleFavorite("atm-bfa-maianga");
    });

    expect(result.current.isFavorite("atm-bfa-maianga")).toBe(false);
    expect(result.current.favoriteIds).not.toContain("atm-bfa-maianga");
  });
});
