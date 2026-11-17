import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  CheckCheck,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FavoriteNotification } from "@/lib/use-favorite-notifications";
import type { AtmData } from "@/routes/index";
import { KusangaSymbol } from "@/components/KusangaLogo";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: FavoriteNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  favoriteAtms: AtmData[];
  onSimulateChange?: (
    atmId: string,
    newStatus: "available" | "no-cash" | "out-of-service" | "stale"
  ) => void;
  onSelectAtm?: (atm: AtmData) => void;
}

const statusMap: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  available: {
    label: "Com dinheiro",
    color: "text-status-available bg-status-available/10 border-status-available/30",
    icon: CheckCircle2,
  },
  "no-cash": {
    label: "Sem notas",
    color: "text-status-empty bg-status-empty/10 border-status-empty/30",
    icon: AlertTriangle,
  },
  "out-of-service": {
    label: "Fora de serviço",
    color: "text-status-offline bg-status-offline/10 border-status-offline/30",
    icon: XCircle,
  },
  stale: {
    label: "Sem informação recente",
    color: "text-status-stale bg-status-stale/10 border-status-stale/30",
    icon: Clock,
  },
};

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  favoriteAtms,
  onSimulateChange,
  onSelectAtm,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-xs p-0 sm:items-center sm:p-5 animate-in fade-in-50"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-modal-title"
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <KusangaSymbol size={36} />
            <div>
              <h2
                id="notif-modal-title"
                className="font-display text-base font-bold text-foreground flex items-center gap-2"
              >
                Notificações & Alertas
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 px-2 text-[10px] font-bold rounded-full"
                  >
                    {unreadCount} nova{unreadCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Atualizações em tempo real dos teus caixas favoritos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:bg-secondary/70"
            aria-label="Fechar modal"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Ações rápidas */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/70">
              <span>
                {notifications.length} alerta{notifications.length === 1 ? "" : "s"} registado{notifications.length === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#C09A5B] font-bold gap-1 px-2 hover:bg-secondary/60"
                    onClick={onMarkAllAsRead}
                  >
                    <CheckCheck className="size-3.5" />
                    Marcar lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1 px-2"
                  onClick={onClearAll}
                >
                  <Trash2 className="size-3.5" />
                  Limpar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Notificações */}
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
                <Bell className="size-5 text-[#C09A5B]" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Sem alertas no momento
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                Quando um dos teus caixas favoritos for abastecido com dinheiro ou reportado sem notas, receberás um aviso aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((item) => {
                const newCfg = statusMap[item.newStatus] || statusMap.stale;
                const prevCfg = statusMap[item.previousStatus] || statusMap.stale;
                const Icon = newCfg.icon;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3.5 transition-colors ${
                      item.read
                        ? "border-border/70 bg-card text-foreground"
                        : "border-[#C09A5B]/40 bg-[#C09A5B]/5 text-foreground shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${newCfg.color}`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm truncate">
                            {item.atmName}
                          </p>
                          <p className="text-xs text-muted-foreground font-semibold text-[#C09A5B]">
                            {item.bank}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="line-through text-muted-foreground">
                              {prevCfg.label}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${newCfg.color}`}
                            >
                              {newCfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Testar / Simular alteração num favorito */}
          {favoriteAtms.length > 0 && onSimulateChange && (
            <div className="rounded-2xl border border-[#C09A5B]/30 bg-[#C09A5B]/5 p-4 mt-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="size-4 text-[#C09A5B]" />
                <h4 className="font-display font-bold text-xs text-foreground">
                  Testar Alerta em Tempo Real
                </h4>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Clica para simular uma mudança de disponibilidade e comprovar o funcionamento dos alertas:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-bold rounded-lg border-status-available/40 text-status-available hover:bg-status-available/10"
                  onClick={() => {
                    const atm = favoriteAtms[0];
                    if (atm) onSimulateChange(atm.id, "available");
                  }}
                >
                  Simular "Com dinheiro"
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-bold rounded-lg border-status-empty/40 text-status-empty hover:bg-status-empty/10"
                  onClick={() => {
                    const atm = favoriteAtms[0];
                    if (atm) onSimulateChange(atm.id, "no-cash");
                  }}
                >
                  Simular "Sem dinheiro"
                </Button>
              </div>
            </div>
          )}

          {favoriteAtms.length === 0 && (
            <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground text-center">
              💡 Marca caixas como favoritos (ícone de coração) para receberes notificações automáticas quando houver dinheiro.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground italic">
            A força está na ligação.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="text-xs font-semibold rounded-lg"
          >
            Fechar
          </Button>
        </div>
      </section>
    </div>
  );
}
