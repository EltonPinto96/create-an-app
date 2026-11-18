import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";

// ─── Testes: PrivacyPolicyModal ───────────────────────────────────────────────
describe("PrivacyPolicyModal", () => {
  it("renderiza o título e conteúdo da política de privacidade", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal onClose={onClose} />);

    expect(screen.getByText("Política de Privacidade")).toBeInTheDocument();
    expect(
      screen.getByText(/A tua privacidade é a nossa responsabilidade/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nunca solicitará/i)
    ).toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão de fechar (X)", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("chama onClose ao clicar no overlay", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal onClose={onClose} />);

    // O overlay tem aria-hidden="true", usa querySelector
    const overlay = document.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("contém aviso de nunca solicitar PINs ou dados bancários", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal onClose={onClose} />);

    expect(
      screen.getByText(/PINs bancários/i)
    ).toBeInTheDocument();
  });

  it("botão confirmar fecha o modal", () => {
    const onClose = vi.fn();
    render(<PrivacyPolicyModal onClose={onClose} />);

    const confirmBtn = screen.getByRole("button", { name: /Compreendido/i });
    fireEvent.click(confirmBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─── Testes: TermsOfUseModal ──────────────────────────────────────────────────
describe("TermsOfUseModal", () => {
  it("renderiza o título e conteúdo dos termos de uso", () => {
    const onClose = vi.fn();
    render(<TermsOfUseModal onClose={onClose} />);

    expect(screen.getByText("Termos de Uso Comunitário")).toBeInTheDocument();
    expect(
      screen.getByText(/A força está na ligação. Usa a plataforma com responsabilidade/i)
    ).toBeInTheDocument();
  });

  it("exibe aviso sobre natureza colaborativa da informação", () => {
    const onClose = vi.fn();
    render(<TermsOfUseModal onClose={onClose} />);

    expect(
      screen.getByText(/não garante a exactidão/i)
    ).toBeInTheDocument();
  });

  it("lista comportamentos proibidos", () => {
    const onClose = vi.fn();
    render(<TermsOfUseModal onClose={onClose} />);

    expect(
      screen.getByText(/Comportamentos Proibidos/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reportes falsos/i)
    ).toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão de aceitação", () => {
    const onClose = vi.fn();
    render(<TermsOfUseModal onClose={onClose} />);

    const acceptBtn = screen.getByRole("button", { name: /Li e Aceito/i });
    fireEvent.click(acceptBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("exibe aviso de segurança financeira explícito", () => {
    const onClose = vi.fn();
    render(<TermsOfUseModal onClose={onClose} />);

    expect(
      screen.getByText(/nunca solicitará/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/PIN bancário/i)
    ).toBeInTheDocument();
  });
});

// ─── Testes: Consistência em Português ───────────────────────────────────────
describe("Consistência da Língua Portuguesa (pt-AO)", () => {
  it("PrivacyPolicyModal não contém texto em inglês", () => {
    const onClose = vi.fn();
    const { container } = render(<PrivacyPolicyModal onClose={onClose} />);
    const text = container.textContent || "";

    expect(text).not.toMatch(/privacy policy/i);
    expect(text).not.toMatch(/close/i);
    expect(text).not.toMatch(/cancel/i);
    // Deve estar em português
    expect(text).toMatch(/Privacidade/i);
  });

  it("TermsOfUseModal não contém texto em inglês", () => {
    const onClose = vi.fn();
    const { container } = render(<TermsOfUseModal onClose={onClose} />);
    const text = container.textContent || "";

    expect(text).not.toMatch(/terms of use/i);
    expect(text).not.toMatch(/prohibited/i);
    // Deve estar em português
    expect(text).toMatch(/Termos de Uso/i);
    expect(text).toMatch(/Luanda/i);
  });
});
