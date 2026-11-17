import { useState, useMemo } from "react";
import {
  Banknote,
  Crosshair,
  ExternalLink,
  MapPin,
  Navigation,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RotateCw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AtmData } from "@/routes/index";
import { KusangaSymbol, KusangaSloganPill } from "@/components/KusangaLogo";
import { openDirections } from "@/lib/google-maps";
import { openWhatsAppShare } from "@/lib/whatsapp-share";

export interface NearbyAtmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
  isLocating: boolean;
  atms: AtmData[];
  onSelectAtm: (atm: AtmData) => void;
  onViewOnMap: (atm: AtmData) => void;
  onRequestLocation: () => void;
  onSetCustomCoords?: (coords: { lat: number; lng: number; label: string }) => void;
  locationLabel?: string;
}

// Cálculo da distância pela fórmula de Haversine em km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Pontos de referência rápidos em Luanda para testes e navegação prática
export const LUANDA_REFERENCE_POINTS = [
  { label: "Mutamba (Centro)", lat: -8.8145, lng: 13.2301 },
  { label: "Maianga", lat: -8.8315, lng: 13.2345 },
  { label: "Talatona (Belas)", lat: -8.9243, lng: 13.1861 },
  { label: "Alvalade", lat: -8.8385, lng: 13.2435 },
  { label: "Kilamba", lat: -8.995, lng: 13.255 },
];

