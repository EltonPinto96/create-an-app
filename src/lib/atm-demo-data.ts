export type DemoAvailability = "available" | "no-cash" | "out-of-service" | "stale" | "uncertain";

export type DemoAtm = {
  id: string;
  name: string;
  bank: string;
  area: string;
  availability: DemoAvailability;
  updated: string;
  confirmations: number;
};

// Fictional UI samples only; never use these records as ATM or availability data.
export const demoAtms: DemoAtm[] = [
  {
    id: "sample-01",
    name: "ATM de demonstração 01",
    bank: "Banco Exemplo",
    area: "Localização fictícia A · Luanda",
    availability: "available",
    updated: "Exemplo · há 12 min",
    confirmations: 8,
  },
  {
    id: "sample-02",
    name: "ATM de demonstração 02",
    bank: "Banco de Teste",
    area: "Localização fictícia B · Luanda",
    availability: "no-cash",
    updated: "Exemplo · há 24 min",
    confirmations: 3,
  },
  {
    id: "sample-03",
    name: "ATM de demonstração 03",
    bank: "Banco Exemplo",
    area: "Localização fictícia C · Luanda",
    availability: "out-of-service",
    updated: "Exemplo · há 41 min",
    confirmations: 2,
  },
  {
    id: "sample-04",
    name: "ATM de demonstração 04",
    bank: "Banco de Teste",
    area: "Localização fictícia D · Luanda",
    availability: "stale",
    updated: "Exemplo · há 1 h 18 min",
    confirmations: 1,
  },
];