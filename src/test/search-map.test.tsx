import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AtmCard } from "@/components/AtmCard";
import { SearchFiltersBar } from "@/components/SearchFiltersBar";
import { calculateDistanceKm } from "@/components/NearbyAtmsModal";
import type { RealAtm } from "@/components/AtmCard";

describe("Fase 4 — Mapa e Pesquisa Avançada", () => {
  const sampleAtm: RealAtm = {
    id: "test-atm-1",
    name: "BAI — Sede Torre Garden",
    bank: "BAI",
    area: "Maianga, Rua Major Kanhangulo 212",
    availability: "available",
    updated: "Confirmado hoje às 10:30",
    confirmations: 4,
    isReal: true,
    lat: -8.8149,
    lng: 13.2341,
    queueTime: "short",
    notesAvailable: "Notas de 5.000 Kz",
  };

  it("calcula distância haversine correctamente entre dois pontos em Luanda", () => {
    // Mutamba (-8.8145, 13.2301) para Belas Shopping (-8.9243, 13.1861)
    const dist = calculateDistanceKm(-8.8145, 13.2301, -8.9243, 13.1861);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(16);
  });

  it("renderiza a distância no AtmCard quando fornecida (< 1 km em metros)", () => {
    render(
      <AtmCard
        atm={sampleAtm}
        onClick={vi.fn()}
        distanceKm={0.65}
      />
    );

    expect(screen.getByText(/650 m de si/i)).toBeInTheDocument();
  });

  it("renderiza a distância no AtmCard quando fornecida (>= 1 km em km)", () => {
    render(
      <AtmCard
        atm={sampleAtm}
        onClick={vi.fn()}
        distanceKm={3.42}
      />
    );

    expect(screen.getByText(/3.4 km de si/i)).toBeInTheDocument();
  });

  it("renderiza a barra de filtros com campos de pesquisa, banco, município e bairro", () => {
    const setQuery = vi.fn();
    const setFilter = vi.fn();
    const setSelectedBank = vi.fn();
    const setSelectedMunicipality = vi.fn();
    const setSelectedNeighborhood = vi.fn();
    const setSortByDistance = vi.fn();

    render(
      <SearchFiltersBar
        query=""
        setQuery={setQuery}
        filter="all"
        setFilter={setFilter}
        selectedBank="all"
        setSelectedBank={setSelectedBank}
        bankOptions={["BAI", "BFA", "Banco Atlântico"]}
        selectedMunicipality="all"
        setSelectedMunicipality={setSelectedMunicipality}
        municipalityOptions={["Luanda", "Maianga", "Talatona", "Viana"]}
        selectedNeighborhood="all"
        setSelectedNeighborhood={setSelectedNeighborhood}
        neighborhoodOptions={["Alvalade", "Kinaxixi", "Maianga", "Mutamba"]}
        sortByDistance={false}
        setSortByDistance={setSortByDistance}
        hasUserLocation={true}
        resultCount={15}
        hasSupabase={true}
      />
    );

    expect(screen.getByPlaceholderText(/Banco, endereço ou bairro.../i)).toBeInTheDocument();
    expect(screen.getByText(/15 ATM encontrados/i)).toBeInTheDocument();
    expect(screen.getByText(/Ordenar por distância/i)).toBeInTheDocument();

    // Clicar no botão de ordenar por distância
    fireEvent.click(screen.getByText(/Ordenar por distância/i));
    expect(setSortByDistance).toHaveBeenCalledWith(true);
  });
});
