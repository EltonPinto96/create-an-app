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

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: FavoriteNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  favoriteAtms: AtmData[];
  onSimulateChange?: (atmId: string, newStatus: "available" | "no-cash" | "out-of-service" | "stale") => void;
  onSelectAtm?: (atm: AtmData) => void;
}

const statusMap: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  available: {
    label: "Com dinheiro",
    color: "text-status-available bg-status-available/10 border-status-available/20",
    icon: CheckCircle2,
  },
  "no-cash": {
    label: "Sem dinheiro",
    color: "text-status-empty bg-status-empty/10 border-status-empty/20",
    icon: AlertTriangle,
  },
  "out-of-service": {
    label: "Fora de serviço",
    color: "text-status-offline bg-status-offline/10 border-status-offline/20",
    icon: XCircle,
  },
  stale: {
    label: "Sem informação recente",
    color: "text-status-stale bg-status-stale/10 border-status-stale/20",
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-xs p-0 sm:items-center sm:p-5"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-modal-title"
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bell className="size-4" />
            </div>
            <div>
              <h2 id="notif-modal-title" className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                Notificações e Alertas
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {unreadCount} nova{unreadCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Atualizações em tempo real dos teus ATMs favoritos
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
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
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
              <span>{notifications.length} alerta{notifications.length === 1 ? "" : "s"} no histórico</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary gap-1 px-2"
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
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
                <Bell className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Sem alertas recentes</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Quando um dos teus caixas automáticos favoritos mudar de estado (ex: reabastecido com dinheiro), receberás aqui um alerta imediato.
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
                    className={`rounded-xl border p-3.5 transition-colors ${
                      item.read
                        ? "border-border/70 bg-card text-foreground"
                        : "border-primary/30 bg-primary/5 text-foreground shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border mt-0.5 ${newCfg.color}`}>
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{item.atmName}</p>
                          <p className="text-xs text-muted-foreground">{item.bank}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="line-through text-muted-foreground">{prevCfg.label}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className={`font-semibold px-2 py-0.5 rounded-full border text-[10px] ${newCfg.color}`}>
                              {newCfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Testar / Simular alteração num favorito */}
          {favoriteAtms.length > 0 && onSimulateChange && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-primary" />
                <h4 className="font-semibold text-xs text-foreground">
                  Testar Alerta em Tempo Real
                </h4>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Clica para simular uma mudança de disponibilidade num dos teus favoritos e ver o aviso em ação:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-semibold border-status-available/40 text-status-available hover:bg-status-available/10"
                  onClick={() => {
                    const atm = favoriteAtms[0];
                    if (atm) onSimulateChange(atm.id, "available");
                  }}
                >
                  Simular "Com dinheiro" no 1º favorito
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-semibold border-status-empty/40 text-status-empty hover:bg-status-empty/10"
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
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground text-center">
              💡 Marca ATMs como favoritos (ícone de coração) para receberes notificações automáticas quando houver dinheiro.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t border-border px-5 py-3 bg-muted/20 flex justify-end">
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </div>
      </section>
    </div>
  );
}
