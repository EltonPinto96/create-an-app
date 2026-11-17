import { Banknote, ChevronRight, Clock3, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DemoAtm, type DemoAvailability } from "@/lib/atm-demo-data";
import { openInGoogleMaps, buildMapsUrl } from "@/lib/google-maps";

// ---- Tipos compatíveis com dados reais do Supabase ----
export type AtmAvailability = DemoAvailability | "pending";

export interface RealAtm {
  id: string;
  name: string;
  bank: string;
  /** ex: "Kicuxi · Luanda" */
  area: string;
  availability: AtmAvailability;
  /** Texto legível: "há 12 min", "há 1 h" */
  updated: string;
  confirmations: number;
  /** true = dado real do Supabase; false = dado de demonstração */
  isReal?: boolean;
  /** Coordenadas (apenas dados reais) */
  lat?: number;
  lng?: number;
  /** URL directa do Google Maps (se disponível no registo Supabase) */
  maps_url?: string;
  /** Tempo até expiração: "expira em 47 min" */
  expiresIn?: string;
}

type AtmCardData = DemoAtm | RealAtm;

function isDemoAtm(atm: AtmCardData): atm is DemoAtm {
  return !("isReal" in atm) || (atm as RealAtm).isReal === false || (atm as RealAtm).isReal === undefined;
}

const statusCopy: Record<AtmAvailability, { label: string; className: string }> = {
  available: { label: "Reportado com dinheiro", className: "status-available" },
  "no-cash": { label: "Reportado sem dinheiro", className: "status-empty" },
  "out-of-service": { label: "Fora de serviço", className: "status-offline" },
  stale: { label: "Informação desactualizada", className: "status-stale" },
  pending: { label: "Aguarda aprovação", className: "status-stale" },
};

interface AtmCardProps {
  atm: AtmCardData;
  onClick: () => void;
}

export function AtmCard({ atm, onClick }: AtmCardProps) {
  const status = statusCopy[atm.availability] ?? statusCopy.stale;
  const isDemo = isDemoAtm(atm);
  const real = atm as RealAtm;

  function handleMapsClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isDemo && real.lat !== undefined && real.lng !== undefined) {
      const url = real.maps_url ?? buildMapsUrl(real.lat, real.lng, atm.name);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button
      type="button"
      className="group flex w-full items-center gap-4 border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 sm:p-5"
      onClick={onClick}
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-md ${status.className}`}>
        <Banknote className="size-5" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        {/* Nome + badge */}
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{atm.name}</span>
          {isDemo ? (
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-[9px] font-medium uppercase text-muted-foreground">
              Exemplo
            </span>
          ) : (
            <Badge variant="outline" className="rounded-sm border-primary/30 px-1.5 py-0.5 text-[9px] font-medium uppercase text-primary">
              Verificado
            </Badge>
          )}
        </span>

        {/* Banco · Zona */}
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {atm.bank} · {atm.area}
        </span>

        {/* Estado + tempo */}
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={`font-medium ${status.className}`}>{status.label}</span>
          <span className="text-muted-foreground">{atm.updated}</span>
          {!isDemo && real.expiresIn && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock3 className="size-3" aria-hidden="true" />
              {real.expiresIn}
            </span>
          )}
        </span>
      </span>

      {/* Botão Google Maps (só dados reais) */}
      {!isDemo && real.lat !== undefined && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-primary"
          aria-label="Ver no Google Maps"
          title="Ver no Google Maps"
          onClick={handleMapsClick}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </Button>
      )}

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
