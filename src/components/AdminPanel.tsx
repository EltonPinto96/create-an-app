import { useEffect, useState, useMemo } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  UserPlus,
  Users,
  UserCheck,
  ShieldAlert,
  Info,
  CheckSquare,
  Lock,
  MessageSquare,
  Search,
  AlertTriangle,
  TrendingUp,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, hasSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  fetchRegistrationNotifications,
  markNotificationAsRead,
  type UserRegistrationNotification,
} from "@/lib/user-registration-notifications";
import {
  fetchAdminRecentReports,
  deleteReport,
  deleteAtm,
  type AdminReportAuditItem,
} from "@/lib/atm-queries";

export interface PendingAtmItem {
  id: string;
  name: string;
  bank_name?: string;
  address: string;
  municipality: string;
  neighborhood?: string | null;
  maps_url?: string | null;
  lat: number;
  lng: number;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

export interface ModeratorItem {
  id: string;
  email: string;
  note?: string | null;
  status: "active" | "pending" | "revoked";
  created_at: string;
  invited_by?: string | null;
}

interface AdminPanelProps {
  onBackToApp: () => void;
}

export function AdminPanel({ onBackToApp }: AdminPanelProps) {
  const { user, isAdmin, isModerator } = useAuth();
  const [tab, setTab] = useState<"pending" | "approved" | "reports" | "banks" | "moderators" | "registrations">("pending");
  const [pendingAtms, setPendingAtms] = useState<PendingAtmItem[]>([]);
  const [approvedAtms, setApprovedAtms] = useState<PendingAtmItem[]>([]);
  const [recentReports, setRecentReports] = useState<AdminReportAuditItem[]>([]);
  const [banks, setBanks] = useState<{ id: string; name: string }[]>([]);
  const [moderators, setModerators] = useState<ModeratorItem[]>([]);
  const [registrations, setRegistrations] = useState<UserRegistrationNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtros de pesquisa nas abas
  const [approvedSearchQuery, setApprovedSearchQuery] = useState("");
  const [reportsSearchQuery, setReportsSearchQuery] = useState("");

  // Formulário para novo banco
  const [newBankName, setNewBankName] = useState("");
  const [isAddingBank, setIsAddingBank] = useState(false);

  // Formulário para convidar moderador
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [isInvitingModerator, setIsInvitingModerator] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setMessage(null);
    if (!hasSupabase) {
      setIsLoading(false);
      setMessage({
        text: "Supabase não configurado neste ambiente. Aceda com as variáveis de ambiente ativas.",
        type: "error",
      });
      return;
    }
    try {
      // 1. Carregar bancos
      const { data: banksData } = await supabase.from("banks").select("id, name").order("name");
      if (banksData) setBanks(banksData);

      // 2. Carregar ATMs pendentes
      const { data: pendingData } = await supabase
        .from("atms")
        .select("*, bank:banks(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingData) {
        setPendingAtms(
          pendingData.map((a: any) => ({
            ...a,
            bank_name: a.bank?.name ?? "Banco",
          }))
        );
      }

      // 3. Carregar ATMs aprovados
      const { data: approvedData } = await supabase
        .from("atms")
        .select("*, bank:banks(name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (approvedData) {
        setApprovedAtms(
          approvedData.map((a: any) => ({
            ...a,
            bank_name: a.bank?.name ?? "Banco",
          }))
        );
      }

      // 4. Carregar Moderadores (apenas se for admin)
      if (isAdmin) {
        try {
          const { data: modsData } = await (supabase as any)
            .from("moderator_roles")
            .select("*")
            .order("created_at", { ascending: false });

          if (modsData) {
            setModerators(modsData);
          }
        } catch {
          // Tabela pode ainda estar por criar se a migração 002 não tiver sido corrida
        }
      }

      // 5. Carregar Notificações de Novos Cadastros
      try {
        const regData = await fetchRegistrationNotifications();
        if (regData) setRegistrations(regData);
      } catch {
        // Fallback já tratado internamente
      }

      // 6. Carregar Reportes Recentes para Auditoria
      try {
        const repData = await fetchAdminRecentReports();
        if (repData) setRecentReports(repData);
      } catch {
        // Fallback
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do admin:", err);
      setMessage({
        text: "Não foi possível carregar alguns dados. Verifica as funções e tabelas do Supabase.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  async function handleApprove(atmId: string) {
    if (!hasSupabase) return;
    setActionLoadingId(atmId);
    try {
      // Tenta via rpc primeiro, senão direto via update
      const { error: rpcErr } = await supabase.rpc("approve_atm", { target_atm_id: atmId });
      if (rpcErr) {
        const { error: updErr } = await supabase
          .from("atms")
          .update({ status: "approved", approved_at: new Date().toISOString() })
          .eq("id", atmId);
        if (updErr) throw updErr;
      }

      setMessage({ text: "ATM aprovado com sucesso! Já está visível na aplicação.", type: "success" });
      await loadData();
    } catch (err: any) {
      setMessage({ text: `Erro ao aprovar: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(atmId: string) {
    if (!hasSupabase) return;
    setActionLoadingId(atmId);
    try {
      const { error: rpcErr } = await supabase.rpc("reject_atm", { target_atm_id: atmId });
      if (rpcErr) {
        const { error: updErr } = await supabase
          .from("atms")
          .update({ status: "rejected" })
          .eq("id", atmId);
        if (updErr) throw updErr;
      }

      setMessage({ text: "ATM rejeitado e arquivado.", type: "success" });
      await loadData();
    } catch (err: any) {
      setMessage({ text: `Erro ao rejeitar: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAddBank(e: React.FormEvent) {
    e.preventDefault();
    if (!newBankName.trim() || !hasSupabase) return;
    setIsAddingBank(true);
    try {
      const { error } = await supabase.from("banks").insert({ name: newBankName.trim() });
      if (error) throw error;
      setNewBankName("");
      setMessage({ text: `Banco "${newBankName.trim()}" adicionado com sucesso!`, type: "success" });
      await loadData();
    } catch (err: any) {
      setMessage({ text: `Erro ao adicionar banco: ${err.message}`, type: "error" });
    } finally {
      setIsAddingBank(false);
    }
  }

  async function handleInviteModerator(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !hasSupabase) return;
    setIsInvitingModerator(true);
    setMessage(null);

    const emailClean = inviteEmail.trim().toLowerCase();
    const noteClean = inviteNote.trim() || null;

    try {
      const { data, error } = await (supabase as any)
        .from("moderator_roles")
        .insert({
          email: emailClean,
          note: noteClean,
          invited_by: user?.id ?? null,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        // Se a tabela ainda não foi criada via SQL no Supabase, avisar o utilizador
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          throw new Error("A tabela 'moderator_roles' ainda não existe no Supabase. Executa a migration 002 no SQL Editor.");
        }
        throw error;
      }

      setModerators((prev) => [data, ...prev.filter((m) => m.email !== emailClean)]);
      setInviteEmail("");
      setInviteNote("");
      setMessage({
        text: `Moderador "${emailClean}" adicionado com sucesso! Já tem permissões para validar caixas.`,
        type: "success",
      });
    } catch (err: any) {
      setMessage({ text: `Erro ao convidar moderador: ${err.message}`, type: "error" });
    } finally {
      setIsInvitingModerator(false);
    }
  }

  async function handleToggleModeratorStatus(mod: ModeratorItem) {
    if (!hasSupabase) return;
    const newStatus = mod.status === "active" ? "revoked" : "active";
    setActionLoadingId(mod.id);
    try {
      const { error } = await (supabase as any)
        .from("moderator_roles")
        .update({ status: newStatus })
        .eq("id", mod.id);

      if (error) throw error;

      setModerators((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, status: newStatus } : m))
      );
      setMessage({
        text: `Permissões de "${mod.email}" ${newStatus === "active" ? "reativadas" : "revogadas"}.`,
        type: "success",
      });
    } catch (err: any) {
      setMessage({ text: `Erro ao atualizar moderador: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRemoveModerator(modId: string, email: string) {
    if (!hasSupabase) return;
    if (!confirm(`Tens a certeza que desejas remover permanentemente o moderador ${email}?`)) {
      return;
    }
    setActionLoadingId(modId);
    try {
      const { error } = await (supabase as any)
        .from("moderator_roles")
        .delete()
        .eq("id", modId);

      if (error) throw error;

      setModerators((prev) => prev.filter((m) => m.id !== modId));
      setMessage({ text: `Moderador "${email}" removido com sucesso.`, type: "success" });
    } catch (err: any) {
      setMessage({ text: `Erro ao remover moderador: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Moderação de Reportes Comunitários
  async function handleDeleteReport(reportId: string, atmName: string) {
    if (!confirm(`Tens a certeza que desejas invalidar e remover este reporte de "${atmName}"?`)) return;
    setActionLoadingId(reportId);
    try {
      await deleteReport(reportId);
      setRecentReports((prev) => prev.filter((r) => r.id !== reportId));
      setMessage({ text: `Reporte de "${atmName}" invalidado e removido da rede.`, type: "success" });
    } catch (err: any) {
      setMessage({ text: `Erro ao remover reporte: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Gestão de ATMs Aprovados: Desactivar / Suspender
  async function handleDeactivateAtm(atmId: string, atmName: string) {
    if (!confirm(`Desejas suspender/desactivar o caixa "${atmName}"? Deixará de estar visível para a comunidade.`)) return;
    setActionLoadingId(atmId);
    try {
      const { error } = await supabase
        .from("atms")
        .update({ status: "rejected" })
        .eq("id", atmId);
      if (error) throw error;
      setMessage({ text: `Caixa "${atmName}" suspenso e arquivado.`, type: "success" });
      await loadData();
    } catch (err: any) {
      setMessage({ text: `Erro ao desativar caixa: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Eliminar Definitivamente ATM (Apenas Admin)
  async function handleDeleteAtmPermanent(atmId: string, atmName: string) {
    if (!confirm(`ATENÇÃO: Tens a certeza que desejas ELIMINAR DEFINITIVAMENTE o caixa "${atmName}"? Esta acção não pode ser anulada.`)) return;
    setActionLoadingId(atmId);
    try {
      await deleteAtm(atmId);
      setMessage({ text: `Caixa "${atmName}" eliminado permanentemente da base de dados.`, type: "success" });
      await loadData();
    } catch (err: any) {
      setMessage({ text: `Erro ao eliminar caixa: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Eliminar Banco sem caixas associados
  async function handleDeleteBank(bankId: string, bankName: string) {
    const atmsCount =
      approvedAtms.filter((a) => a.bank_name?.toLowerCase() === bankName.toLowerCase()).length +
      pendingAtms.filter((a) => a.bank_name?.toLowerCase() === bankName.toLowerCase()).length;
    if (atmsCount > 0) {
      setMessage({
        text: `Não é possível remover o banco "${bankName}" porque tem ${atmsCount} caixa(s) associado(s).`,
        type: "error",
      });
      return;
    }
    if (!confirm(`Desejas remover o banco "${bankName}"?`)) return;
    setActionLoadingId(bankId);
    try {
      const { error } = await supabase.from("banks").delete().eq("id", bankId);
      if (error) throw error;
      setMessage({ text: `Banco "${bankName}" removido com sucesso.`, type: "success" });
      await loadData();
    } catch (err: any) {
      setMessage({ text: `Erro ao remover banco: ${err.message}`, type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Métricas e Filtros
  const availableReportsCount = recentReports.filter((r) => r.availability === "available").length;
  const networkAvailabilityPercent =
    recentReports.length > 0
      ? Math.round((availableReportsCount / recentReports.length) * 100)
      : 0;

  const filteredApprovedAtms = useMemo(() => {
    if (!approvedSearchQuery.trim()) return approvedAtms;
    const q = approvedSearchQuery.toLowerCase();
    return approvedAtms.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.bank_name && a.bank_name.toLowerCase().includes(q)) ||
        a.address.toLowerCase().includes(q) ||
        a.municipality.toLowerCase().includes(q)
    );
  }, [approvedAtms, approvedSearchQuery]);

  const filteredReports = useMemo(() => {
    if (!reportsSearchQuery.trim()) return recentReports;
    const q = reportsSearchQuery.toLowerCase();
    return recentReports.filter(
      (r) =>
        r.atm_name.toLowerCase().includes(q) ||
        r.atm_bank.toLowerCase().includes(q) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.reporter_name && r.reporter_name.toLowerCase().includes(q))
    );
  }, [recentReports, reportsSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Painel Admin */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5 text-[#C09A5B]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  Painel de Moderação
                </h1>
                <Badge
                  variant="outline"
                  className="border-[#C09A5B]/40 text-[#C09A5B] bg-[#C09A5B]/10 font-bold text-[10px]"
                >
                  {isAdmin ? "Super Administrador" : "Moderador de Conteúdo"}
                </Badge>
              </div>
              <p className="text-[11px] text-[#C09A5B] font-semibold">
                KUSANGA KITADI · A força está na ligação.
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {isAdmin
              ? "Gere caixas pendentes, convide moderadores e administre a rede de bancos."
              : "Valida e aprova caixas automáticos submetidos pelos cidadãos em Luanda."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="rounded-xl text-xs font-semibold">
            <RefreshCw className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="secondary" size="sm" onClick={onBackToApp} className="rounded-xl text-xs font-bold">
            Voltar à app
          </Button>
        </div>
      </div>

      {/* Alerta de Mensagem */}
      {message && (
        <div
          className={`flex items-start justify-between rounded-md p-3.5 text-xs ${
            message.type === "success"
              ? "border border-status-available/30 bg-status-available/10 text-foreground"
              : "border border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="size-4 text-status-available shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-destructive shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Cartões de Métricas Globais da Rede */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
          <p className="mt-1 font-display text-2xl font-bold text-status-stale">
            {pendingAtms.length}
          </p>
          <span className="text-[10px] text-muted-foreground">aguardam validação</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">ATMs Aprovados</p>
          <p className="mt-1 font-display text-2xl font-bold text-status-available">
            {approvedAtms.length}
          </p>
          <span className="text-[10px] text-muted-foreground">ativos na rede</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Reportes Recentes</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            {recentReports.length}
          </p>
          <span className="text-[10px] text-muted-foreground">últimas contribuições</span>
        </div>
        <div className="rounded-2xl border border-[#C09A5B]/30 bg-[#C09A5B]/5 p-4">
          <p className="text-xs font-medium text-[#C09A5B]">Saúde da Rede</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#C09A5B]">
            {networkAvailabilityPercent}%
          </p>
          <span className="text-[10px] text-muted-foreground">{availableReportsCount} caixas com notas</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Bancos Comerciais</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {banks.length}
          </p>
          <span className="text-[10px] text-muted-foreground">instituições registadas</span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setTab("pending")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            tab === "pending"
              ? "border-[#C09A5B] text-[#C09A5B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ATMs Pendentes ({pendingAtms.length})
        </button>
        <button
          onClick={() => setTab("approved")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            tab === "approved"
              ? "border-[#C09A5B] text-[#C09A5B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ATMs Aprovados ({approvedAtms.length})
        </button>

        {/* Aba: Auditoria de Reportes Comunitários */}
        <button
          onClick={() => setTab("reports")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            tab === "reports"
              ? "border-[#C09A5B] text-[#C09A5B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="size-3.5 text-[#C09A5B]" />
          Auditoria de Reportes ({recentReports.length})
        </button>

        {/* Aba: Notificações de Novos Cadastros (Admins e Moderadores) */}
        <button
          onClick={() => setTab("registrations")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            tab === "registrations"
              ? "border-[#C09A5B] text-[#C09A5B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="size-3.5 text-[#C09A5B]" />
          Novos Cadastros ({registrations.length})
          {registrations.filter((r) => !r.read).length > 0 && (
            <Badge className="bg-destructive text-white h-4 px-1.5 text-[9px] font-bold">
              {registrations.filter((r) => !r.read).length} novos
            </Badge>
          )}
        </button>

        {/* Abas Exclusivas de Administrador */}
        {isAdmin ? (
          <>
            <button
              onClick={() => setTab("moderators")}
              className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                tab === "moderators"
                  ? "border-[#C09A5B] text-[#C09A5B]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="size-3.5 text-[#C09A5B]" />
              Moderadores ({moderators.length})
            </button>
            <button
              onClick={() => setTab("banks")}
              className={`border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === "banks"
                  ? "border-[#C09A5B] text-[#C09A5B]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Bancos ({banks.length})
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto px-2">
            <Lock className="size-3" />
            <span>Gestão avançada reservada ao Super Admin</span>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba 1: Pendentes */}
      {tab === "pending" && (
        <div className="space-y-3">
          {pendingAtms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <CheckCircle2 className="mx-auto size-8 text-status-available/60" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                Tudo em dia! Nenhum ATM pendente de aprovação.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Quando novos caixas forem sugeridos pelos cidadãos, surgirão aqui para validação.
              </p>
            </div>
          ) : (
            pendingAtms.map((atm) => (
              <div
                key={atm.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-[#C09A5B]/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#C09A5B] uppercase tracking-wider">
                      {atm.bank_name}
                    </span>
                    <Badge variant="outline" className="border-status-stale/40 text-status-stale text-[10px]">
                      Pendente
                    </Badge>
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">{atm.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3 text-[#C09A5B]" />
                    {atm.address}
                    {atm.neighborhood && ` · ${atm.neighborhood}`}
                    {` (${atm.municipality})`}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Submetido em: {new Date(atm.created_at).toLocaleString("pt-AO")}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  {atm.maps_url && (
                    <a
                      href={atm.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Ver localização no Google Maps"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(atm.id)}
                    disabled={actionLoadingId === atm.id}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl text-xs font-semibold"
                  >
                    {actionLoadingId === atm.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1 size-3.5" />
                        Rejeitar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(atm.id)}
                    disabled={actionLoadingId === atm.id}
                    className="bg-[#26362F] text-white hover:bg-[#26362F]/90 rounded-xl text-xs font-bold"
                  >
                    {actionLoadingId === atm.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 size-3.5 text-[#C09A5B]" />
                        Aprovar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Aprovados */}
      {tab === "approved" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={approvedSearchQuery}
                onChange={(e) => setApprovedSearchQuery(e.target.value)}
                placeholder="Pesquisar caixas aprovados por nome, banco ou município..."
                className="h-10 pl-9 text-xs rounded-xl"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredApprovedAtms.length} de {approvedAtms.length} caixas
            </span>
          </div>

          {filteredApprovedAtms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Nenhum caixa encontrado para a pesquisa.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApprovedAtms.map((atm) => (
                <div
                  key={atm.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-[#C09A5B]/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#C09A5B] uppercase tracking-wider">
                        {atm.bank_name}
                      </span>
                      <span className="font-display text-sm font-bold text-foreground">{atm.name}</span>
                      <Badge variant="outline" className="border-status-available/30 text-status-available text-[10px]">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {atm.address} · {atm.municipality} {atm.neighborhood && `(${atm.neighborhood})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {atm.maps_url && (
                      <a
                        href={atm.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title="Ver no Google Maps"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === atm.id}
                      onClick={() => handleDeactivateAtm(atm.id, atm.name)}
                      className="border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl text-xs font-semibold"
                      title="Desativar este caixa e ocultar da comunidade"
                    >
                      <PowerOff className="mr-1 size-3.5" />
                      Suspender
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionLoadingId === atm.id}
                        onClick={() => handleDeleteAtmPermanent(atm.id, atm.name)}
                        className="size-9 p-0 text-destructive hover:bg-destructive/10 rounded-xl"
                        title="Eliminar permanentemente da base de dados"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Auditoria de Reportes Comunitários */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#C09A5B]/30 bg-gradient-to-r from-[#26362F]/5 via-background to-[#C09A5B]/5 p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C09A5B]/15 text-[#C09A5B]">
                <MessageSquare className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Auditoria de Reportes em Tempo Real
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Fiscalize as confirmações presenciais submetidas pelos cidadãos. Se identificar informação incorreta, manipulada ou spam, invalide o reporte para proteger a fiabilidade da comunidade.
                </p>
              </div>
            </div>
          </div>

          {/* Campo de pesquisa de reportes */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={reportsSearchQuery}
              onChange={(e) => setReportsSearchQuery(e.target.value)}
              placeholder="Filtrar por caixa, banco, relator ou comentário..."
              className="h-10 pl-9 text-xs rounded-xl"
            />
          </div>

          {filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Nenhum reporte encontrado para este filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((rep) => {
                const isAvail = rep.availability === "available";
                const isNoCash = rep.availability === "no-cash";
                return (
                  <div
                    key={rep.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-[#C09A5B]/40"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#C09A5B] uppercase tracking-wider">
                          {rep.atm_bank}
                        </span>
                        <span className="font-display text-sm font-bold text-foreground truncate">
                          {rep.atm_name}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isAvail
                              ? "border-status-available/40 text-status-available bg-status-available/10 text-[10px]"
                              : isNoCash
                              ? "border-status-empty/40 text-status-empty bg-status-empty/10 text-[10px]"
                              : "border-status-stale/40 text-status-stale text-[10px]"
                          }
                        >
                          {isAvail ? "Com Notas" : isNoCash ? "Sem Notas" : "Fora de Serviço"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {rep.notes_available && (
                          <span className="text-foreground font-medium">
                            💵 {rep.notes_available}
                          </span>
                        )}
                        {rep.queue_time && (
                          <span>
                            ⏱️ {rep.queue_time === "none" ? "Sem fila" : `Fila: ${rep.queue_time}`}
                          </span>
                        )}
                        <span>
                          👤 {rep.reporter_name}
                        </span>
                        <span>
                          🕒 {new Date(rep.confirmed_at).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })} ({new Date(rep.confirmed_at).toLocaleDateString("pt-AO")})
                        </span>
                      </div>

                      {rep.comment && (
                        <p className="text-xs italic text-foreground/80 mt-1 bg-muted/40 px-2.5 py-1 rounded-lg">
                          "{rep.comment}"
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === rep.id}
                      onClick={() => handleDeleteReport(rep.id, rep.atm_name)}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl text-xs font-semibold shrink-0"
                    >
                      {actionLoadingId === rep.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-1 size-3.5" />
                          Invalidar Reporte
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Novos Cadastros de Utilizadores */}
      {tab === "registrations" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#C09A5B]/30 bg-gradient-to-r from-[#26362F]/5 via-background to-[#C09A5B]/5 p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C09A5B]/15 text-[#C09A5B]">
                <UserCheck className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Registos de Novos Utilizadores
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Receba notificações sempre que um novo utilizador se registar na plataforma Kusanga Kitadi.
                  Marque como lido para manter o controlo das novas adesões.
                </p>
              </div>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="size-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum cadastro registado ainda</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Os novos registos aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className={`rounded-xl border p-4 transition-all ${
                    reg.read
                      ? "border-border bg-background"
                      : "border-[#C09A5B]/40 bg-[#C09A5B]/5 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        reg.read
                          ? "bg-muted text-muted-foreground"
                          : "bg-[#C09A5B]/20 text-[#C09A5B]"
                      }`}>
                        {(reg.userName || reg.userEmail || "U")[0].toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {reg.userName || "Utilizador sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{reg.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              reg.provider === "google"
                                ? "border-blue-400/50 text-blue-600"
                                : "border-primary/30 text-primary"
                            }`}
                          >
                            {reg.provider === "google" ? "Google" : "Email"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(reg.createdAt).toLocaleDateString("pt-AO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!reg.read && (
                        <span className="size-2 rounded-full bg-[#C09A5B] animate-pulse" title="Novo" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={async () => {
                          await markNotificationAsRead(reg.id);
                          setRegistrations((prev) =>
                            prev.map((r) => (r.id === reg.id ? { ...r, read: true } : r))
                          );
                        }}
                        disabled={reg.read}
                      >
                        <CheckSquare className="size-3.5" />
                        {reg.read ? "Lido" : "Marcar lido"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 3: Gestão de Moderadores (Apenas Admin) */}
      {tab === "moderators" && isAdmin && (
        <div className="space-y-6">
          {/* Card de Informações e Escopo de Permissões */}
          <div className="rounded-2xl border border-[#C09A5B]/30 bg-gradient-to-r from-[#26362F]/5 via-background to-[#C09A5B]/5 p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C09A5B]/15 text-[#C09A5B]">
                <Users className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Equipa de Moderação Comunitária (RBAC)
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Os moderadores têm poderes para **analisar, aprovar e rejeitar caixas automáticos pendentes**, garantindo que as sugestões da comunidade chegam com rapidez e qualidade. Não têm acesso para eliminar bancos ou gerir administradores.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário: Convidar Novo Moderador */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <UserPlus className="size-4 text-[#C09A5B]" />
              Convidar Novo Moderador
            </h4>
            <form onSubmit={handleInviteModerator} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="mod-email" className="text-xs text-muted-foreground mb-1 block">
                  Endereço de Email
                </Label>
                <Input
                  id="mod-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo.moderador@gmail.com"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="mod-note" className="text-xs text-muted-foreground mb-1 block">
                  Área / Nota de Identificação (Opcional)
                </Label>
                <Input
                  id="mod-note"
                  type="text"
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  placeholder="Ex: Responsável Talatona / Mutamba"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="sm:self-end">
                <Button
                  type="submit"
                  disabled={isInvitingModerator || !inviteEmail.trim()}
                  className="h-10 px-5 text-xs font-bold bg-[#26362F] text-white hover:bg-[#26362F]/90 rounded-xl w-full sm:w-auto"
                >
                  {isInvitingModerator ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="mr-1.5 size-3.5 text-[#C09A5B]" />
                      Conceder Permissões
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Lista de Moderadores Ativos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-foreground">
                Moderadores Registados ({moderators.length})
              </h4>
              <span className="text-xs text-muted-foreground">
                Ativos e com permissão de validação
              </span>
            </div>

            {moderators.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Ainda não adicionaste nenhum moderador. Introduz um email acima para partilhar o trabalho de aprovação de caixas.
              </div>
            ) : (
              moderators.map((mod) => (
                <div
                  key={mod.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-[#C09A5B]/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      {mod.email.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{mod.email}</span>
                        <Badge
                          variant="outline"
                          className={
                            mod.status === "active"
                              ? "border-status-available/40 text-status-available text-[10px]"
                              : "border-destructive/40 text-destructive text-[10px]"
                          }
                        >
                          {mod.status === "active" ? "Ativo" : "Acesso Revogado"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mod.note || "Moderador de Conteúdo"} · Desde{" "}
                        {new Date(mod.created_at).toLocaleDateString("pt-AO")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === mod.id}
                      onClick={() => handleToggleModeratorStatus(mod)}
                      className="h-8 text-xs font-semibold rounded-xl"
                    >
                      {mod.status === "active" ? "Revogar Acesso" : "Reativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actionLoadingId === mod.id}
                      onClick={() => handleRemoveModerator(mod.id, mod.email)}
                      className="size-8 p-0 text-destructive hover:bg-destructive/10 rounded-xl"
                      title="Eliminar Moderador"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Matriz Explicativa de Permissões */}
          <div className="rounded-2xl border border-border bg-muted/40 p-5 text-xs space-y-3">
            <h5 className="font-display font-bold text-foreground flex items-center gap-2">
              <Info className="size-4 text-[#C09A5B]" />
              Matriz de Permissões (RBAC)
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Funcionalidade</th>
                    <th className="py-2 px-3 font-semibold text-center text-[#C09A5B]">Super Admin</th>
                    <th className="py-2 px-3 font-semibold text-center text-status-available">Moderador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="py-2 pr-4 text-foreground">Validar e Aprovar Caixas Pendentes</td>
                    <td className="py-2 px-3 text-center text-status-available font-bold">✓ Total</td>
                    <td className="py-2 px-3 text-center text-status-available font-bold">✓ Total</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-foreground">Rejeitar Caixas Incorretos / Duplicados</td>
                    <td className="py-2 px-3 text-center text-status-available font-bold">✓ Total</td>
                    <td className="py-2 px-3 text-center text-status-available font-bold">✓ Total</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-foreground">Convidar e Gerir Novos Moderadores</td>
                    <td className="py-2 px-3 text-center text-status-available font-bold">✓ Total</td>
                    <td className="py-2 px-3 text-center text-muted-foreground font-bold">✗ Sem acesso</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-foreground">Cadastrar e Gerir Bancos Comerciais</td>
                    <td className="py-2 px-3 text-center text-status-available font-bold">✓ Total</td>
                    <td className="py-2 px-3 text-center text-muted-foreground font-bold">✗ Sem acesso</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Gestão de Bancos (Apenas Admin) */}
      {tab === "banks" && isAdmin && (
        <div className="space-y-4">
          {/* Adicionar novo banco */}
          <form onSubmit={handleAddBank} className="flex gap-2 max-w-md">
            <Input
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="Nome do banco (ex: BAI, BFA, Banco Sol...)"
              className="h-10 text-xs rounded-xl"
            />
            <Button
              type="submit"
              disabled={isAddingBank || !newBankName.trim()}
              className="h-10 px-4 text-xs font-bold bg-[#26362F] text-white hover:bg-[#26362F]/90 rounded-xl"
            >
              {isAddingBank ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1 size-3.5 text-[#C09A5B]" />
                  Adicionar
                </>
              )}
            </Button>
          </form>

          {/* Lista de Bancos com Contagem de Caixas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {banks.map((b) => {
              const count =
                approvedAtms.filter((a) => a.bank_name?.toLowerCase() === b.name.toLowerCase()).length +
                pendingAtms.filter((a) => a.bank_name?.toLowerCase() === b.name.toLowerCase()).length;

              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="size-4 text-[#C09A5B] shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground truncate block">{b.name}</span>
                      <span className="text-[11px] text-muted-foreground">{count} caixa(s) associado(s)</span>
                    </div>
                  </div>

                  {count === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actionLoadingId === b.id}
                      onClick={() => handleDeleteBank(b.id, b.name)}
                      className="size-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      title={`Remover banco "${b.name}"`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
