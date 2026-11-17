import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, hasSupabase } from "@/lib/supabase";

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

interface AdminPanelProps {
  onBackToApp: () => void;
}

export function AdminPanel({ onBackToApp }: AdminPanelProps) {
  const [tab, setTab] = useState<"pending" | "approved" | "banks">("pending");
  const [pendingAtms, setPendingAtms] = useState<PendingAtmItem[]>([]);
  const [approvedAtms, setApprovedAtms] = useState<PendingAtmItem[]>([]);
  const [banks, setBanks] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Formulário para novo banco
  const [newBankName, setNewBankName] = useState("");
  const [isAddingBank, setIsAddingBank] = useState(false);

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
      const { data: pendingData, error: pErr } = await supabase
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
    } catch (err: any) {
      console.error("Erro ao carregar dados do admin:", err);
      setMessage({
        text: "Não foi possível carregar alguns dados. Verifica se as funções do Supabase estão configuradas.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Painel de Moderação</h1>
                <Badge variant="outline" className="border-[#C09A5B]/40 text-[#C09A5B] bg-[#C09A5B]/10 font-bold text-[10px]">
                  Kusanga Admin
                </Badge>
              </div>
              <p className="text-[11px] text-[#C09A5B] font-semibold">
                KUSANGA KITADI · A força está na ligação.
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Revê as sugestões comunitárias de novos caixas automáticos e gere a rede de bancos em Luanda.
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

      {/* Cartões de Métricas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Pendentes de aprovação</p>
          <p className="mt-1 font-display text-2xl font-bold text-status-stale">
            {pendingAtms.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">ATMs Aprovados (Ativos)</p>
          <p className="mt-1 font-display text-2xl font-bold text-status-available">
            {approvedAtms.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Bancos Cadastrados</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {banks.length}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("pending")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            tab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ATMs Pendentes ({pendingAtms.length})
        </button>
        <button
          onClick={() => setTab("approved")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            tab === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ATMs Aprovados ({approvedAtms.length})
        </button>
        <button
          onClick={() => setTab("banks")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            tab === "banks"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Bancos ({banks.length})
        </button>
      </div>

      {/* Conteúdo da Aba 1: Pendentes */}
      {tab === "pending" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingAtms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <CheckCircle2 className="mx-auto size-8 text-status-available" />
              <h3 className="mt-3 text-sm font-semibold">Tudo em dia!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Não existem ATMs a aguardar aprovação de momento. Novas sugestões de utilizadores aparecerão aqui.
              </p>
            </div>
          ) : (
            pendingAtms.map((atm) => (
              <div
                key={atm.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{atm.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {atm.bank_name}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-status-stale border-status-stale/30">
                      Aguarda revisão
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>
                      {atm.address} {atm.neighborhood ? `· ${atm.neighborhood}` : ""} · {atm.municipality}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Submetido: {new Date(atm.created_at).toLocaleString("pt-AO")}
                    </span>
                    {atm.maps_url && (
                      <a
                        href={atm.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="size-3" />
                        Verificar no Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Ações de Moderação */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={actionLoadingId === atm.id}
                    onClick={() => handleReject(atm.id)}
                  >
                    <X className="mr-1 size-3.5" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                    disabled={actionLoadingId === atm.id}
                    onClick={() => handleApprove(atm.id)}
                  >
                    {actionLoadingId === atm.id ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 size-3.5" />
                    )}
                    Aprovar ATM
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Aprovados */}
      {tab === "approved" && (
        <div className="space-y-3">
          {approvedAtms.map((atm) => (
            <div
              key={atm.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 text-xs"
            >
              <div>
                <span className="font-semibold text-foreground text-sm">{atm.name}</span>
                <span className="ml-2 text-muted-foreground">({atm.bank_name})</span>
                <p className="mt-0.5 text-muted-foreground">{atm.address}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-status-available/30 text-status-available text-[10px]">
                  Ativo no público
                </Badge>
                {atm.maps_url && (
                  <a
                    href={atm.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    title="Google Maps"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo da Aba 3: Gestão de Bancos */}
      {tab === "banks" && (
        <div className="space-y-4">
          {/* Adicionar novo banco */}
          <form onSubmit={handleAddBank} className="flex gap-2 max-w-md">
            <Input
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="Nome do banco (ex: BAI, BFA, Banco Sol...)"
              className="h-9 text-xs"
            />
            <Button type="submit" size="sm" disabled={isAddingBank || !newBankName.trim()}>
              {isAddingBank ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1 size-3.5" />
                  Adicionar
                </>
              )}
            </Button>
          </form>

          {/* Lista de Bancos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            {banks.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-xs"
              >
                <Building2 className="size-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
