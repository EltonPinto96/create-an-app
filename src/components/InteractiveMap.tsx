import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  Crosshair,
  ExternalLink,
  Info,
  Layers,
  MapPin,
  Navigation,
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

export function InteractiveMap({ atms, onSelectAtm }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedAtmInfo, setSelectedAtmInfo] = useState<AtmItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Filtra ATMs com coordenadas válidas
  const atmsWithCoords = atms
    .map((atm, index) => {
      // Se for real e tiver coordenadas
      const real = atm as RealAtm;
      if (real.lat !== undefined && real.lng !== undefined) {
        return { ...atm, lat: real.lat, lng: real.lng };
      }
      // Se for demo, atribuir coordenadas fictícias em Luanda para demonstração visual
      const sampleCoords: Record<string, [number, number]> = {
        "sample-01": [-8.815, 13.23], // Baixa / Mutamba
        "sample-02": [-8.838, 13.235], // Maianga
        "sample-03": [-8.91, 13.19], // Talatona
        "sample-04": [-8.84, 13.26], // Alvalade
      };
      const fallback = sampleCoords[atm.id] || [-8.82 + index * 0.02, 13.22 + index * 0.02];
      return { ...atm, lat: fallback[0], lng: fallback[1] };
    })
    .filter((atm) => activeFilter === "all" || atm.availability === activeFilter);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Carregamento dinâmico do Leaflet no browser
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Se já existe instância, limpa
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Centro padrão: Luanda (-8.83833, 13.23444)
      const map = L.map(mapContainerRef.current, {
        center: [-8.87, 13.28],
        zoom: 12,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Adiciona controlo de zoom no canto superior direito
      L.control.zoom({ position: "topright" }).addTo(map);

      // Camada de mapa OpenStreetMap amigável e limpa
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Camada para os marcadores
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
  }, [atms, activeFilter]);

  function renderMarkers(L: any, map: any, layer: any) {
    if (atmsWithCoords.length === 0) return;

    const bounds: [number, number][] = [];

    atmsWithCoords.forEach((atm) => {
      const lat = atm.lat;
      const lng = atm.lng;
      bounds.push([lat, lng]);

      // Cor do marcador baseada na disponibilidade
      let pinColor = "#10b981"; // Verde (available)
      let pinText = "Dinheiro";
      if (atm.availability === "no-cash") {
        pinColor = "#ef4444"; // Vermelho
        pinText = "Vazio";
      } else if (atm.availability === "out-of-service") {
        pinColor = "#f59e0b"; // Laranja/Amarelo
        pinText = "Avaria";
      } else if (atm.availability === "stale") {
        pinColor = "#6b7280"; // Cinzento
        pinText = "Sem dados";
      }

      // Ícone customizado HTML moderno
      const customIcon = L.divIcon({
        className: "custom-atm-marker",
        html: `
          <div style="
            background-color: ${pinColor};
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-size: 13px;
              font-weight: bold;
            ">🏦</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on("click", () => {
        setSelectedAtmInfo(atm);
      });

      marker.addTo(layer);
    });

    // Ajusta a vista para caber todos os marcadores
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

          // Marcador do utilizador (ponto azul pulsante)
          const userIcon = L.divIcon({
            className: "user-loc-marker",
            html: `
              <div style="
                background-color: #3b82f6;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35);
              "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("Estás aqui!")
            .openPopup();
        });
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className="relative flex flex-col h-[650px] w-full rounded-xl overflow-hidden border border-border bg-card shadow-sm">
      {/* Barra de Filtros e Legenda flutuante sobre o mapa */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 rounded-lg bg-background/95 p-1.5 shadow-md backdrop-blur border border-border text-xs max-w-[calc(100%-60px)]">
        <button
          onClick={() => setActiveFilter("all")}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Todos ({atms.length})
        </button>
        <button
          onClick={() => setActiveFilter("available")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "available"
              ? "bg-status-available text-white"
              : "text-status-available hover:bg-status-available/10"
          }`}
        >
          <span className="size-2 rounded-full bg-status-available" />
          Com dinheiro
        </button>
        <button
          onClick={() => setActiveFilter("no-cash")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "no-cash"
              ? "bg-status-empty text-white"
              : "text-status-empty hover:bg-status-empty/10"
          }`}
        >
          <span className="size-2 rounded-full bg-status-empty" />
          Sem dinheiro
        </button>
        <button
          onClick={() => setActiveFilter("out-of-service")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "out-of-service"
              ? "bg-status-offline text-white"
              : "text-status-offline hover:bg-status-offline/10"
          }`}
        >
          <span className="size-2 rounded-full bg-status-offline" />
          Avaria
        </button>
      </div>

      {/* Botão de Localização do Utilizador */}
      <div className="absolute bottom-6 right-3 z-[1000]">
        <Button
          size="sm"
          variant="secondary"
          className="shadow-lg border border-border bg-background hover:bg-secondary text-foreground text-xs gap-1.5"
          onClick={handleLocateMe}
          disabled={locating}
        >
          <Crosshair className={`size-3.5 ${locating ? "animate-spin text-primary" : "text-primary"}`} />
          {locating ? "A localizar..." : "Onde estou"}
        </Button>
      </div>

      {/* Container do Leaflet */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Cartão de Detalhes Flutuante do ATM Selecionado */}
      {selectedAtmInfo && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[1000] rounded-xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">
                  {selectedAtmInfo.name}
                </span>
                {"isReal" in selectedAtmInfo && selectedAtmInfo.isReal ? (
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                    Verificado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Exemplo</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedAtmInfo.bank} · {selectedAtmInfo.area}
              </p>
            </div>
            <button
              onClick={() => setSelectedAtmInfo(null)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
            <span
              className={`font-medium ${
                selectedAtmInfo.availability === "available"
                  ? "text-status-available font-semibold"
                  : selectedAtmInfo.availability === "no-cash"
                  ? "text-status-empty font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {selectedAtmInfo.availability === "available"
                ? "🟢 Com dinheiro"
                : selectedAtmInfo.availability === "no-cash"
                ? "🔴 Sem dinheiro"
                : "⚠️ Fora de serviço"}
            </span>

            <div className="flex items-center gap-2">
              {"lat" in selectedAtmInfo && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => openDirections((selectedAtmInfo as any).lat, (selectedAtmInfo as any).lng)}
                >
                  <Navigation className="size-3 text-primary" />
                  Como chegar
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
                onClick={() => {
                  onSelectAtm(selectedAtmInfo);
                  setSelectedAtmInfo(null);
                }}
              >
                Ver Detalhes / Avaliar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