export function NearbyAtmsModal({
  isOpen,
  onClose,
  userCoords,
  isLocating,
  atms,
  onSelectAtm,
  onViewOnMap,
  onRequestLocation,
  onSetCustomCoords,
  locationLabel,
}: NearbyAtmsModalProps) {
  const [filterMode, setFilterMode] = useState<"all" | "available" | "no-cash">("all");

  // Ordenar ATMs pela distância em relação à localização atual
  const atmsWithDistance = useMemo(() => {
    if (!userCoords) return [];

    return atms
      .filter((atm) => typeof (atm as any).lat === "number" && typeof (atm as any).lng === "number")
      .map((atm) => {
        const lat = (atm as any).lat as number;
        const lng = (atm as any).lng as number;
        const distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng);
        return {
          atm,
          distanceKm,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [atms, userCoords]);

  // Filtrar de acordo com a seleção
  const filteredList = useMemo(() => {
    if (filterMode === "available") {
      return atmsWithDistance.filter((item) => item.atm.availability === "available");
    }
    if (filterMode === "no-cash") {
      return atmsWithDistance.filter(
        (item) => item.atm.availability === "no-cash" || (item.atm.availability as any) === "empty"
      );
    }
    return atmsWithDistance;
  }, [atmsWithDistance, filterMode]);

  const availableCount = useMemo(() => {
    return atmsWithDistance.filter((item) => item.atm.availability === "available").length;
  }, [atmsWithDistance]);

  const noCashCount = useMemo(() => {
    return atmsWithDistance.filter(
      (item) => item.atm.availability === "no-cash" || (item.atm.availability as any) === "empty"
    ).length;
  }, [atmsWithDistance]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:items-center sm:p-4 animate-in fade-in-50"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-atms-title"
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#C09A5B]/30 bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="border-b border-border/80 bg-gradient-to-r from-[#26362F]/10 via-background to-[#C09A5B]/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <KusangaSymbol size={38} />
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="nearby-atms-title"
                    className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground"
                  >
                    ATMs Mais Próximos de Si
                  </h2>
                  <Badge className="bg-[#C09A5B] text-[#26362F] hover:bg-[#C09A5B]/90 font-bold text-[10px] px-2 py-0.5 border-none">
                    GPS Ativo
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculado pela sua posição com reporte de notas em tempo real
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:bg-secondary/70 shrink-0"
              aria-label="Fechar"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Barra de Posição Atual / Simulação */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/60 p-3 border border-border/70 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-[#C09A5B] shrink-0" />
              <span className="font-semibold text-foreground">
                {locationLabel || "Localização atual detectada"}
              </span>
              {userCoords && (
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-border/80 hover:border-[#C09A5B]/70"
                onClick={onRequestLocation}
                disabled={isLocating}
              >
                <RotateCw className={`size-3 text-[#C09A5B] ${isLocating ? "animate-spin" : ""}`} />
                {isLocating ? "A calibrar..." : "Atualizar GPS"}
              </Button>
            </div>
          </div>

          {/* Atalhos de Referência Rápida em Luanda */}
          {onSetCustomCoords && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <span className="text-muted-foreground shrink-0 font-medium">Pontos em Luanda:</span>
              {LUANDA_REFERENCE_POINTS.map((pt) => (
                <button
                  key={pt.label}
                  type="button"
                  onClick={() => onSetCustomCoords({ lat: pt.lat, lng: pt.lng, label: pt.label })}
                  className="shrink-0 rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-foreground hover:border-[#C09A5B] hover:text-[#C09A5B] transition-colors"
                >
                  {pt.label}
                </button>
              ))}
            </div>
          )}

          {/* Abas / Filtros Rápidos */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-[#26362F] text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({atmsWithDistance.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("available")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                filterMode === "available"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              <Banknote className="size-3" />
              Com Dinheiro ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("no-cash")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                filterMode === "no-cash"
                  ? "bg-red-700 text-white shadow-xs"
                  : "bg-red-500/10 text-red-800 dark:text-red-300 hover:bg-red-500/20"
              }`}
            >
              <XCircle className="size-3" />
              Sem Dinheiro ({noCashCount})
            </button>
          </div>
        </div>

        {/* Lista dos ATMs Mais Próximos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="mx-auto size-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <MapPin className="size-6 text-[#C09A5B]" />
              </div>
              <h3 className="font-display font-bold text-foreground text-sm">
                Nenhum ATM encontrado com este filtro
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Experimenta alterar o filtro para "Todos" ou seleciona outro ponto de referência.
              </p>
            </div>
          ) : (
            filteredList.slice(0, 15).map(({ atm, distanceKm }, idx) => {
              const isAvailable = atm.availability === "available";
              const isNoCash =
                atm.availability === "no-cash" || (atm.availability as any) === "empty";
              const isOutOfService = atm.availability === "out-of-service";
              const lat = (atm as any).lat;
              const lng = (atm as any).lng;

              return (
                <div
                  key={atm.id || idx}
                  className="group relative rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-[#C09A5B]/60 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Topo do Card: Banco e Distância */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#C09A5B]">
                          {atm.bank}
                        </span>

                        {/* Distância em destaque */}
                        <Badge
                          variant="secondary"
                          className="bg-[#26362F]/10 text-[#26362F] dark:bg-[#C09A5B]/20 dark:text-[#C09A5B] font-extrabold text-[11px] px-2 py-0.5 border border-[#C09A5B]/30"
                        >
                          📍 {formatDistance(distanceKm)} de si
                        </Badge>

                        {/* Posição no ranking */}
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Mais próximo
                          </span>
                        )}
                      </div>

                      {/* Nome do ATM */}
                      <h4 className="font-display text-sm sm:text-base font-bold text-foreground truncate">
                        {atm.name}
                      </h4>

                      {/* Bairro / Endereço */}
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground shrink-0" />
                        {atm.area}
                      </p>
                    </div>
                  </div>

                  {/* Estado das Notas & Equipamento */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border/60">
                    {/* Disponibilidade de Notas */}
                    <div className="flex items-center gap-2 text-xs">
                      {isAvailable ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-xl w-full">
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                          <span>Com Dinheiro</span>
                          <span className="text-[10px] font-normal text-muted-foreground ml-auto">
                            {atm.updated}
                          </span>
                        </div>
                      ) : isNoCash ? (
                        <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold bg-red-500/10 px-2.5 py-1 rounded-xl w-full">
                          <XCircle className="size-3.5 shrink-0 text-red-600" />
                          <span>Sem Dinheiro</span>
                          <span className="text-[10px] font-normal text-muted-foreground ml-auto">
                            {atm.updated}
                          </span>
                        </div>
                      ) : isOutOfService ? (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-xl w-full">
                          <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
                          <span>Fora de Serviço</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold bg-muted/60 px-2.5 py-1 rounded-xl w-full">
                          <HelpCircle className="size-3.5 shrink-0" />
                          <span>Sem reporte recente</span>
                        </div>
                      )}
                    </div>

                    {/* Estado do Equipamento */}
                    <div className="flex items-center gap-2 text-xs bg-muted/40 px-2.5 py-1 rounded-xl">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="font-medium text-foreground">Equipamento Operacional</span>
                      <ShieldCheck className="size-3 text-[#C09A5B] ml-auto shrink-0" />
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="mt-3 flex items-center justify-end gap-1.5 sm:gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs gap-1 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      title="Partilhar no WhatsApp"
                      onClick={() =>
                        openWhatsAppShare({
                          bank: atm.bank,
                          name: atm.name,
                          area: atm.area,
                          availability: atm.availability,
                          updated: atm.updated,
                          queueTime: (atm as any).queueTime,
                          notesAvailable: (atm as any).notesAvailable,
                          lat,
                          lng,
                        })
                      }
                    >
                      <svg className="size-3.5 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.916 2.8.916 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.584-5.769-5.773-5.769zm10.222 5.766c-.002 5.61-4.568 10.174-10.179 10.174-1.745 0-3.454-.45-4.966-1.305l-5.553 1.456 1.481-5.412c-.938-1.576-1.433-3.39-1.434-5.234.002-5.61 4.568-10.174 10.18-10.174 5.61 0 10.174 4.563 10.176 10.174z" />
                      </svg>
                    </Button>

                    {typeof lat === "number" && typeof lng === "number" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 border-border hover:border-[#C09A5B]/70"
                        onClick={() => openDirections(lat, lng)}
                      >
                        <Navigation className="size-3 text-[#C09A5B]" />
                        Traçar Rota
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-border hover:border-[#26362F]"
                      onClick={() => {
                        onClose();
                        onViewOnMap(atm);
                      }}
                    >
                      <MapPin className="size-3" />
                      Ver no Mapa
                    </Button>

                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1 bg-[#26362F] text-white hover:bg-[#26362F]/90 font-bold"
                      onClick={() => {
                        onClose();
                        onSelectAtm(atm);
                      }}
                    >
                      Detalhes
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Institucional */}
        <div className="border-t border-border/80 bg-muted/30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <KusangaSloganPill />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </section>
    </div>
  );
}
