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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DemoAtm } from "@/lib/atm-demo-data";
import { type RealAtm } from "@/components/AtmCard";
import { openDirections, buildMapsUrl } from "@/lib/google-maps";

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
};

export function AtmDetails({
  atm,
  onClose,
  onAccount,
  onReport,
  reportHistory,
  isFavorite,
  onToggleFavorite,
}: AtmDetailsProps) {
  const isDemo = isDemoAtm(atm);
  const real = atm as RealAtm;
  const meta = statusMeta[atm.availability] ?? statusMeta.stale;
  const StatusIcon = meta.icon;

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
        </div>

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

        {/* Histórico de Reportes (quando disponível) */}
        {reportHistory && reportHistory.length > 0 && (
          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Histórico de Reportes Recentes
            </h4>
            <div className="space-y-1.5">
              {reportHistory.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-status-available" />
                    <span className="font-medium text-foreground">{rep.source}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">{rep.confirmedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações / Botões Principais */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
          {onReport && (
            <Button
              className="w-full sm:flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-sm"
              onClick={onReport}
            >
              <MessageSquare className="size-4 text-[#C09A5B]" />
              Confirmar Disponibilidade
            </Button>
          )}

          {!isDemo && real.lat !== undefined && real.lng !== undefined && (
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 rounded-xl border-border hover:border-[#C09A5B]/60 text-xs font-semibold gap-2"
              onClick={handleDirections}
            >
              <Navigation className="size-4 text-[#C09A5B]" />
              Traçar Rota no Mapa
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
