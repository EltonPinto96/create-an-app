import { useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Banknote,
  MapPin,
  Navigation,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DemoAvailability } from "@/lib/atm-demo-data";

type Filter = "all" | DemoAvailability;

interface SearchFiltersBarProps {
  query: string;
  setQuery: (value: string) => void;
  filter: Filter;
  setFilter: (value: Filter) => void;
  selectedBank: string;
  setSelectedBank: (v: string) => void;
  bankOptions: string[];
  selectedMunicipality: string;
  setSelectedMunicipality: (v: string) => void;
  municipalityOptions: string[];
  selectedNeighborhood: string;
  setSelectedNeighborhood: (v: string) => void;
  neighborhoodOptions: string[];
  sortByDistance: boolean;
  setSortByDistance: (v: boolean) => void;
  hasUserLocation: boolean;
  onRequestLocation?: () => void;
  resultCount: number;
  hasSupabase: boolean;
}

// Chips de sugestão rápida — bairros e bancos mais populares
const QUICK_SUGGESTIONS = [
  { label: "BAI", type: "bank" as const },
  { label: "BFA", type: "bank" as const },
  { label: "Maianga", type: "area" as const },
  { label: "Talatona", type: "area" as const },
  { label: "Viana", type: "area" as const },
  { label: "Kilamba", type: "area" as const },
  { label: "Com dinheiro", type: "status" as const },
];

export function SearchFiltersBar({
  query,
  setQuery,
  filter,
  setFilter,
  selectedBank,
  setSelectedBank,
  bankOptions,
  selectedMunicipality,
  setSelectedMunicipality,
  municipalityOptions,
  selectedNeighborhood,
  setSelectedNeighborhood,
  neighborhoodOptions,
  sortByDistance,
  setSortByDistance,
  hasUserLocation,
  onRequestLocation,
  resultCount,
  hasSupabase,
}: SearchFiltersBarProps) {
  const hasActiveFilters = query || filter !== "all" || selectedBank !== "all" || selectedMunicipality !== "all" || selectedNeighborhood !== "all";

  function handleChipClick(chip: (typeof QUICK_SUGGESTIONS)[0]) {
    if (chip.type === "bank") {
      setSelectedBank(chip.label);
    } else if (chip.type === "area") {
      setQuery(chip.label);
    } else if (chip.type === "status") {
      setFilter("available");
    }
  }

  function clearAllFilters() {
    setQuery("");
    setFilter("all");
    setSelectedBank("all");
    setSelectedMunicipality("all");
    setSelectedNeighborhood("all");
  }

  return (
    <div className="space-y-3">
      {/* Linha principal de filtros */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Banco, endereço ou bairro..."
            className="h-11 rounded-xl pl-10 text-xs border-border bg-background focus:border-[#C09A5B]"
            aria-label="Pesquisar caixas automáticos"
          />
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs">
          <SlidersHorizontal className="size-4 text-[#C09A5B]" aria-hidden="true" />
          <span className="sr-only">Filtrar disponibilidade</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="h-full w-full bg-transparent text-xs font-semibold outline-none cursor-pointer">
            <option value="all">Todas as disponibilidades</option>
            <option value="available">Com notas disponíveis</option>
            <option value="no-cash">Sem notas</option>
            <option value="out-of-service">Fora de serviço</option>
            <option value="stale">Informação expirada</option>
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs">
          <Banknote className="size-4 text-[#C09A5B]" aria-hidden="true" />
          <span className="sr-only">Filtrar por banco</span>
          <select value={selectedBank} onChange={(event) => setSelectedBank(event.target.value)} className="h-full w-full bg-transparent text-xs font-semibold outline-none cursor-pointer">
            <option value="all">Todos os bancos</option>
            {bankOptions.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs">
          <MapPin className="size-4 text-[#C09A5B]" aria-hidden="true" />
          <span className="sr-only">Filtrar por município</span>
          <select value={selectedMunicipality} onChange={(event) => setSelectedMunicipality(event.target.value)} className="h-full w-full bg-transparent text-xs font-semibold outline-none cursor-pointer">
            <option value="all">Todos os municípios</option>
            {municipalityOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Linha secundária: Bairro + Ordenação */}
      <div className="flex flex-wrap items-center gap-2.5">
        {neighborhoodOptions.length > 0 && (
          <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs min-w-[160px]">
            <Building2 className="size-3.5 text-[#C09A5B]" aria-hidden="true" />
            <span className="sr-only">Filtrar por bairro</span>
            <select value={selectedNeighborhood} onChange={(event) => setSelectedNeighborhood(event.target.value)} className="h-full w-full bg-transparent text-xs font-semibold outline-none cursor-pointer">
              <option value="all">Todos os bairros</option>
              {neighborhoodOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}

        <Button
          variant={sortByDistance ? "default" : "outline"}
          size="sm"
          className={`h-9 gap-1.5 text-xs font-bold rounded-xl ${
            sortByDistance
              ? "bg-[#26362F] text-white hover:bg-[#26362F]/90"
              : "border-border hover:border-[#C09A5B]/60"
          }`}
          onClick={() => {
            if (!hasUserLocation && onRequestLocation) {
              onRequestLocation();
            }
            setSortByDistance(!sortByDistance);
          }}
          title={hasUserLocation ? "Ordenar ATMs pela distância" : "Activar GPS para ordenar por distância"}
        >
          <Navigation className={`size-3 ${sortByDistance ? "text-[#C09A5B]" : ""}`} />
          {sortByDistance ? "Mais próximos ✓" : "Ordenar por distância"}
        </Button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Chips de sugestão rápida */}
      {!query && filter === "all" && selectedBank === "all" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground mr-1">Sugestões:</span>
          {QUICK_SUGGESTIONS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-[#C09A5B] hover:text-[#C09A5B] transition-colors"
            >
              {chip.type === "status" ? "💰" : chip.type === "bank" ? "🏦" : "📍"} {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Contador de resultados */}
      <p className="text-xs text-muted-foreground">
        {resultCount} {resultCount === 1 ? (hasSupabase ? "ATM encontrado" : "exemplo encontrado") : (hasSupabase ? "ATM encontrados" : "exemplos encontrados")}
        {sortByDistance && hasUserLocation && " · Ordenados por proximidade"}
      </p>
    </div>
  );
}
