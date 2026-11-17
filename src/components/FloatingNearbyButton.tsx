import { Crosshair, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FloatingNearbyButtonProps {
  onClick: () => void;
  isLocating?: boolean;
  hasLocation?: boolean;
  errorMessage?: string | null;
  className?: string;
}

export function FloatingNearbyButton({
  onClick,
  isLocating = false,
  hasLocation = false,
  errorMessage = null,
  className = "",
}: FloatingNearbyButtonProps) {
  return (
    <aside
      aria-label="Ação rápida de localização"
      className={`fixed bottom-20 right-4 sm:bottom-20 sm:right-6 lg:bottom-8 lg:right-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}
    >
      <Button
        onClick={onClick}
        disabled={isLocating}
        type="button"
        className="group relative flex h-13 sm:h-14 items-center gap-3 rounded-full border-2 border-[#C09A5B]/50 bg-gradient-to-r from-[#26362F] via-[#2D4037] to-[#1C2923] px-4 sm:px-5 py-2 text-[#F7F4EC] shadow-xl hover:border-[#C09A5B] hover:shadow-2xl hover:shadow-[#C09A5B]/20 active:scale-95 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#C09A5B] focus-visible:ring-offset-2"
        title="Localizar caixas automáticos (ATM) mais próximos de si"
        aria-label={
          isLocating
            ? "A obter a sua localização atual..."
            : "Perto de mim — Ver caixas mais próximos"
        }
      >
        {/* Efeito estético de pulso discreto em repouso */}
        {!isLocating && (
          <span
            className="pointer-events-none absolute -inset-0.5 rounded-full bg-[#C09A5B]/15 animate-ping opacity-60 group-hover:opacity-100"
            aria-hidden="true"
          />
        )}

        {/* Ícone de localização com animação de estado */}
        <div className="relative flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full bg-[#C09A5B]/20 text-[#C09A5B] transition-transform duration-300 group-hover:rotate-45">
          {isLocating ? (
            <Loader2 className="size-4 sm:size-5 animate-spin text-[#C09A5B]" aria-hidden="true" />
          ) : errorMessage ? (
            <AlertCircle className="size-4 sm:size-5 text-amber-400" aria-hidden="true" />
          ) : hasLocation ? (
            <MapPin className="size-4 sm:size-5 text-[#C09A5B]" aria-hidden="true" />
          ) : (
            <Crosshair className="size-4 sm:size-5 text-[#C09A5B]" aria-hidden="true" />
          )}
        </div>

        {/* Texto do botão com estados funcionais */}
        <div className="flex flex-col text-left pr-1 select-none">
          <span className="font-display text-xs sm:text-sm font-bold tracking-tight text-[#F7F4EC] group-hover:text-[#FFF2CE] transition-colors">
            {isLocating
              ? "A localizar..."
              : errorMessage
              ? "Tentar novamente"
              : "Perto de mim"}
          </span>
          <span className="text-[10px] font-semibold text-[#C09A5B] leading-none">
            {isLocating
              ? "GPS Luanda"
              : hasLocation
              ? "Localização ativa"
              : "ATM próximos"}
          </span>
        </div>
      </Button>
    </aside>
  );
}
