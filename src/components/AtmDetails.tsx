import {
  Banknote,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  X,
  Share2,
  MessageSquare,
  Building2,
  Info,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DemoAtm } from "@/lib/atm-demo-data";
import { type RealAtm } from "@/components/AtmCard";
import { openDirections, buildMapsUrl } from "@/lib/google-maps";
import { openWhatsAppShare } from "@/lib/whatsapp-share";
import { useAtmRecentReports } from "@/lib/atm-queries";

type AtmDetailsData = DemoAtm | RealAtm;

function isDemoAtm(atm: AtmDetailsData): atm is DemoAtm {
  return (
    !("isReal" in atm) ||
    (atm as RealAtm).isReal === false ||
    (atm as RealAtm).isReal === undefined
  );
}

export interface ReportHistory {
  id: string;
  availability: string;
  confirmedAt: string;
  source: string;
}

interface AtmDetailsProps {
  atm: AtmDetailsData;
  onClose: () => void;
  onAccount: () => void;
  onReport?: () => void;
  onQuickNoCash?: (atm: RealAtm) => void;
  reportHistory?: ReportHistory[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const statusMeta: Record<
  string,
  {
    cashTitle: string;
    cashDesc: string;
    opTitle: string;
    color: string;
    icon: typeof CheckCircle2;
  }
> = {
  available: {
    cashTitle: "Reportado com dinheiro",
    cashDesc: "Utilizadores confirmaram levantamentos com sucesso recentemente.",
    opTitle: "Equipamento Operacional",
    color: "text-status-available bg-status-available/10 border-status-available/30",
    icon: CheckCircle2,
  },
  "no-cash": {
    cashTitle: "Reportado sem notas",
    cashDesc: "O terminal está ligado, mas sem notas disponíveis para levantamento.",
    opTitle: "Equipamento Operacional (sem notas)",
    color: "text-status-empty bg-status-empty/10 border-status-empty/30",
    icon: AlertTriangle,
  },
  "out-of-service": {
    cashTitle: "Terminal Indisponível",
    cashDesc: "Equipamento com ecrã desligado, erro de sistema ou em manutenção técnica.",
    opTitle: "Fora de Serviço",
    color: "text-status-offline bg-status-offline/10 border-status-offline/30",
    icon: XCircle,
  },
  stale: {
    cashTitle: "Sem informação recente",
    cashDesc: "O último reporte expirou. A tua confirmação presencial será muito útil.",
    opTitle: "Estado Não Confirmado",
    color: "text-status-stale bg-status-stale/10 border-status-stale/30",
    icon: HelpCircle,
  },
  uncertain: {
    cashTitle: "Informação Contraditória",
    cashDesc: "Foram submetidos reportes opostos nos últimos minutos. Recomenda-se confirmação no local.",
    opTitle: "Estado Divergente / Em Confirmação",
    color: "text-amber-700 bg-amber-500/15 border-amber-500/40",
    icon: AlertTriangle,
  },
};

export function AtmDetails({
  atm,
  onClose,
  onAccount,
  onReport,
  onQuickNoCash,
  reportHistory,
  isFavorite,
  onToggleFavorite,
}: AtmDetailsProps) {
  const isDemo = isDemoAtm(atm);
  const real = atm as RealAtm;
  const meta = statusMeta[atm.availability] ?? statusMeta.stale;
  const StatusIcon = meta.icon;

  const { data: dbReports } = useAtmRecentReports(!isDemo ? atm.id : null);
  const activeReports = (reportHistory && reportHistory.length > 0)
    ? reportHistory
    : (dbReports ?? []).map((r) => ({
        id: r.id,
        availability: r.availability,
        confirmedAt: new Date(r.confirmed_at).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }),
        source: r.notes_available
          ? `${r.availability === 'available' ? 'Com dinheiro' : 'Sem notas'} (${r.notes_available})`
          : r.availability === 'available' ? 'Confirmado com dinheiro' : 'Reportado sem notas',
      }));

