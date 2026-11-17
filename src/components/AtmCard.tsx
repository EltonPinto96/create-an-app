import {
  Banknote,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DemoAtm, type DemoAvailability } from "@/lib/atm-demo-data";
import { openInGoogleMaps, buildMapsUrl } from "@/lib/google-maps";

export type AtmAvailability = DemoAvailability | "pending";

export interface RealAtm {
  id: string;
  name: string;
  bank: string;
  area: string;
  availability: AtmAvailability;
  updated: string;
  confirmations: number;
  isReal?: boolean;
  lat?: number;
  lng?: number;
  maps_url?: string;
  expiresIn?: string;
  operationalStatus?: "operational" | "out-of-service";
}

type AtmCardData = DemoAtm | RealAtm;

function isDemoAtm(atm: AtmCardData): atm is DemoAtm {
  return (
    !("isReal" in atm) ||
    (atm as RealAtm).isReal === false ||
    (atm as RealAtm).isReal === undefined
  );
}

// Configuração de estado funcional
const statusMeta: Record<
  AtmAvailability,
  {
    cashLabel: string;
    opLabel: string;
    className: string;
    badgeClass: string;
    icon: typeof CheckCircle2;
  }
> = {
  available: {
    cashLabel: "Reportado com dinheiro",
    opLabel: "Operacional",
    className: "status-available",
    badgeClass: "text-status-available bg-status-available/10 border-status-available/30",
    icon: CheckCircle2,
  },
  "no-cash": {
    cashLabel: "Reportado sem notas",
    opLabel: "Operacional (sem dinheiro)",
    className: "status-empty",
    badgeClass: "text-status-empty bg-status-empty/10 border-status-empty/30",
    icon: AlertTriangle,
  },
  "out-of-service": {
    cashLabel: "Indisponível",
    opLabel: "Fora de serviço / Avaria",
    className: "status-offline",
    badgeClass: "text-status-offline bg-status-offline/10 border-status-offline/30",
    icon: XCircle,
  },
  stale: {
    cashLabel: "Sem informação recente",
    opLabel: "Estado incerto",
    className: "status-stale",
    badgeClass: "text-status-stale bg-status-stale/10 border-status-stale/30",
    icon: HelpCircle,
  },
  pending: {
    cashLabel: "A aguardar moderação",
    opLabel: "Em verificação",
    className: "status-stale",
    badgeClass: "text-status-stale bg-status-stale/10 border-status-stale/30",
    icon: Clock3,
  },
};

interface AtmCardProps {
  atm: AtmCardData;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export function AtmCard({
  atm,
  onClick,
  isFavorite,
  onToggleFavorite,
}: AtmCardProps) {
  const meta = statusMeta[atm.availability] ?? statusMeta.stale;
  const isDemo = isDemoAtm(atm);
  const real = atm as RealAtm;
  const StatusIcon = meta.icon;

  function handleMapsClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isDemo && real.lat !== undefined && real.lng !== undefined) {
      const url = real.maps_url ?? buildMapsUrl(real.lat, real.lng, atm.name);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function handleFavClick(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleFavorite?.(e);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex w-full flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 text-left transition-all duration-200 hover:border-[#C09A5B]/60 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div>
        {/* Topo do cartão: Banco + Verificação + Favorito */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C09A5B]">
              {atm.bank}
            </span>
            {isDemo ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                Exemplo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold text-primary">
                <ShieldCheck className="size-2.5 text-[#C09A5B]" />
                Validado
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:text-[#C09A5B] hover:bg-secondary/70 -mr-1 -mt-1"
            aria-label={isFavorite ? "Remover dos favoritos" : "Guardar nos favoritos"}
            onClick={handleFavClick}
          >
            <Heart
              className={`size-4 transition-transform duration-200 active:scale-125 ${
                isFavorite
                  ? "fill-[#C09A5B] text-[#C09A5B]"
                  : "text-muted-foreground hover:text-[#C09A5B]"
              }`}
            />
          </Button>
        </div>

        {/* Nome do ATM */}
        <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
          {atm.name}
        </h3>

        {/* Bairro e Localização */}
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
          {atm.area}
        </p>

        {/* Separador subtil */}
        <div className="my-3 border-t border-border/60" />

        {/* Estados separados: Numerário vs Operacional */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Disponibilidade de numerário */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-lg border ${meta.badgeClass}`}
            >
              <StatusIcon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] text-muted-foreground font-medium">
                Numerário
              </span>
              <span className="block truncate font-bold text-foreground">
                {meta.cashLabel}
              </span>
            </div>
          </div>

          {/* Estado operacional do equipamento */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-lg border ${
                atm.availability === "out-of-service"
                  ? "text-status-offline bg-status-offline/10 border-status-offline/30"
                  : "text-status-available bg-status-available/10 border-status-available/30"
              }`}
            >
              {atm.availability === "out-of-service" ? (
                <XCircle className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] text-muted-foreground font-medium">
                Equipamento
              </span>
              <span className="block truncate font-semibold text-foreground">
                {atm.availability === "out-of-service" ? "Fora de serviço" : "Operacional"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do cartão: Tempo de atualização e CTA */}
      <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock3 className="size-3 text-muted-foreground/80" />
          {atm.updated}
        </span>

        <div className="flex items-center gap-1.5 text-primary font-bold text-xs group-hover:text-[#C09A5B] transition-colors">
          <span>Ver detalhes</span>
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
