import { useMemo, useState } from "react";
import {
  TrendingUp,
  Banknote,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Building2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AtmData } from "@/routes/index";

interface BankStatItem {
  bankName: string;
  total: number;
  available: number;
  noCash: number;
  outOfService: number;
  stale: number;
  percentageWithCash: number;
  operationalRate: number;
}

interface BankStatsProps {
  atms: AtmData[];
  onSelectBank?: (bankName: string) => void;
  selectedBank?: string;
}

export function BankStats({ atms, onSelectBank, selectedBank }: BankStatsProps) {
  const [sortBy, setSortBy] = useState<"percentage" | "total">("percentage");

  const bankStats: BankStatItem[] = useMemo(() => {
    const bankGroups = new Map<
      string,
      {
        total: number;
        available: number;
        noCash: number;
        outOfService: number;
        stale: number;
      }
    >();

    for (const atm of atms) {
      const bank = atm.bank || "Outro";
      const current = bankGroups.get(bank) || {
        total: 0,
        available: 0,
        noCash: 0,
        outOfService: 0,
        stale: 0,
      };

      current.total += 1;
      const status = atm.availability;
      if (status === "available") current.available += 1;
      else if (status === "no-cash") current.noCash += 1;
      else if (status === "out-of-service") current.outOfService += 1;
      else current.stale += 1;

      bankGroups.set(bank, current);
    }

    const items: BankStatItem[] = [];
    for (const [bankName, counts] of bankGroups.entries()) {
      const percentageWithCash =
        counts.total > 0
          ? Math.round((counts.available / counts.total) * 100)
          : 0;
      const operationalCount = counts.available + counts.noCash;
      const operationalRate =
        counts.total > 0
          ? Math.round((operationalCount / counts.total) * 100)
          : 0;

      items.push({
        bankName,
        total: counts.total,
        available: counts.available,
        noCash: counts.noCash,
        outOfService: counts.outOfService,
        stale: counts.stale,
        percentageWithCash,
        operationalRate,
      });
    }

    return items.sort((a, b) => {
      if (sortBy === "percentage") {
        return b.percentageWithCash - a.percentageWithCash || b.total - a.total;
      }
      return b.total - a.total || b.percentageWithCash - a.percentageWithCash;
    });
  }, [atms, sortBy]);

  // Médias globais da rede
  const totals = useMemo(() => {
    const totalAtms = atms.length;
    const withCash = atms.filter((a) => a.availability === "available").length;
    const rate = totalAtms > 0 ? Math.round((withCash / totalAtms) * 100) : 0;
    return { totalAtms, withCash, rate };
  }, [atms]);

  function getStatusColor(percent: number) {
    if (percent >= 60)
      return "text-status-available bg-status-available/10 border-status-available/25";
    if (percent >= 30)
      return "text-[#C09A5B] bg-[#C09A5B]/10 border-[#C09A5B]/30";
    return "text-status-empty bg-status-empty/10 border-status-empty/25";
  }

  function getBarColor(percent: number) {
    if (percent >= 60) return "bg-status-available";
    if (percent >= 30) return "bg-[#C09A5B]";
    return "bg-status-empty";
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="size-4 text-[#C09A5B]" />
            </span>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
              Disponibilidade por Banco (Últimas 24h)
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Percentagem de caixas automáticos com numerário confirmado pela comunidade em Luanda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg"
            onClick={() => setSortBy(sortBy === "percentage" ? "total" : "percentage")}
          >
            <ArrowUpDown className="size-3 text-[#C09A5B]" />
            {sortBy === "percentage" ? "Ordenar por Total" : "Ordenar por %"}
          </Button>
          <Badge
            variant="outline"
            className="text-[11px] font-bold border-[#C09A5B]/40 bg-[#C09A5B]/10 text-[#C09A5B] px-2.5 py-1 rounded-full"
          >
            Média da rede: {totals.rate}%
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bankStats.map((item) => {
          const isSelected =
            selectedBank &&
            selectedBank.toLowerCase() === item.bankName.toLowerCase();

          return (
            <div
              key={item.bankName}
              onClick={() => onSelectBank && onSelectBank(item.bankName)}
              className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-[#C09A5B] bg-[#C09A5B]/5 ring-1 ring-[#C09A5B] shadow-sm"
                  : "border-border/80 bg-background/80 hover:border-[#C09A5B]/50 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                    {item.bankName}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.total} {item.total === 1 ? "ATM monitorizado" : "ATMs monitorizados"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusColor(
                    item.percentageWithCash
                  )}`}
                >
                  {item.percentageWithCash}%
                </span>
              </div>

              {/* Barra de progresso visual */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                    item.percentageWithCash
                  )}`}
                  style={{ width: `${Math.max(item.percentageWithCash, 6)}%` }}
                />
              </div>

              {/* Detalhes de estado */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                <span className="inline-flex items-center gap-1 text-status-available font-semibold">
                  <CheckCircle2 className="size-3" /> {item.available} com dinheiro
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <XCircle className="size-3" /> {item.noCash + item.outOfService} sem notas
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/80 pt-3">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-[#C09A5B]" />
          Dica: Clica num banco para filtrar os caixas correspondentes.
        </span>
        {selectedBank && selectedBank !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2 text-[#C09A5B] font-semibold hover:bg-secondary/60"
            onClick={() => onSelectBank && onSelectBank("all")}
          >
            Limpar filtro
          </Button>
        )}
      </div>
    </div>
  );
}
