import { CircleHelp, Clock3, ExternalLink, Heart, Navigation, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DemoAtm } from "@/lib/atm-demo-data";
import { type RealAtm } from "@/components/AtmCard";
import { openDirections } from "@/lib/google-maps";

type AtmDetailsData = DemoAtm | RealAtm;

function isDemoAtm(atm: AtmDetailsData): atm is DemoAtm {
  return !("isReal" in atm) || (atm as RealAtm).isReal === false || (atm as RealAtm).isReal === undefined;
}

const statusLabel: Record<string, { label: string; className: string }> = {
  available: { label: "Reportado com dinheiro", className: "status-available" },
  "no-cash": { label: "Reportado sem dinheiro", className: "status-empty" },
  "out-of-service": { label: "Fora de serviço", className: "status-offline" },
  stale: { label: "Informação desactualizada", className: "status-stale" },
  pending: { label: "Aguarda aprovação", className: "status-stale" },
};

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

function DemoNotice() {
  return (
    <div className="flex items-start gap-3 border border-status-stale/20 bg-status-stale/10 px-4 py-3.5">
      <CircleHelp className="mt-0.5 size-4 shrink-0 text-status-stale" aria-hidden="true" />
      <p className="text-xs leading-5 text-foreground/80">
        <strong className="font-semibold">Dados de demonstração.</strong> ATM, locais e reportes abaixo são
        fictícios e não indicam disponibilidade real.
      </p>
    </div>
  );
}

export function AtmDetails({ atm, onClose, onAccount, onReport, reportHistory }: AtmDetailsProps) {
  const isDemo = isDemoAtm(atm);
  const real = atm as RealAtm;
  const status = statusLabel[atm.availability] ?? statusLabel.stale;

  const mapsUrl = !isDemo
    ? (real.maps_url ?? (real.lat !== undefined ? `https://maps.google.com/maps?q=${real.lat},${real.lng}` : undefined))
    : undefined;

  function handleDirections() {
    if (!isDemo && real.lat !== undefined && real.lng !== undefined) {
      openDirections(real.lat, real.lng);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 sm:items-center sm:p-5"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="atm-detail-title"
        className="w-full max-w-lg border border-border bg-background p-5 shadow-xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {isDemo ? (
                <Badge variant="outline" className="rounded-sm">Amostra fictícia</Badge>
              ) : (
                <Badge variant="outline" className="rounded-sm border-primary/30 text-primary">Reporte real</Badge>
              )}
              {!isDemo && real.expiresIn && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="size-3" aria-hidden="true" />
                  {real.expiresIn}
                </span>
              )}
            </div>
            <h2 id="atm-detail-title" className="font-display text-2xl font-semibold">
              {atm.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{atm.bank}</p>
          </div>
          <div className="flex items-center gap-1 -mr-2 -mt-2">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-red-500"
                aria-label={isFavorite ? "Remover dos favoritos" : "Guardar nos favoritos"}
                title={isFavorite ? "Remover dos favoritos" : "Guardar nos favoritos"}
                onClick={onToggleFavorite}
              >
                <Heart className={`size-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-9" aria-label="Fechar detalhes" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {isDemo && <DemoNotice />}

        {/* Dados principais */}
        <dl className="my-5 divide-y divide-border border-y border-border text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Localização</dt>
            <dd className="text-right">{atm.area}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">{isDemo ? "Estado do exemplo" : "Estado actual"}</dt>
            <dd className={`text-right font-medium ${status.className}`}>{status.label}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">{isDemo ? "Última confirmação fictícia" : "Última confirmação"}</dt>
            <dd className="text-right">{atm.updated}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">{isDemo ? "Confirmações de exemplo" : "Confirmações"}</dt>
            <dd className="text-right">{atm.confirmations}</dd>
          </div>
          {!isDemo && real.expiresIn && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Reporte expira</dt>
              <dd className="text-right text-status-stale">{real.expiresIn}</dd>
            </div>
          )}
        </dl>

        {/* Histórico de reportes (dados reais) */}
        {!isDemo && reportHistory && reportHistory.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico de reportes
            </p>
            <ul className="divide-y divide-border border border-border">
              {reportHistory.slice(0, 3).map((r) => {
                const st = statusLabel[r.availability] ?? statusLabel.stale;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                    <span className={`font-medium ${st.className}`}>{st.label}</span>
                    <span className="text-muted-foreground">{r.source}</span>
                    <span className="text-muted-foreground">{r.confirmedAt}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Bloco de Confirmação e Avaliação Comunitária */}
        <div className="mb-4 rounded-lg border border-primary/25 bg-primary/5 p-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Estiveste ou estás neste ATM?
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ajuda os próximos cidadãos confirmando se conseguiste levantar.
              </p>
            </div>
            {onReport && (
              <Button
                size="sm"
                className="shrink-0 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={onReport}
              >
                Deixar avaliação
              </Button>
            )}
          </div>
        </div>

        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {isDemo
            ? "As confirmações comunitárias não garantem dinheiro disponível. Estes dados são exclusivamente ilustrativos."
            : "Os reportes comunitários não garantem disponibilidade. Verifique sempre antes de se deslocar."}
        </p>

        {/* Acções */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Ver no Google Maps */}
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Ver no Google Maps
            </a>
          ) : null}

          {/* Como chegar */}
          {!isDemo && real.lat !== undefined && (
            <Button variant="outline" className="flex-1 rounded-md" onClick={handleDirections}>
              <Navigation className="size-4" aria-hidden="true" />
              Como chegar
            </Button>
          )}

          {/* Reportar */}
          {onReport && (
            <Button variant="secondary" className="flex-1 rounded-md" onClick={onReport}>
              Avaliar
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
