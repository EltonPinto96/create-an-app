import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthGatePortal } from "@/components/AuthGatePortal";

// Mock de useAuth
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

describe("AuthGatePortal Component", () => {
  it("renderiza os elementos institucionais e de bloqueio de acesso", () => {
    const handleEmailAuth = vi.fn();

    render(<AuthGatePortal onOpenEmailAuth={handleEmailAuth} />);

    // Título institucional e slogan
    expect(screen.getAllByText(/KUSANGA/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /A força está na ligação/i })).toBeInTheDocument();

    // Mensagem de acesso exclusivo para membros
    expect(screen.getByText(/Acesso Exclusivo para Membros/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Inicia sessão para consultar os caixas e estados/i)
    ).toBeInTheDocument();

    // Botões de login
    expect(screen.getByText(/Entrar com a Conta Google/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Entrar com Email e Palavra-passe/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Criar Nova Conta Gratuita/i)).toBeInTheDocument();
  });

  it("chama o callback para autenticação com email ao clicar no botão", () => {
    const handleEmailAuth = vi.fn();

    render(<AuthGatePortal onOpenEmailAuth={handleEmailAuth} />);

    const emailButton = screen.getByText(/Entrar com Email e Palavra-passe/i);
    fireEvent.click(emailButton);

    expect(handleEmailAuth).toHaveBeenCalledWith("login");
  });
});
