import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Crosshair,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RealAtm } from "@/components/AtmCard";
import type { DemoAtm } from "@/lib/atm-demo-data";
import { openDirections } from "@/lib/google-maps";

type AtmItem = RealAtm | DemoAtm;

interface InteractiveMapProps {
  atms: AtmItem[];
  onSelectAtm: (atm: AtmItem) => void;
}

// Cálculo de distância haversine em km
function calculateDistanceKm(
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

export function InteractiveMap({ atms, onSelectAtm }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [selectedAtmInfo, setSelectedAtmInfo] = useState<AtmItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const bankOptions = useMemo(() => {
    const banks = Array.from(new Set(atms.map((a) => a.bank))).filter(Boolean);
    return ["all", ...banks];
  }, [atms]);

  // Filtra ATMs com coordenadas válidas
  const atmsWithCoords = useMemo(() => {
    return atms
      .map((atm, index) => {
        const real = atm as RealAtm;
        if (real.lat !== undefined && real.lng !== undefined) {
          return { ...atm, lat: real.lat, lng: real.lng };
        }
        const sampleCoords: Record<string, [number, number]> = {
          "sample-01": [-8.815, 13.23],
          "sample-02": [-8.838, 13.235],
          "sample-03": [-8.91, 13.19],
          "sample-04": [-8.84, 13.26],
        };
        const fallback =
          sampleCoords[atm.id] || [-8.82 + index * 0.02, 13.22 + index * 0.02];
        return { ...atm, lat: fallback[0], lng: fallback[1] };
      })
      .filter((atm) => activeFilter === "all" || atm.availability === activeFilter)
      .filter((atm) => selectedBank === "all" || atm.bank === selectedBank);
  }, [atms, activeFilter, selectedBank]);

  // Inicializa mapa Leaflet
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [-8.83833, 13.23444], // Luanda
        zoom: 13,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Adiciona controlo de zoom elegante
      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap — gratuito, sem API key
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      renderMarkers(L, map, markersLayer);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Atualiza marcadores quando a lista ou filtro muda
  useEffect(() => {
    if (typeof window === "undefined" || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapInstanceRef.current || !markersLayerRef.current) return;
      markersLayerRef.current.clearLayers();
      renderMarkers(L, mapInstanceRef.current, markersLayerRef.current);
    });
  }, [atmsWithCoords]);

  function renderMarkers(L: any, map: any, layer: any) {
    if (atmsWithCoords.length === 0) return;

    const bounds: [number, number][] = [];

    atmsWithCoords.forEach((atm) => {
      const lat = (atm as any).lat;
      const lng = (atm as any).lng;
      bounds.push([lat, lng]);

      let pinColor = "#2E7D32"; // Verde (available)
      let symbolLabel = "Kz";
      if (atm.availability === "no-cash") {
        pinColor = "#C62828"; // Vermelho
        symbolLabel = "✕";
      } else if (atm.availability === "out-of-service") {
        pinColor = "#546E7A"; // Cinzento fora de serviço
        symbolLabel = "!";
      } else if (atm.availability === "stale") {
        pinColor = "#D97706"; // Âmbar
        symbolLabel = "?";
      }

      // Marcador com coroa dourada do Kusanga Kitadi
      const customIcon = L.divIcon({
        className: "custom-atm-marker",
        html: `
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            filter: drop-shadow(0 4px 6px rgba(38, 54, 47, 0.45));
          ">
            <!-- Pin teardrop com anel em ouro artesanal -->
            <div style="
              position: absolute;
              width: 34px;
              height: 34px;
              background: ${pinColor};
              border: 2.5px solid #C09A5B;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: inset 0 2px 4px rgba(255,255,255,0.25);
            "></div>
            <!-- Símbolo / Texto central -->
            <span style="
              position: relative;
              z-index: 2;
              color: #FFFFFF;
              font-family: 'Sora', sans-serif;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: -0.5px;
            ">${symbolLabel}</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on("click", () => {
        setSelectedAtmInfo(atm);
      });

      marker.addTo(layer);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocating(false);

        import("leaflet").then((L) => {
          const map = mapInstanceRef.current;
          if (!map) return;

          map.setView([latitude, longitude], 15);

          const userIcon = L.divIcon({
            className: "user-loc-marker",
            html: `
              <div style="
                background-color: #C09A5B;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 3px solid #26362F;
                box-shadow: 0 0 0 6px rgba(192, 154, 91, 0.35);
              "></div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        });
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  // Distância do ATM selecionado em relação ao utilizador
  const distanceKm = useMemo(() => {
    if (!userLocation || !selectedAtmInfo) return null;
    const real = selectedAtmInfo as any;
    if (real.lat === undefined || real.lng === undefined) return null;
    return calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      real.lat,
      real.lng
    );
  }, [userLocation, selectedAtmInfo]);

  return (
    <div className="relative flex flex-col h-[650px] w-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Barra de Filtros no Topo do Mapa */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-background/95 p-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            Todos ({atms.length})
          </button>
          <button
            onClick={() => setActiveFilter("available")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              activeFilter === "available"
                ? "bg-status-available text-white shadow-xs"
                : "border border-border text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            Com Dinheiro
          </button>
          <button
            onClick={() => setActiveFilter("no-cash")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              activeFilter === "no-cash"
                ? "bg-status-empty text-white shadow-xs"
                : "border border-border text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            Sem Dinheiro
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Banco */}
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:border-[#C09A5B]"
            aria-label="Filtrar por banco no mapa"
          >
            <option value="all">Todos os Bancos</option>
            {bankOptions
              .filter((b) => b !== "all")
              .map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
          </select>

          {/* Botão de Localização */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-bold border-border hover:border-[#C09A5B]/60 text-foreground"
            onClick={handleLocateMe}
            disabled={locating}
          >
            <Crosshair
              className={`size-3.5 text-[#C09A5B] ${locating ? "animate-spin" : ""}`}
            />
            {locating ? "A localizar..." : "Onde estou"}
          </Button>
        </div>
      </div>

      {/* Contentor do Leaflet */}
      <div ref={mapContainerRef} className="relative flex-1 z-0 w-full h-full" />

      {/* Legenda Flutuante Discreta no Canto */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-[11px] font-semibold text-muted-foreground backdrop-blur-md shadow-sm">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-status-available" /> Com dinheiro
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-status-empty" /> Sem dinheiro
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-status-stale" /> Incerto
        </span>
      </div>

      {/* Card Flutuante de Detalhes do Marcador Selecionado */}
      {selectedAtmInfo && (
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-20 max-w-sm rounded-2xl border border-border bg-background p-4 shadow-xl backdrop-blur-lg animate-in fade-in-50 slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C09A5B]">
                {selectedAtmInfo.bank}
              </span>
              <h4 className="font-display font-bold text-sm text-foreground">
                {selectedAtmInfo.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedAtmInfo.area}
              </p>
            </div>
            <button
              onClick={() => setSelectedAtmInfo(null)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Fechar resumo"
            >
              ✕
            </button>
          </div>

          {/* Dois estados claros */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/60">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Numerário:
              </span>
              <span className="font-bold text-foreground">
                {selectedAtmInfo.availability === "available"
                  ? "Reportado com notas"
                  : selectedAtmInfo.availability === "no-cash"
                  ? "Sem notas"
                  : "Não confirmado"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Equipamento:
              </span>
              <span className="font-semibold text-foreground">
                {selectedAtmInfo.availability === "out-of-service"
                  ? "Fora de serviço"
                  : "Operacional"}
              </span>
            </div>
          </div>

          {/* Distância */}
          {distanceKm !== null && (
            <p className="mt-2 text-[11px] font-semibold text-[#C09A5B] flex items-center gap-1">
              <Navigation className="size-3" />
              A cerca de {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} de ti
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onSelectAtm(selectedAtmInfo)}
            >
              Ver Detalhes Completos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs rounded-lg border-border"
              onClick={() => {
                const real = selectedAtmInfo as any;
                if (real.lat && real.lng) openDirections(real.lat, real.lng);
              }}
            >
              <Navigation className="size-3 text-[#C09A5B]" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
