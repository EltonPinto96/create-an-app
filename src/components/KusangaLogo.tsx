import React from "react";

export interface KusangaLogoProps {
  variant?: "full" | "brand" | "symbol" | "compact" | "pill";
  theme?: "dark" | "light" | "auto";
  className?: string;
  size?: number | string;
  height?: number | string;
}

export function KusangaSymbol({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number | string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Símbolo Kusanga Kitadi"
    >
      <defs>
        <linearGradient id="symGold1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2CE" />
          <stop offset="25%" stopColor="#D8B168" />
          <stop offset="65%" stopColor="#C09A5B" />
          <stop offset="90%" stopColor="#9E7638" />
          <stop offset="100%" stopColor="#735220" />
        </linearGradient>

        <linearGradient id="symGold2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="40%" stopColor="#E2BE78" />
          <stop offset="80%" stopColor="#C09A5B" />
          <stop offset="100%" stopColor="#8B6328" />
        </linearGradient>

        <filter id="symFilter" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#15211B" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#symFilter)">
        {/* Haste Vertical Esquerda - Fita 1 */}
        <path
          d="M 40 32 C 34 32 30 36 30 42 L 30 110 C 30 135 48 152 74 152 C 78 152 82 148 82 144 L 82 134 C 82 130 78 126 74 126 C 58 126 48 116 48 100 L 48 42 C 48 36 44 32 40 32 Z"
          fill="url(#symGold1)"
        />
        {/* Haste Vertical Esquerda - Fita 2 */}
        <path
          d="M 68 32 C 62 32 58 36 58 42 L 58 120 C 58 126 62 130 68 130 C 74 130 78 126 78 120 L 78 42 C 78 36 74 32 68 32 Z"
          fill="url(#symGold2)"
        />
        {/* Trama Central / Diagonal Inferior Esquerda */}
        <path
          d="M 30 148 C 30 142 34 138 40 138 L 52 138 C 58 138 62 142 62 148 L 62 160 C 62 166 58 170 52 170 L 40 170 C 34 170 30 166 30 160 Z"
          fill="url(#symGold1)"
        />
        <path
          d="M 46 128 L 74 100 C 78 96 84 96 88 100 L 98 110 C 102 114 102 120 98 124 L 70 152 C 66 156 60 156 56 152 L 46 142 C 42 138 42 132 46 128 Z"
          fill="url(#symGold1)"
        />
        {/* Braço Diagonal Superior Direito */}
        <path
          d="M 86 96 L 140 42 C 146 36 156 36 162 42 L 170 50 C 176 56 176 66 170 72 L 118 124 C 114 128 108 128 104 124 L 86 106 C 82 102 82 98 86 96 Z"
          fill="url(#symGold2)"
        />
        {/* Braço Diagonal Superior Direito - Fita Interna */}
        <path
          d="M 112 36 C 106 36 102 40 102 46 L 102 54 C 102 58 104 62 108 64 L 144 100 C 148 104 154 104 158 100 L 166 92 C 170 88 170 82 166 78 L 126 38 C 122 36 117 36 112 36 Z"
          fill="url(#symGold1)"
        />
        {/* Perna Diagonal Inferior Direita */}
        <path
          d="M 98 110 L 150 162 C 156 168 166 168 172 162 L 178 154 C 184 148 184 138 178 132 L 126 80 C 122 76 116 76 112 80 L 98 94 C 94 98 94 106 98 110 Z"
          fill="url(#symGold1)"
        />
        {/* Perna Diagonal Inferior Direita - Fita Interna */}
        <path
          d="M 78 138 L 112 172 C 116 176 122 176 126 172 L 134 164 C 138 160 138 154 134 150 L 100 116 C 96 112 90 112 86 116 L 78 124 C 74 128 74 134 78 138 Z"
          fill="url(#symGold2)"
        />
        {/* Nó Central */}
        <path
          d="M 74 84 C 70 80 70 74 74 70 L 104 40 C 108 36 114 36 118 40 L 128 50 C 132 54 132 60 128 64 L 98 94 C 94 98 88 98 84 94 L 74 84 Z"
          fill="url(#symGold1)"
        />
      </g>
    </svg>
  );
}

export function KusangaSloganPill({
  className = "",
  dark = true,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 border border-[#C09A5B] shadow-xs text-xs ${
        dark
          ? "bg-[#1C2923] text-[#F7F4EC]"
          : "bg-[#EFE9DC] text-[#26362F]"
      } ${className}`}
    >
      <div className="flex items-center gap-1.5 text-[#C09A5B]">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M 12 2 C 7.58 2 4 5.58 4 10 C 4 15.25 12 22 12 22 C 12 22 20 15.25 20 10 C 20 5.58 16.42 2 12 2 Z" />
          <circle cx="12" cy="10" r="3" fill="#C09A5B" />
        </svg>
      </div>
      <div className="h-3 w-px bg-[#C09A5B]/40" />
      <span className="font-medium tracking-tight">A força está na ligação.</span>
      <span className="font-bold italic text-[#C09A5B] tracking-tight">Saiba onde levantar.</span>
    </div>
  );
}

export function KusangaLogo({
  variant = "brand",
  theme = "dark",
  className = "",
  size = 42,
}: KusangaLogoProps) {
  const isLight = theme === "light";

  if (variant === "symbol") {
    return <KusangaSymbol size={size} className={className} />;
  }

  if (variant === "pill") {
    return <KusangaSloganPill dark={!isLight} className={className} />;
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <KusangaSymbol size={typeof size === "number" ? size : 34} />
        <div className="leading-tight">
          <span
            className={`font-display text-lg font-bold tracking-tight ${
              isLight ? "text-[#26362F]" : "text-[#F7F4EC]"
            }`}
          >
            Kusanga
          </span>{" "}
          <span className="font-display text-lg font-extrabold tracking-tight text-[#C09A5B]">
            Kitadi
          </span>
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-start gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <KusangaSymbol size={typeof size === "number" ? size : 48} />
          <div className="h-9 w-0.5 bg-gradient-to-b from-[#FFF2CE] via-[#C09A5B] to-[#735220] rounded-full mx-0.5" />
          <div className="leading-none">
            <p
              className={`font-display text-2xl font-bold tracking-tight ${
                isLight ? "text-[#26362F]" : "text-[#F7F4EC]"
              }`}
            >
              Kusanga
            </p>
            <p className="font-display text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2CE] via-[#D8B168] to-[#C09A5B]">
              Kitadi
            </p>
          </div>
        </div>
        <KusangaSloganPill dark={!isLight} />
      </div>
    );
  }

  // Default "brand"
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <KusangaSymbol size={typeof size === "number" ? size : 42} />
      <div className="h-8 w-px bg-gradient-to-b from-[#FFF2CE] via-[#C09A5B] to-[#735220] rounded-full" />
      <div className="leading-none">
        <p
          className={`font-display text-xl font-bold tracking-tight ${
            isLight ? "text-[#26362F]" : "text-[#F7F4EC]"
          }`}
        >
          Kusanga
        </p>
        <p className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2CE] via-[#D8B168] to-[#C09A5B]">
          Kitadi
        </p>
      </div>
    </div>
  );
}
