import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubmitReportForm } from "@/components/SubmitReportForm";

describe("Fase 2 — Sistema de Reportes e Confiança Comunitária", () => {
  it("renderiza os campos de estado, notas disponíveis e tempos de fila", () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SubmitReportForm
        atmName="ATM BFA Maianga"
        atmBank="BFA"
        onSubmit={handleSubmit}
      />
    );

    // Título e identificação do caixa
    expect(screen.getByText(/ATM BFA Maianga/i)).toBeInTheDocument();

    // Opções de status inicial
    expect(screen.getByText(/Sim, levantei/i)).toBeInTheDocument();
    expect(screen.getByText(/Sem dinheiro/i)).toBeInTheDocument();

    // Opções de notas
    expect(screen.getByText(/Notas de 5.000 Kz/i)).toBeInTheDocument();
    expect(screen.getByText(/Notas de 2.000 e 5.000 Kz/i)).toBeInTheDocument();

    // Opções de tempo de fila
    expect(screen.getByText(/Sem fila/i)).toBeInTheDocument();
    expect(screen.getByText(/< 5 min/i)).toBeInTheDocument();
  });

  it("permite submeter um reporte com notas e fila seleccionadas", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SubmitReportForm
        atmName="ATM BAI Mutamba"
        atmBank="BAI"
        onSubmit={handleSubmit}
      />
    );

    // Clicar na nota de 5.000 Kz
    const note5000 = screen.getByText(/Notas de 5.000 Kz/i);
    fireEvent.click(note5000);

    // Clicar em Sem Fila
    const queueNone = screen.getByText(/Sem fila/i);
    fireEvent.click(queueNone);

    // Submeter formulário
    const submitBtn = screen.getByRole("button", { name: /Enviar confirmação/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const callPayload = handleSubmit.mock.calls[0][0];
    expect(callPayload.availability).toBe("available");
    expect(callPayload.withdrew).toBe(true);
    expect(callPayload.notesAvailable).toBe("Notas de 5.000 Kz");
    expect(callPayload.queueTime).toBe("none");
  });

  it("permite reportar ATM esgotado (sem dinheiro)", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SubmitReportForm
        atmName="ATM BIC Talatona"
        atmBank="BIC"
        onSubmit={handleSubmit}
      />
    );

    // Clicar na opção "Sem dinheiro"
    const noCashBtn = screen.getByText(/Sem dinheiro/i);
    fireEvent.click(noCashBtn);

    // Submeter
    const submitBtn = screen.getByRole("button", { name: /Enviar confirmação/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const callPayload = handleSubmit.mock.calls[0][0];
    expect(callPayload.availability).toBe("no-cash");
    expect(callPayload.withdrew).toBe(false);
  });
});