  const mapsUrl = !isDemo
    ? real.maps_url ??
      (real.lat !== undefined
        ? buildMapsUrl(real.lat, real.lng ?? 13.23, atm.name)
        : undefined)
    : undefined;

  function handleDirections() {
    if (!isDemo && real.lat !== undefined && real.lng !== undefined) {
      openDirections(real.lat, real.lng);
    }
  }

  // Decomposição de endereço e município
  const areaParts = atm.area.split(",");
  const neighborhood = areaParts[0]?.trim() || "Luanda";
  const municipality = areaParts[1]?.trim() || "Município de Luanda";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-xs p-0 sm:items-center sm:p-5 animate-in fade-in-50"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="atm-detail-title"
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-background p-6 shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#C09A5B]">
                {atm.bank}
              </span>
              {isDemo ? (
                <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                  Amostra Fictícia
                </span>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/30 bg-primary/5 text-primary text-[10px] font-semibold"
                >
                  <ShieldCheck className="mr-1 size-3 text-[#C09A5B]" />
                  Localização Validada
                </Badge>
              )}
            </div>

            <h2
              id="atm-detail-title"
              className="font-display text-2xl font-bold tracking-tight text-foreground"
            >
              {atm.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-[#C09A5B] shrink-0" />
              {atm.area}
            </p>
          </div>

          <div className="flex items-center gap-1 -mr-1 -mt-1 shrink-0">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-[#C09A5B] hover:bg-secondary/70"
                aria-label={isFavorite ? "Remover dos favoritos" : "Guardar nos favoritos"}
                onClick={onToggleFavorite}
              >
                <Heart
                  className={`size-5 transition-colors ${
                    isFavorite ? "fill-[#C09A5B] text-[#C09A5B]" : ""
                  }`}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full text-muted-foreground hover:bg-secondary/70"
              aria-label="Fechar detalhes"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Separador de Dois Estados Independentes (Conforme Requisito do Kusanga Kitadi) */}
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Estado Actual do ATM
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* 1. Disponibilidade de Numerário */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex size-7 items-center justify-center rounded-lg border ${meta.color}`}>
                  <StatusIcon className="size-4" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  1. Numerário
                </span>
              </div>
              <p className="font-display font-bold text-base text-foreground">
                {meta.cashTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {meta.cashDesc}
              </p>
            </div>

            {/* 2. Estado Operacional do Equipamento */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-lg border ${
                    atm.availability === "out-of-service"
                      ? "text-status-offline bg-status-offline/10 border-status-offline/30"
                      : "text-status-available bg-status-available/10 border-status-available/30"
                  }`}
                >
                  <Banknote className="size-4" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  2. Equipamento
                </span>
              </div>
              <p className="font-display font-bold text-base text-foreground">
                {meta.opTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {atm.availability === "out-of-service"
                  ? "O terminal não está a processar operações no momento."
                  : "Sistema bancário e leitor de cartões em funcionamento normal."}
              </p>
            </div>
          </div>

          {/* 3. Indicador de Fila e Notas no Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#C09A5B]/15 text-[#C09A5B] shrink-0">
                <Users className="size-4" />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Tempo de Fila Estimado
                </span>
                <span className="text-xs font-bold text-foreground">
                  {real.queueTime === "none"
                    ? "Sem fila (atendimento direto)"
                    : real.queueTime === "short"
                    ? "Fila rápida (< 5 min)"
                    : real.queueTime === "medium"
                    ? "Fila moderada (5 a 15 min)"
                    : real.queueTime === "long"
                    ? "Fila longa (+15 min)"
                    : "Fila não reportada"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Banknote className="size-4 text-[#C09A5B]" />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Notas Reportadas
                </span>
                <span className="text-xs font-bold text-foreground truncate block">
                  {real.notesAvailable || "Notas não especificadas"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta Rápido: Dinheiro acabou de esgotar */}
        {atm.availability === "available" && onQuickNoCash && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span className="text-foreground font-medium">
                Chegaste ao caixa e o dinheiro acabou?
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded-xl"
              onClick={() => onQuickNoCash(real)}
            >
              Reportar Esgotado
            </Button>
          </div>
        )}

        {/* Aviso de Origem Comunitária */}
        <div className="mt-4 rounded-xl border border-border/80 bg-secondary/40 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="size-4 text-[#C09A5B] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground font-semibold">Origem colaborativa:</strong> A
            informação de disponibilidade resulta exclusivamente de reportes presenciais de
            cidadãos em Luanda. Não constitui confirmação oficial das instituições bancárias.
          </p>
        </div>

        {/* Informações de Localização e Dados Técnicos */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Instituição Bancária:</span>
            <span className="font-bold text-foreground">{atm.bank}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Bairro / Zona:</span>
            <span className="font-semibold text-foreground">{neighborhood}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Município:</span>
            <span className="font-semibold text-foreground">{municipality}</span>
          </div>
          {!isDemo && real.lat !== undefined && real.lng !== undefined && (
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Coordenadas GPS:</span>
              <span className="font-mono text-muted-foreground">
                {real.lat.toFixed(5)}, {real.lng.toFixed(5)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Última confirmação:</span>
            <span className="font-semibold text-foreground">{atm.updated}</span>
          </div>
        </div>

        {/* Histórico de Reportes Recentes da Comunidade */}
        {activeReports && activeReports.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-[#C09A5B]" />
                Histórico Comunitário Recente
              </h4>
              <span className="text-[10px] text-muted-foreground">últimas 2 horas</span>
            </div>
            <div className="space-y-1.5">
              {activeReports.map((rep) => {
                const isAvail = rep.availability === "available";
                const isNoCash = rep.availability === "no-cash";
                const isUncertain = rep.availability === "uncertain";

                return (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-2 shrink-0 rounded-full ${
                          isAvail
                            ? "bg-status-available"
                            : isNoCash
                            ? "bg-status-empty"
                            : isUncertain
                            ? "bg-amber-500 animate-pulse"
                            : "bg-status-stale"
                        }`}
                      />
                      <span className="font-medium text-foreground truncate">{rep.source}</span>
                    </div>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">
                      {rep.confirmedAt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ações / Botões Principais */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 pt-4 border-t border-border">
          {onReport && (
            <Button
              className="w-full sm:flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-sm"
              onClick={onReport}
            >
              <MessageSquare className="size-4 text-[#C09A5B]" />
              Confirmar Notas
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full sm:w-auto h-11 rounded-xl border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold gap-2"
            onClick={() =>
              openWhatsAppShare({
                bank: atm.bank,
                name: atm.name,
                area: atm.area,
                availability: atm.availability,
                updated: atm.updated,
                queueTime: real.queueTime,
                notesAvailable: real.notesAvailable,
                lat: real.lat,
                lng: real.lng,
              })
            }
          >
            <svg className="size-4 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.916 2.8.916 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.584-5.769-5.773-5.769zm10.222 5.766c-.002 5.61-4.568 10.174-10.179 10.174-1.745 0-3.454-.45-4.966-1.305l-5.553 1.456 1.481-5.412c-.938-1.576-1.433-3.39-1.434-5.234.002-5.61 4.568-10.174 10.18-10.174 5.61 0 10.174 4.563 10.176 10.174z" />
            </svg>
            Partilhar
          </Button>

          {!isDemo && real.lat !== undefined && real.lng !== undefined && (
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 rounded-xl border-border hover:border-[#C09A5B]/60 text-xs font-semibold gap-2"
              onClick={handleDirections}
            >
              <Navigation className="size-4 text-[#C09A5B]" />
              Rota
            </Button>
          )}

          {mapsUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex size-11 rounded-xl text-muted-foreground hover:text-foreground"
              title="Abrir no Google Maps"
              onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
