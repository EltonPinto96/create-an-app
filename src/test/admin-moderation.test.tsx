import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminPanel } from "@/components/AdminPanel";

// Mock das queries e supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "bank-1", name: "BAI" },
            { id: "bank-2", name: "BFA" },
          ],
        }),
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "atm-pend-1",
                name: "ATM Mutamba Centro",
                bank: { name: "BAI" },
                address: "Rua Direita de Luanda",
                municipality: "Luanda",
                neighborhood: "Mutamba",
                lat: -8.8145,
                lng: 13.2301,
                created_at: new Date().toISOString(),
                status: "pending",
              },
            ],
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: "new-mod", email: "mod@teste.ao" }, error: null }),
        })),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
  hasSupabase: true,
}));

vi.mock("@/lib/user-registration-notifications", () => ({
  fetchRegistrationNotifications: vi.fn().mockResolvedValue([
    {
      id: "reg-1",
      userId: "u-1",
      userEmail: "novo.cidadão@luanda.ao",
      userName: "Kamba Novo",
      provider: "google",
      createdAt: new Date().toISOString(),
      read: false,
    },
  ]),
  markNotificationAsRead: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/atm-queries", () => ({
  fetchAdminRecentReports: vi.fn().mockResolvedValue([
    {
      id: "rep-audit-1",
      atm_id: "atm-pend-1",
      atm_name: "ATM Mutamba Centro",
      atm_bank: "BAI",
      availability: "available",
      notes_available: "Notas de 5.000 Kz",
      queue_time: "short",
      comment: "A funcionar muito rápido",
      confirmed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      reported_by: "u-1",
      reporter_name: "Cidadão Vigilante",
    },
  ]),
  deleteReport: vi.fn().mockResolvedValue(undefined),
  deleteAtm: vi.fn().mockResolvedValue(undefined),
}));

// Mock variável de autenticação para alternar entre Admin e Moderador
let mockAuth = {
  user: { id: "admin-1", email: "admin@kusanga.ao" },
  isAdmin: true,
  isModerator: false,
  canModerate: true,
  loading: false,
  signOut: vi.fn(),
};

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => mockAuth,
}));

describe("Fase 5 — Painel de Administração e Moderação", () => {
  beforeEach(() => {
    mockAuth = {
      user: { id: "admin-1", email: "admin@kusanga.ao" },
      isAdmin: true,
      isModerator: false,
      canModerate: true,
      loading: false,
      signOut: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("renderiza o cabeçalho e métricas da rede no painel de administração", async () => {
    render(<AdminPanel onBackToApp={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /Painel de Moderação/i })).toBeInTheDocument();
    expect(screen.getByText(/KUSANGA KITADI · A força está na ligação/i)).toBeInTheDocument();
    expect(screen.getByText(/Super Administrador/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/ATMs Pendentes/i)).toBeInTheDocument();
      expect(screen.getByText(/Auditoria de Reportes/i)).toBeInTheDocument();
    });
  });

  it("permite navegar para a aba de Auditoria de Reportes e exibe detalhes de reportes comunitários", async () => {
    render(<AdminPanel onBackToApp={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Auditoria de Reportes/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Auditoria de Reportes/i));

    await waitFor(() => {
      expect(screen.getByText(/Auditoria de Reportes em Tempo Real/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Filtrar por caixa, banco, relator ou comentário.../i)).toBeInTheDocument();
      expect(screen.getByText(/ATM Mutamba Centro/i)).toBeInTheDocument();
      expect(screen.getByText(/A funcionar muito rápido/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalidar Reporte/i)).toBeInTheDocument();
    });
  });

  it("restringe a visibilidade das abas exclusivas quando o utilizador é apenas Moderador", async () => {
    mockAuth = {
      user: { id: "mod-1", email: "moderador@kusanga.ao" },
      isAdmin: false,
      isModerator: true,
      canModerate: true,
      loading: false,
      signOut: vi.fn(),
    };

    render(<AdminPanel onBackToApp={vi.fn()} />);

    expect(screen.getByText(/Moderador de Conteúdo/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão avançada reservada ao Super Admin/i)).toBeInTheDocument();

    // Abas de super admin não devem estar acessíveis
    expect(screen.queryByRole("button", { name: /^Moderadores/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Bancos/i })).not.toBeInTheDocument();
  });
});
