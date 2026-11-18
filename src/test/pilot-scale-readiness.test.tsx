import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Fase 8 — Prontidão do Piloto em Luanda (1.000 Utilizadores)", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("valida a existência e directivas da migração de índices de alta concorrência (008)", () => {
    const migrationPath = path.join(
      rootDir,
      "supabase",
      "migrations",
      "008_scale_indexes_pilot.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toMatch(/idx_atms_municipality_neighborhood/i);
    expect(sql).toMatch(/idx_reports_atm_created_desc/i);
    expect(sql).toMatch(/idx_reports_reporter_created_desc/i);
    expect(sql).toMatch(/idx_user_favorites_user_atm/i);
  });

  it("valida o script de teste de carga simulado para 1.000 cidadãos", () => {
    const scriptPath = path.join(rootDir, "scripts", "load-test-pilot.cjs");
    expect(fs.existsSync(scriptPath)).toBe(true);

    const script = fs.readFileSync(scriptPath, "utf-8");
    expect(script).toMatch(/TOTAL_OPERATIONS\s*=\s*1000/);
    expect(script).toMatch(/CONCURRENT_WORKERS/);
    expect(script).toMatch(/LUANDA_MUNICIPALITIES/);
    expect(script).toMatch(/Talatona/);
    expect(script).toMatch(/Kilamba Kiaxi/);
  });

  it("valida o manual operacional do piloto com 1.000 utilizadores em Luanda", () => {
    const docPath = path.join(rootDir, "docs", "PILOT_1000_LUANDA.md");
    expect(fs.existsSync(docPath)).toBe(true);

    const doc = fs.readFileSync(docPath, "utf-8");
    expect(doc).toMatch(/1\.000 Utilizadores/i);
    expect(doc).toMatch(/Coorte 1: Central/i);
    expect(doc).toMatch(/Coorte 2: Sul/i);
    expect(doc).toMatch(/Coorte 3: Central-Leste/i);
    expect(doc).toMatch(/Coorte 4: Expansão/i);
    expect(doc).toMatch(/Embaixadores de Bairro/i);
    expect(doc).toMatch(/5\.000 Kz/);
    expect(doc).toMatch(/2\.000 Kz/);
    expect(doc).toMatch(/1\.000 Kz/);
  });

  it("assegura que a lista de caixas aprovados do react-query possui tempo de cache compatível com tráfego intenso", () => {
    const queriesPath = path.join(rootDir, "src", "lib", "atm-queries.ts");
    expect(fs.existsSync(queriesPath)).toBe(true);

    const content = fs.readFileSync(queriesPath, "utf-8");
    // staleTime mínimo de 1 minuto para não saturar a base de dados sob 1.000 utilizadores
    expect(content).toMatch(/staleTime:\s*1000\s*\*\s*60/);
  });
});
