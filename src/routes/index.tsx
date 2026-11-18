import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Crosshair,
  Heart,
  House,
  Map,
  MapPin,
  Menu,
  Navigation,
  PlusCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  LogIn,
  LogOut,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import atmPhoto from "@/assets/atm-kota-demo.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoAtms, type DemoAtm, type DemoAvailability } from "@/lib/atm-demo-data";
import { REAL_ATMS_LUANDA } from "@/lib/real-atms-luanda";
import { AtmCard, type RealAtm } from "@/components/AtmCard";
import { AtmDetails } from "@/components/AtmDetails";
import { SubmitAtmForm, type SubmitAtmFormData } from "@/components/SubmitAtmForm";
import { SubmitReportForm, type SubmitReportFormData } from "@/components/SubmitReportForm";
import { useApprovedAtms, useUserReports } from "@/lib/atm-queries";
import { supabase, hasSupabase } from "@/lib/supabase";
import { AdminPanel } from "@/components/AdminPanel";
import { InteractiveMap } from "@/components/InteractiveMap";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { AuthGatePortal } from "@/components/AuthGatePortal";
import { useFavorites } from "@/lib/use-favorites";
import { BankStats } from "@/components/BankStats";
import { useFavoriteNotifications } from "@/lib/use-favorite-notifications";
import { NotificationsModal } from "@/components/NotificationsModal";
import { KusangaLogo, KusangaSymbol, KusangaSloganPill } from "@/components/KusangaLogo";
import { NearbyAtmsModal, calculateDistanceKm } from "@/components/NearbyAtmsModal";
import { FloatingNearbyButton } from "@/components/FloatingNearbyButton";
import { SearchFiltersBar } from "@/components/SearchFiltersBar";

type Section = "home" | "map" | "search" | "favorites" | "profile" | "admin";
type Filter = "all" | DemoAvailability;
export type AtmData = DemoAtm | RealAtm;


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KUSANGA KITADI — A força está na ligação. Saiba onde levantar." },
      {
        name: "description",
        content:
          "A força está na ligação. Saiba onde levantar. Encontra caixas automáticos (ATM) e consulta reportes comunitários de disponibilidade em tempo real em Luanda.",
      },
      { property: "og:title", content: "KUSANGA KITADI — A força está na ligação" },
      {
        property: "og:description",
        content:
          "A força está na ligação. Saiba onde levantar. Consulte a disponibilidade comunitária de ATM em Angola.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navigation: { id: Section; label: string; icon: typeof House }[] = [
  { id: "home", label: "Início", icon: House },
  { id: "map", label: "Mapa", icon: Map },
  { id: "search", label: "Pesquisar", icon: Search },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "profile", label: "Perfil", icon: UserRound },
];

const statusCopy: Record<DemoAvailability, { label: string; className: string }> = {
  available: { label: "Reportado com dinheiro", className: "status-available" },
  "no-cash": { label: "Reportado sem dinheiro", className: "status-empty" },
  "out-of-service": { label: "Fora de serviço", className: "status-offline" },
  stale: { label: "Informação desactualizada", className: "status-stale" },
};

function Index() {
  const { user, profile, isAdmin, isModerator, canModerate, loading } = useAuth();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [section, setSection] = useState<Section>("home");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("all");
  const [sortByDistance, setSortByDistance] = useState<boolean>(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [selectedAtm, setSelectedAtm] = useState<AtmData | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showSubmitAtm, setShowSubmitAtm] = useState(false);
  const [reportingAtm, setReportingAtm] = useState<RealAtm | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [authRequiredReason, setAuthRequiredReason] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showNearbyModal, setShowNearbyModal] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>("Localização GPS");
  const [customOverrides, setCustomOverrides] = useState<Record<string, Partial<RealAtm>>>({});
  const [devBypass, setDevBypass] = useState(false);

  function openAuth(mode: "login" | "register" = "login", reason?: string | null) {
    setAuthModalMode(mode);
    setAuthRequiredReason(reason || null);
    setShowAuthModal(true);
  }

  function handleInitiateReport(atm: RealAtm) {
    if (!user) {
      openAuth(
        "login",
        "O login com a tua conta Google é obrigatório para reportar notas e garantir a autenticidade dos dados comunitários."
      );
      return;
    }

    // Proteção de confiança: Rate limit de 5 minutos por utilizador no mesmo ATM
    const lastReportKey = `kusanga_rate_limit_${atm.id}_${user.id}`;
    const lastReportTimestamp = localStorage.getItem(lastReportKey);
    if (lastReportTimestamp) {
      const diffMs = Date.now() - parseInt(lastReportTimestamp, 10);
      const remainingMin = Math.ceil((5 * 60 * 1000 - diffMs) / 60000);
      if (remainingMin > 0) {
        toast.info("⏳ Reporte recente registado", {
          description: `Já confirmaste este caixa recentemente. Para garantir a fiabilidade dos dados, aguarda cerca de ${remainingMin} min para novo reporte.`,
          duration: 4500,
        });
        return;
      }
    }

    setReportingAtm(atm);
  }

  function handleInitiateSubmitAtm() {
    if (!user) {
      openAuth(
        "login",
        "Inicia sessão com a tua conta Google para sugerir a inclusão de um novo caixa na rede."
      );
      return;
    }
    setShowSubmitAtm(true);
  }

  const { data: dbAtms } = useApprovedAtms({ enabled: !!user || devBypass });

  const atmList: AtmData[] = useMemo(() => {
    const dbMapped: RealAtm[] = (dbAtms ?? []).map((item) => {
      const avail = (item.latest_report?.availability ?? "stale") as RealAtm["availability"];
      const expiresAt = item.latest_report?.expires_at ? new Date(item.latest_report.expires_at) : null;
      let expiresIn: string | undefined;
      if (expiresAt) {
        const diffMs = expiresAt.getTime() - Date.now();
        const diffMin = Math.round(diffMs / 60000);
        expiresIn = diffMin > 0 ? `Expira em ${diffMin} min` : "Expirado";
      }

      return {
        id: item.id,
        name: item.name,
        bank: item.bank?.name ?? "Banco",
        area: `${item.neighborhood ? item.neighborhood + ", " : ""}${item.address}`,
        availability: avail,
        updated: item.latest_report?.confirmed_at
          ? `Confirmado hoje às ${new Date(item.latest_report.confirmed_at).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}`
          : "Sem reportes recentes",
        confirmations: item.latest_report ? 1 : 0,
        isReal: true,
        lat: item.lat,
        lng: item.lng,
        maps_url: item.maps_url ?? undefined,
        expiresIn,
      };
    });

    // Combinar com os 22 ATMs reais de Luanda (evita duplicados pelo nome)
    const dbNames = new Set(dbMapped.map((a) => a.name.toLowerCase()));
    const remainingReal = REAL_ATMS_LUANDA.filter(
      (real) => !dbNames.has(real.name.toLowerCase())
    );

    const merged = [...dbMapped, ...remainingReal];
    return merged.map((atm) => {
      const override = customOverrides[atm.id];
      if (!override) return atm;
      return { ...atm, ...override } as AtmData;
    });
  }, [dbAtms, customOverrides]);

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    simulateStatusChange,
  } = useFavoriteNotifications(favoriteIds, atmList);

  const bankOptions = useMemo(() => {
    const banks = Array.from(new Set(atmList.map((a) => a.bank))).filter(Boolean);
    return banks.sort();
  }, [atmList]);

  const municipalityOptions = useMemo(() => {
    const set = new Set<string>();
    const knownMunicipalities = [
      "Belas",
      "Cacuaco",
      "Cazenga",
      "Icolo e Bengo",
      "Kilamba Kiaxi",
      "Luanda",
      "Maianga",
      "Quiçama",
      "Talatona",
      "Viana",
    ];
    knownMunicipalities.forEach((m) => set.add(m));
    atmList.forEach((atm) => {
      if (atm.area) {
        const parts = atm.area.split(",");
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i]?.trim();
          if (
            p &&
            p.length > 2 &&
            !p.toLowerCase().includes("via") &&
            !p.toLowerCase().includes("estrada") &&
            !p.toLowerCase().includes("piso")
          ) {
            set.add(p);
          }
        }
      }
    });
    return Array.from(set).sort();
  }, [atmList]);

  const neighborhoodOptions = useMemo(() => {
    const set = new Set<string>();
    atmList.forEach((atm) => {
      if (atm.area) {
        const parts = atm.area.split(",");
        const n = parts[0]?.trim();
        if (n && n.length > 1) {
          set.add(n);
        }
      }
    });
    return Array.from(set).sort();
  }, [atmList]);

  const visibleAtms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-AO");
    const filtered = atmList.filter((atm) => {
      const matchesText = `${atm.name} ${atm.bank} ${atm.area}`
        .toLocaleLowerCase("pt-AO")
        .includes(needle);
      const avail = atm.availability as string;
      const matchesAvail = filter === "all" || avail === filter;
      const matchesBank =
        selectedBank === "all" ||
        atm.bank.toLowerCase().includes(selectedBank.toLowerCase());
      const matchesMunicipality =
        selectedMunicipality === "all" ||
        atm.area.toLowerCase().includes(selectedMunicipality.toLowerCase());
      const matchesNeighborhood =
        selectedNeighborhood === "all" ||
        atm.area.toLowerCase().includes(selectedNeighborhood.toLowerCase());
      return matchesText && matchesAvail && matchesBank && matchesMunicipality && matchesNeighborhood;
    });

    if (sortByDistance && userCoords) {
      return [...filtered].sort((a, b) => {
        const latA = (a as any).lat;
        const lngA = (a as any).lng;
        const latB = (b as any).lat;
        const lngB = (b as any).lng;
        const distA =
          typeof latA === "number" && typeof lngA === "number"
            ? calculateDistanceKm(userCoords.lat, userCoords.lng, latA, lngA)
            : 9999;
        const distB =
          typeof latB === "number" && typeof lngB === "number"
            ? calculateDistanceKm(userCoords.lat, userCoords.lng, latB, lngB)
            : 9999;
        return distA - distB;
      });
    }

    return filtered;
  }, [
    filter,
    query,
    selectedBank,
    selectedMunicipality,
    selectedNeighborhood,
    sortByDistance,
    userCoords,
    atmList,
  ]);

  function useLocation() {
    setIsLocating(true);
    setLocationMessage("A obter a tua localização em tempo real...");

    if (!navigator.geolocation) {
      setLocationMessage("A geolocalização não está disponível. A usar referência em Luanda (Mutamba).");
      setUserCoords({ lat: -8.8145, lng: 13.2301 });
      setLocationLabel("Mutamba (Centro) · Luanda");
      setIsLocating(false);
      setShowNearbyModal(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setLocationLabel("Localização GPS Detetada");
        setLocationMessage("Localização confirmada! A calcular caixas mais próximos...");
        setShowNearbyModal(true);
      },
      (err) => {
        console.warn("Geolocalização não autorizada ou indisponível:", err);
        setIsLocating(false);
        // Fallback elegante para ponto central de Luanda (Mutamba) para sempre exibir resultados reais
        setUserCoords({ lat: -8.8145, lng: 13.2301 });
        setLocationLabel("Mutamba (Centro) · Luanda");
        setLocationMessage("Sinal GPS indisponível. A apresentar caixas mais próximos a partir da Mutamba.");
        setShowNearbyModal(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  async function handleSubmitAtm(data: SubmitAtmFormData): Promise<void> {
    if (hasSupabase) {
      try {
        let bankId: string | null = null;
        const { data: existingBanks } = await supabase
          .from("banks")
          .select("id")
          .ilike("name", data.bank)
          .limit(1);

        if (existingBanks && existingBanks.length > 0) {
          bankId = existingBanks[0].id;
        } else {
          const { data: newBank } = await supabase
            .from("banks")
            .insert({ name: data.bank })
            .select("id")
            .single();
          if (newBank) bankId = newBank.id;
        }

        if (!bankId) {
          const { data: anyBank } = await supabase.from("banks").select("id").limit(1);
          if (anyBank && anyBank.length > 0) bankId = anyBank[0].id;
        }

        if (bankId) {
          const { error } = await supabase.from("atms").insert({
            bank_id: bankId,
            name: data.name,
            address: data.address,
            municipality: data.municipality,
            neighborhood: data.neighborhood || null,
            maps_url: data.maps_url,
            lat: -8.83833,
            lng: 13.23444,
            status: "pending",
            created_by: user?.id || null,
          });

          if (error) {
            console.warn("Aviso ao submeter ATM no Supabase:", error.message);
          } else {
            console.info("ATM submetido com sucesso e a aguardar moderação!");
          }
        }
      } catch (e) {
        console.warn("Erro ao comunicar com Supabase:", e);
      }
    }
  }

  async function handleSubmitReport(data: SubmitReportFormData): Promise<void> {
    if (reportingAtm) {
      setCustomOverrides((prev) => ({
        ...prev,
        [reportingAtm.id]: {
          availability: data.availability,
          queueTime: data.queueTime,
          notesAvailable: data.notesAvailable,
          updated: "Atualizado há instantes",
        },
      }));

      toast.success("✅ Reporte registado na comunidade!", {
        description: `Informação atualizada para "${reportingAtm.name}". +15 Pontos de Karma atribuídos!`,
        duration: 5000,
      });

      if (favoriteIds.includes(reportingAtm.id)) {
        simulateStatusChange(reportingAtm.id, data.availability);
      }
      if (user) {
        localStorage.setItem(`kusanga_rate_limit_${reportingAtm.id}_${user.id}`, Date.now().toString());
      }

      if (hasSupabase && reportingAtm.id && reportingAtm.id.includes("-") && !reportingAtm.id.startsWith("sample")) {
        try {
          const { error } = await supabase.from("reports").insert({
            atm_id: reportingAtm.id,
            availability: data.availability,
            notes_available: data.notesAvailable || null,
            queue_time: data.queueTime || null,
            comment: data.comment || null,
            confirmed_at: data.confirmedAt,
            source: data.feedbackSummary,
            reported_by: user?.id || null,
          });
          if (error) {
            console.warn("Aviso ao guardar reporte no Supabase (RLS):", error.message);
          }
        } catch (e) {
          console.warn("Erro ao comunicar com Supabase:", e);
        }
      }

      setReportingAtm(null);
    }
  }

  async function handleQuickNoCash(atm: RealAtm) {
    if (!user) {
      openAuth(
        "login",
        "Inicia sessão com a tua conta Google para reportar que o dinheiro acabou neste caixa."
      );
      return;
    }

    // Proteção de confiança: Rate limit de 5 minutos por utilizador no mesmo ATM
    const lastReportKey = `kusanga_rate_limit_${atm.id}_${user.id}`;
    const lastReportTimestamp = localStorage.getItem(lastReportKey);
    if (lastReportTimestamp) {
      const diffMs = Date.now() - parseInt(lastReportTimestamp, 10);
      const remainingMin = Math.ceil((5 * 60 * 1000 - diffMs) / 60000);
      if (remainingMin > 0) {
        toast.info("⏳ Reporte recente registado", {
          description: `Já confirmaste este caixa recentemente. Para garantir a fiabilidade dos dados, aguarda cerca de ${remainingMin} min.`,
          duration: 4000,
        });
        return;
      }
    }

    localStorage.setItem(lastReportKey, Date.now().toString());

    setCustomOverrides((prev) => ({
      ...prev,
      [atm.id]: {
        availability: "no-cash",
        updated: "Reportado sem notas há instantes",
      },
    }));

    toast.warning("⚠️ Marcado como sem notas!", {
      description: `Obrigado! Avisaste a comunidade sobre o ${atm.name}. +10 Pontos de Karma atribuídos!`,
      duration: 5000,
    });

    if (favoriteIds.includes(atm.id)) {
      simulateStatusChange(atm.id, "no-cash");
    }

    if (hasSupabase && atm.id && atm.id.includes("-") && !atm.id.startsWith("sample")) {
      try {
        await supabase.from("reports").insert({
          atm_id: atm.id,
          availability: "no-cash",
          confirmed_at: new Date().toISOString(),
          source: "Reporte rápido: dinheiro esgotado",
          reported_by: user.id,
        });
      } catch (err) {
        console.warn("Aviso ao registar reporte rápido no Supabase:", err);
      }
    }

    setSelectedAtm((curr) =>
      curr && curr.id === atm.id
        ? { ...curr, availability: "no-cash", updated: "Reportado sem notas há instantes" }
        : curr
    );
  }

  // 1. Estado de carregamento inicial da sessão
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EC] text-[#26362F] selection:bg-[#C09A5B]/30">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#26362F] shadow-xl border border-[#C09A5B]/50 animate-pulse">
          <KusangaSymbol size={40} />
        </div>
        <p className="mt-5 font-display text-base font-extrabold tracking-tight text-[#26362F]">
          KUSANGA <span className="text-[#C09A5B]">KITADI</span>
        </p>
        <p className="text-xs text-[#718477] mt-1 font-medium">A verificar sessão segura...</p>
      </div>
    );
  }

  // 2. Auth Gate Global: se não estiver autenticado (e não em bypass dev), apresenta o portal de entrada
  if (!user && !devBypass) {
    return (
      <>
        <AuthGatePortal
          onOpenEmailAuth={(mode) => openAuth(mode)}
          onBypassDev={() => setDevBypass(true)}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authModalMode}
          requiredReason={authRequiredReason}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Banner de Modo Convidado em Desenvolvimento */}
      {devBypass && !user && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-900 font-medium flex items-center justify-center gap-2">
          <span>Modo Demonstração (Dev) — Em produção, o acesso aos ATM exige login obrigatório.</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2 border-amber-600/40 text-amber-900 hover:bg-amber-600/10"
            onClick={() => openAuth("login")}
          >
            Entrar com Conta
          </Button>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <Brand onClick={() => setSection("home")} />
        <nav aria-label="Navegação principal" className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
              Explorar
            </p>
            <div className="space-y-1">
              <NavButton
                active={section === "home"}
                item={{ id: "home", label: "Início", icon: House }}
                onClick={() => setSection("home")}
              />
              <NavButton
                active={section === "map"}
                item={{ id: "map", label: "Mapa de Caixas", icon: Map }}
                onClick={() => setSection("map")}
              />
              <NavButton
                active={section === "search"}
                item={{ id: "search", label: "Pesquisar ATM", icon: Search }}
                onClick={() => setSection("search")}
              />
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
              Comunidade & Pessoal
            </p>
            <div className="space-y-1">
              <NavButton
                active={section === "favorites"}
                item={{ id: "favorites", label: "Favoritos & Alertas", icon: Heart }}
                onClick={() => setSection("favorites")}
              />
              <NavButton
                active={section === "profile"}
                item={{ id: "profile", label: "Meu Perfil", icon: UserRound }}
                onClick={() => setSection("profile")}
              />
            </div>
          </div>

          {canModerate && (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#C09A5B] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-[#C09A5B]" />
                Administração
              </p>
              <div className="space-y-1">
                <NavButton
                  active={section === "admin"}
                  item={{ id: "admin", label: "Painel de Moderação", icon: ShieldCheck }}
                  onClick={() => setSection("admin")}
                />
              </div>
            </div>
          )}
        </nav>
        <div className="mx-4 mb-5 border-t border-border pt-4">
          <div className="flex items-start gap-2.5 px-3 py-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#C09A5B]" aria-hidden="true" />
            <p className="text-xs leading-5 text-muted-foreground">
              Nunca pedimos o PIN ou dados do teu cartão bancário.
            </p>
          </div>
          <p className="px-3 pt-2 text-xs font-bold text-[#C09A5B]">KUSANGA KITADI</p>
          <p className="px-3 text-[10px] text-muted-foreground italic">A força está na ligação.</p>
          <p className="px-3 text-[10px] text-muted-foreground italic">Saiba onde levantar.</p>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="lg:hidden"><Brand compact onClick={() => setSection("home")} /></div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            Luanda, Angola
            <span className="ml-1 rounded-sm border border-border px-2 py-0.5 text-xs">Piloto</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1.5 rounded-sm border-primary/20 bg-secondary px-2.5 py-1 text-primary sm:inline-flex">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {hasSupabase ? "Dados reais" : "Pré-lançamento"}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              className="relative size-10 rounded-full"
              aria-label="Avisos e Notificações dos Favoritos"
              title="Avisos e Notificações"
              onClick={() => setShowNotificationsModal(true)}
            >
              <Bell className="size-[18px]" aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-bounce">
                  {unreadCount}
                </span>
              ) : !hasSupabase ? (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-status-stale" />
              ) : null}
            </Button>
            {canModerate && (
              <Button
                variant="outline"
                className="h-9 rounded-md px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 inline-flex"
                onClick={() => setSection("admin")}
                title="Abrir painel de moderação de administrador"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Moderação
              </Button>
            )}
            {user ? (
              <Button
                variant="outline"
                className="hidden h-9 rounded-md px-3 text-xs sm:inline-flex items-center gap-2 border-primary/30 text-foreground hover:bg-secondary"
                onClick={() => setSection("profile")}
                title="Aceder ao perfil"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {(profile?.display_name || user.email || "U")[0].toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate">
                  {profile?.display_name || user.email?.split("@")[0]}
                </span>
              </Button>
            ) : (
              <Button
                variant="default"
                className="hidden h-9 rounded-md px-3 text-xs sm:inline-flex font-semibold"
                onClick={() => openAuth("login")}
              >
                <LogIn className="size-3.5 mr-1" aria-hidden="true" />
                Entrar
              </Button>
            )}
          </div>
        </header>

        <main id="conteudo-principal" className="mx-auto w-full max-w-[1440px] min-w-0 px-4 pb-28 pt-7 sm:px-7 md:pt-9 lg:px-10 lg:pb-12">
          {showInfo && (
            <div role="status" className="mb-5 flex items-start justify-between gap-3 border border-status-stale/25 bg-status-stale/10 px-4 py-3 text-sm">
              <p className="leading-6">
                {hasSupabase
                  ? "A mostrar dados reais do Supabase."
                  : "Esta versão mostra apenas exemplos fictícios. A consulta de ATM reais será activada quando existir uma lista validada."}
              </p>
              <Button size="icon" variant="ghost" className="size-7 shrink-0" aria-label="Fechar aviso" onClick={() => setShowInfo(false)}>
                <X className="size-4" />
              </Button>
            </div>
          )}

          {section === "home" && (
            <div key="home" className="section-fade-enter">
              <HomeView
                query={query}
                setQuery={setQuery}
                onSearchSubmit={(val) => {
                  setQuery(val);
                  setSection("search");
                }}
                atmList={atmList}
                onLocation={useLocation}
                locationMessage={locationMessage}
                onMap={() => setSection("map")}
                onSearch={() => setSection("search")}
                onFavorites={() => setSection("favorites")}
                onReport={() => {
                  if (!user) {
                    openAuth(
                      "login",
                      "O login com a tua conta Google é obrigatório para reportar notas e apoiar a comunidade."
                    );
                    return;
                  }
                  if (atmList.length > 0) {
                    setReportingAtm(atmList[0] as RealAtm);
                  } else {
                    setSection("search");
                  }
                }}
                onSelect={setSelectedAtm}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                userCoords={userCoords}
              />
            </div>
          )}
          {section === "search" && (
            <div key="search" className="section-fade-enter">
              <SearchView
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                visibleAtms={visibleAtms}
                onSelect={setSelectedAtm}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                bankOptions={bankOptions}
                selectedMunicipality={selectedMunicipality}
                setSelectedMunicipality={setSelectedMunicipality}
                municipalityOptions={municipalityOptions}
                selectedNeighborhood={selectedNeighborhood}
                setSelectedNeighborhood={setSelectedNeighborhood}
                neighborhoodOptions={neighborhoodOptions}
                sortByDistance={sortByDistance}
                setSortByDistance={setSortByDistance}
                userCoords={userCoords}
                onRequestLocation={useLocation}
              />
            </div>
          )}
          {section === "map" && (
            <div key="map" className="section-fade-enter">
              <MapView atms={atmList} onSelect={setSelectedAtm} onOpenNearby={useLocation} />
            </div>
          )}
          {section === "favorites" && (
            <div key="favorites" className="section-fade-enter">
              <FavoritesView
                atms={atmList}
                favoriteIds={favoriteIds}
                onSelect={setSelectedAtm}
                onToggleFavorite={toggleFavorite}
                onExplore={() => setSection("home")}
                notifications={notifications}
                onSimulateChange={simulateStatusChange}
                onOpenNotifications={() => setShowNotificationsModal(true)}
                userCoords={userCoords}
              />
            </div>
          )}
          {section === "profile" && (
            <div key="profile" className="section-fade-enter">
              <ProfileView
                onShowInfo={() => setShowInfo(true)}
                onSubmitAtm={handleInitiateSubmitAtm}
                onOpenAdmin={() => setSection("admin")}
                onOpenAuth={openAuth}
              />
            </div>
          )}
          {section === "admin" && (
            <div key="admin" className="section-fade-enter">
              <AdminPanel onBackToApp={() => setSection("home")} />
            </div>
          )}

          {/* Modal: detalhes de ATM */}
          {selectedAtm && !showSubmitAtm && !reportingAtm && (
            <AtmDetails
              atm={selectedAtm}
              onClose={() => setSelectedAtm(null)}
              onAccount={() => {
                setSelectedAtm(null);
                setSection("profile");
              }}
              onReport={() => handleInitiateReport(selectedAtm as RealAtm)}
              onQuickNoCash={handleQuickNoCash}
              isFavorite={selectedAtm ? isFavorite(selectedAtm.id) : false}
              onToggleFavorite={() => selectedAtm && toggleFavorite(selectedAtm.id)}
              reportHistory={
                (selectedAtm as RealAtm).isReal
                  ? [
                      {
                        id: "rep-initial",
                        availability: "available",
                        confirmedAt: "17/11/2026 às 09:24",
                        source: "Observação presencial",
                      },
                    ]
                  : undefined
              }
            />
          )}

          {/* Modal: submeter ATM */}
          {showSubmitAtm && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 sm:items-center sm:p-5"
              role="presentation"
              onClick={() => setShowSubmitAtm(false)}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="submit-atm-title"
                className="w-full max-w-lg overflow-y-auto border border-border bg-background p-5 shadow-xl sm:max-h-[90vh] sm:p-7"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 id="submit-atm-title" className="font-display text-xl font-semibold">
                    Submeter ATM
                  </h2>
                  <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-9" aria-label="Fechar" onClick={() => setShowSubmitAtm(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <SubmitAtmForm
                  onSubmit={handleSubmitAtm}
                  onCancel={() => setShowSubmitAtm(false)}
                />
              </section>
            </div>
          )}

          {/* Modal: reportar disponibilidade */}
          {reportingAtm && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 sm:items-center sm:p-5"
              role="presentation"
              onClick={() => setReportingAtm(null)}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="submit-report-title"
                className="w-full max-w-lg overflow-y-auto border border-border bg-background p-5 shadow-xl sm:max-h-[90vh] sm:p-7"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 id="submit-report-title" className="font-display text-xl font-semibold">
                    Avaliar e Confirmar Levantamento
                  </h2>
                  <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-9" aria-label="Fechar" onClick={() => setReportingAtm(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <SubmitReportForm
                  atmName={reportingAtm.name}
                  atmBank={reportingAtm.bank}
                  atmArea={reportingAtm.area}
                  onSubmit={handleSubmitReport}
                  onCancel={() => setReportingAtm(null)}
                />
              </section>
            </div>
          )}
          {/* Modal de Autenticação (Login / Registo com Google) */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              setAuthRequiredReason(null);
            }}
            defaultMode={authModalMode}
            requiredReason={authRequiredReason}
          />
          {/* Modal de Notificações e Alertas dos Favoritos */}
          <NotificationsModal
            isOpen={showNotificationsModal}
            onClose={() => setShowNotificationsModal(false)}
            notifications={notifications}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearNotifications}
            favoriteAtms={atmList.filter((a) => favoriteIds.includes(a.id))}
            onSimulateChange={simulateStatusChange}
            onSelectAtm={setSelectedAtm}
          />
          {/* Modal de ATMs Mais Próximos com Disponibilidade */}
          <NearbyAtmsModal
            isOpen={showNearbyModal}
            onClose={() => setShowNearbyModal(false)}
            userCoords={userCoords}
            isLocating={isLocating}
            atms={atmList}
            onSelectAtm={(atm) => {
              setSelectedAtm(atm);
              setShowNearbyModal(false);
            }}
            onViewOnMap={(atm) => {
              setSection("map");
              setSelectedAtm(atm);
              setShowNearbyModal(false);
            }}
            onRequestLocation={useLocation}
            onSetCustomCoords={({ lat, lng, label }) => {
              setUserCoords({ lat, lng });
              setLocationLabel(label);
            }}
            locationLabel={locationLabel}
          />
        </main>
      </div>

      {/* Botão Flutuante Global e Permanente "Perto de mim" (Visível em todas as secções) */}
      <FloatingNearbyButton
        onClick={useLocation}
        isLocating={isLocating}
        hasLocation={Boolean(userCoords)}
        errorMessage={locationMessage.includes("indisponível") ? locationMessage : null}
      />

      <nav aria-label="Navegação móvel" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        {navigation.map((item) => (
          <NavButton key={item.id} active={section === item.id} item={item} onClick={() => setSection(item.id)} mobile />
        ))}
      </nav>
    </div>
  );
}

function Brand({
  compact = false,
  onClick,
}: {
  compact?: boolean;
  onClick?: () => void;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center text-left py-1 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C09A5B] rounded-md"
        title="Voltar à página inicial — Kusanga Kitadi"
        aria-label="Kusanga Kitadi — Página Inicial"
      >
        <KusangaLogo variant="compact" size={32} theme="light" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-5 py-5 border-b border-border/80 cursor-pointer transition-transform duration-200 hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C09A5B]"
      title="Voltar à página inicial — Kusanga Kitadi"
      aria-label="Kusanga Kitadi — Página Inicial"
    >
      <KusangaLogo variant="brand" size={40} theme="light" />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#C09A5B]">
        A força está na ligação
      </p>
    </button>
  );
}

function NavButton({
  item,
  active,
  onClick,
  mobile = false,
}: {
  item: (typeof navigation)[number];
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={
        mobile
          ? `flex h-[58px] w-full flex-col gap-1 rounded-none px-1 text-[10px] ${
              active ? "text-[#C09A5B] font-bold" : "text-muted-foreground"
            }`
          : `h-11 w-full justify-start rounded-xl px-3.5 text-sm transition-all ${
              active
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "font-semibold text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`
      }
      aria-current={active ? "page" : undefined}
      aria-label={mobile ? item.label : undefined}
      onClick={onClick}
    >
      <Icon
        className={mobile ? "size-[20px]" : "size-[18px] mr-2.5"}
        strokeWidth={active ? 2.4 : 1.8}
        aria-hidden="true"
      />
      {item.label}
    </Button>
  );
}

function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-7">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#C09A5B]">{eyebrow}</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-[34px] text-foreground">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-secondary/35 px-4 py-3.5">
      <CircleHelp className="mt-0.5 size-4 shrink-0 text-[#C09A5B]" aria-hidden="true" />
      <p className="text-xs leading-5 text-foreground/80">
        <strong className="font-bold text-foreground">Ambiente de Demonstração.</strong> Caixas e reportes colaborativos apresentados ilustram o funcionamento do Kusanga Kitadi em Luanda.
      </p>
    </div>
  );
}

function HomeView({
  query,
  setQuery,
  onSearchSubmit,
  atmList,
  onLocation,
  locationMessage,
  onMap,
  onSearch,
  onFavorites,
  onReport,
  onSelect,
  isFavorite,
  onToggleFavorite,
  userCoords,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  atmList: AtmData[];
  onLocation: () => void;
  locationMessage: string;
  onMap: () => void;
  onSearch: () => void;
  onFavorites: () => void;
  onReport: () => void;
  onSelect: (atm: AtmData) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}) {
  const availableCount = atmList.filter((a) => a.availability === "available").length;
  const noCashCount = atmList.filter((a) => a.availability === "no-cash").length;

  const confirmedWithCash = useMemo(() => {
    const withCash = atmList.filter((a) => a.availability === "available");
    return withCash.slice(0, 4);
  }, [atmList]);

  return (
    <>
      {/* Hero Minimalista & Caixa de Pesquisa Destacada */}
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-[#C09A5B]/30 bg-gradient-to-br from-[#2D4037] via-[#26362F] to-[#1C2923] text-[#F7F4EC] shadow-md">
        <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full border border-[#C09A5B]/15" />
        <div className="relative z-10 flex flex-col items-start px-6 py-8 sm:px-9 md:py-10">
          <div className="mb-3">
            <KusangaSloganPill dark />
          </div>

          <h1 className="max-w-2xl font-display text-2xl sm:text-3xl lg:text-[38px] font-extrabold leading-tight tracking-tight text-[#F7F4EC]">
            A força está na ligação. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2CE] via-[#D8B168] to-[#C09A5B]">
              Saiba onde levantar.
            </span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-[#F7F4EC]/80 max-w-lg leading-relaxed">
            Plataforma colaborativa para encontrar caixas automáticos com notas disponíveis em Luanda.
          </p>

          {/* Campo de Pesquisa Destacado */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(query);
            }}
            className="mt-6 flex w-full max-w-2xl flex-col sm:flex-row gap-2.5"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Procure um ATM, banco ou localização..."
                aria-label="Procure um ATM, banco ou localização"
                className="h-12 rounded-xl border-[#C09A5B]/30 bg-background/95 pl-10 text-foreground placeholder:text-muted-foreground focus:border-[#C09A5B] text-xs sm:text-sm"
              />
            </div>
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-[#E2BE78] via-[#C09A5B] to-[#9E7638] px-6 text-[#1C2923] font-bold text-xs hover:brightness-110 shadow-sm"
            >
              Pesquisar
            </Button>
          </form>
          {locationMessage && (
            <p role="status" className="mt-2.5 text-xs text-[#C09A5B] font-medium">
              {locationMessage}
            </p>
          )}
        </div>
      </section>

      {/* 4 Acções Rápidas (Grid Minimalista e Visual) */}
      <div className="mb-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Explorar mapa */}
        <button
          type="button"
          onClick={onMap}
          className="group flex flex-col items-start p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/40 transition-all duration-200 text-left shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-3">
            <Map className="size-5" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">
            Explorar Mapa
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Ver caixas por zona
          </span>
        </button>

        {/* 2. ATM próximos */}
        <button
          type="button"
          onClick={onLocation}
          className="group flex flex-col items-start p-4 sm:p-5 rounded-2xl border border-[#C09A5B]/30 bg-card hover:border-[#C09A5B] hover:bg-[#C09A5B]/10 transition-all duration-200 text-left shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#C09A5B]/20 text-[#C09A5B] group-hover:bg-[#C09A5B] group-hover:text-[#1C2923] transition-colors mb-3">
            <Crosshair className="size-5" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">
            ATM Próximos
          </span>
          <span className="text-[11px] text-[#C09A5B] font-semibold mt-0.5">
            Radar GPS Luanda
          </span>
        </button>

        {/* 3. Reportar ATM */}
        <button
          type="button"
          onClick={onReport}
          className="group flex flex-col items-start p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 text-left shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-3">
            <PlusCircle className="size-5" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">
            Reportar ATM
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Avisar sobre notas
          </span>
        </button>

        {/* 4. Favoritos */}
        <button
          type="button"
          onClick={onFavorites}
          className="group flex flex-col items-start p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-rose-400/50 hover:bg-rose-500/5 transition-all duration-200 text-left shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors mb-3">
            <Heart className="size-5" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">
            Favoritos
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Caixas salvos & alertas
          </span>
        </button>
      </div>

      {/* Resumo Rápido de Estado (Discreto e em 1 Linha) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-available/10 border border-status-available/20 text-xs font-semibold text-status-available">
          <span className="size-2 rounded-full bg-status-available animate-pulse" />
          {availableCount} Caixas com Dinheiro
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-empty/10 border border-status-empty/20 text-xs font-semibold text-status-empty">
          <span className="size-2 rounded-full bg-status-empty" />
          {noCashCount} Sem Notas
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C09A5B]/10 border border-[#C09A5B]/20 text-xs font-semibold text-[#C09A5B]">
          ⚡ {atmList.length} Caixas Verificados
        </span>
      </div>

      {/* Secção Resumida: Caixas com Dinheiro Confirmado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Disponíveis Agora em Luanda
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Caixas confirmados com numerário recente por cidadãos.
            </p>
          </div>
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs font-bold text-primary hover:text-primary/80 gap-1"
            onClick={onSearch}
          >
            Ver todos no menu Pesquisar
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        {confirmedWithCash.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {confirmedWithCash.map((atm) => {
              const lat = (atm as any).lat;
              const lng = (atm as any).lng;
              const dist =
                userCoords && typeof lat === "number" && typeof lng === "number"
                  ? calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng)
                  : null;

              return (
                <AtmCard
                  key={atm.id}
                  atm={atm}
                  onClick={() => onSelect(atm)}
                  isFavorite={isFavorite(atm.id)}
                  onToggleFavorite={() => onToggleFavorite(atm.id)}
                  distanceKm={dist}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhum caixa com notas confirmado neste momento. Consulta o mapa para ver todos os pontos.
          </div>
        )}

        <div className="pt-2 text-center">
          <Button
            variant="outline"
            className="rounded-xl text-xs font-semibold px-6 border-border hover:border-primary"
            onClick={onSearch}
          >
            Explorar Todos os {atmList.length} Caixas de Luanda
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </section>

      {/* Rodapé Discreto */}
      <footer className="mt-10 border-t border-border pt-6 pb-2 text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} KUSANGA KITADI · A força está na ligação.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#C09A5B] font-semibold">Luanda, Angola</span>
            <span>·</span>
            <span>Reportes Comunitários em Tempo Real</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function SearchView({
  query,
  setQuery,
  filter,
  setFilter,
  visibleAtms,
  onSelect,
  isFavorite,
  onToggleFavorite,
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
  userCoords,
  onRequestLocation,
}: {
  query: string;
  setQuery: (value: string) => void;
  filter: Filter;
  setFilter: (value: Filter) => void;
  visibleAtms: AtmData[];
  onSelect: (atm: AtmData) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
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
  userCoords: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Rede de Luanda"
        title="Pesquisar Caixas"
        text={
          hasSupabase
            ? "Localiza caixas automáticos por banco, município ou bairro. A força está na ligação. Saiba onde levantar."
            : "Procura por banco, município ou zona. Consulta disponibilidade colaborativa em tempo real."
        }
      />
      {!hasSupabase && <div className="mb-5"><DemoNotice /></div>}
      <div className="mb-6">
        <SearchFiltersBar
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          bankOptions={bankOptions}
          selectedMunicipality={selectedMunicipality}
          setSelectedMunicipality={setSelectedMunicipality}
          municipalityOptions={municipalityOptions}
          selectedNeighborhood={selectedNeighborhood}
          setSelectedNeighborhood={setSelectedNeighborhood}
          neighborhoodOptions={neighborhoodOptions}
          sortByDistance={sortByDistance}
          setSortByDistance={setSortByDistance}
          hasUserLocation={Boolean(userCoords)}
          onRequestLocation={onRequestLocation}
          resultCount={visibleAtms.length}
          hasSupabase={hasSupabase}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleAtms.map((atm) => {
          const lat = (atm as any).lat;
          const lng = (atm as any).lng;
          const dist =
            userCoords && typeof lat === "number" && typeof lng === "number"
              ? calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng)
              : null;

          return (
            <AtmCard
              key={atm.id}
              atm={atm}
              onClick={() => onSelect(atm)}
              isFavorite={isFavorite(atm.id)}
              onToggleFavorite={() => onToggleFavorite(atm.id)}
              distanceKm={dist}
            />
          );
        })}
      </div>
      {!visibleAtms.length && <EmptyResults />}
    </>
  );
}

function MapView({
  atms,
  onSelect,
  onOpenNearby,
}: {
  atms: AtmData[];
  onSelect: (atm: AtmData) => void;
  onOpenNearby?: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Exploração Geográfica"
        title="Mapa de Caixas em Luanda"
        text="A força está na ligação. Consulta a disponibilidade de numerário em tempo real, traça rota até ao caixa mais próximo ou avalia a tua experiência."
      />
      <InteractiveMap atms={atms} onSelectAtm={onSelect} onOpenNearby={onOpenNearby} />
    </>
  );
}

function FavoritesView({
  atms,
  favoriteIds,
  onSelect,
  onToggleFavorite,
  onExplore,
  notifications = [],
  onSimulateChange,
  onOpenNotifications,
  userCoords,
}: {
  atms: AtmData[];
  favoriteIds: string[];
  onSelect: (atm: AtmData) => void;
  onToggleFavorite: (id: string) => void;
  onExplore: () => void;
  notifications?: import("@/lib/use-favorite-notifications").FavoriteNotification[];
  onSimulateChange?: (atmId: string, newStatus: "available" | "no-cash" | "out-of-service" | "stale") => void;
  onOpenNotifications?: () => void;
  userCoords?: { lat: number; lng: number } | null;
}) {
  const favoriteAtms = useMemo(
    () => atms.filter((atm) => favoriteIds.includes(atm.id)),
    [atms, favoriteIds]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0] text-primary">Os teus ATMs</p>
          <h1 className="font-display text-3xl font-semibold tracking-[0] sm:text-[34px]">Favoritos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acede rapidamente aos ATMs que consultas com mais frequência em Luanda.
          </p>
        </div>

        {favoriteAtms.length > 0 && onOpenNotifications && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-xs font-semibold rounded-lg border-primary/30"
            onClick={onOpenNotifications}
          >
            <Bell className="size-3.5 text-primary" />
            Alertas dos Favoritos
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                {unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {favoriteAtms.length > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bell className="size-3.5" />
            </span>
            <p className="text-foreground/90 leading-5">
              <strong className="font-semibold">Monitorização em tempo real ativa:</strong> És alertado com notificações sempre que a disponibilidade destes caixas for atualizada.
            </p>
          </div>
          {onSimulateChange && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 shrink-0 text-[11px] rounded-md font-semibold border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => onSimulateChange(favoriteAtms[0].id, "available")}
              title="Testar como funciona a notificação em tempo real"
            >
              Testar Notificação
            </Button>
          )}
        </div>
      )}

      {favoriteAtms.length === 0 ? (
        <div className="grid min-h-[320px] place-items-center border border-border bg-card px-5 py-12 text-center rounded-xl shadow-sm">
          <div className="max-w-md">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Heart className="size-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold">
              Ainda não tens ATMs favoritos
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Clica no ícone de coração num ATM na lista ou nos detalhes para o guardar aqui e acompanhar a sua disponibilidade.
            </p>
            <Button className="mt-5 rounded-md font-semibold" onClick={onExplore}>
              Explorar ATMs de Luanda
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {favoriteAtms.length} {favoriteAtms.length === 1 ? "ATM guardado" : "ATMs guardados"}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {favoriteAtms.map((atm) => {
              const lat = (atm as any).lat;
              const lng = (atm as any).lng;
              const dist =
                userCoords && typeof lat === "number" && typeof lng === "number"
                  ? calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng)
                  : null;

              return (
                <AtmCard
                  key={atm.id}
                  atm={atm}
                  onClick={() => onSelect(atm)}
                  isFavorite={true}
                  onToggleFavorite={() => onToggleFavorite(atm.id)}
                  distanceKm={dist}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function ProfileView({
  onShowInfo,
  onSubmitAtm,
  onOpenAdmin,
  onOpenAuth,
}: {
  onShowInfo: () => void;
  onSubmitAtm: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: (mode: "login" | "register") => void;
}) {
  const { user, profile, isAdmin, isModerator, signOut, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.display_name || user?.email?.split("@")[0] || "");
  const [savingName, setSavingName] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: userReports = [], isLoading: loadingReports } = useUserReports(user?.id);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
  }

  async function handleSaveName() {
    if (!user || !hasSupabase || !nameInput.trim()) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nameInput.trim() })
        .eq("id", user.id);

      if (error) {
        toast.error("Erro ao actualizar nome: " + error.message);
      } else {
        toast.success("Nome atualizado com sucesso!");
        if (profile) profile.display_name = nameInput.trim();
        setIsEditingName(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao comunicar com a base de dados.");
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email || !hasSupabase) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Email de redefinição enviado com sucesso para " + user.email);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao solicitar recuperação de senha.");
    } finally {
      setSendingReset(false);
    }
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Cidadão";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <>
      <PageHeading eyebrow="A tua conta" title="Perfil" text="Gere a tua conta, contribuições comunitárias e preferências." />

      {/* Cartão de Utilizador Autenticado ou Visitante */}
      {user ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 my-1">
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="h-8 text-xs max-w-[160px]"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8 text-[11px] px-2.5 font-bold"
                        onClick={handleSaveName}
                        disabled={savingName}
                      >
                        {savingName ? "..." : "Guardar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-[11px] px-2"
                        onClick={() => setIsEditingName(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-foreground truncate">{displayName}</h3>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="text-[11px] text-[#C09A5B] hover:underline font-semibold cursor-pointer"
                        title="Editar nome"
                      >
                        Editar
                      </button>
                    </>
                  )}
                  <Badge variant="outline" className="border-status-available/30 text-status-available text-[10px]">
                    Sessão ativa
                  </Badge>
                  {isAdmin ? (
                    <Badge className="bg-[#C09A5B] text-[#26362F] font-bold text-[10px] border-none">
                      Super Admin
                    </Badge>
                  ) : isModerator ? (
                    <Badge className="bg-emerald-700 text-white font-bold text-[10px] border-none">
                      Moderador
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                <p className="text-[11px] text-[#C09A5B] font-semibold mt-1">
                  Membro da rede colaborativa Kusanga Kitadi
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 shrink-0"
            >
              <LogOut className="size-3.5" />
              {loggingOut ? "A terminar..." : "Terminar sessão"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-[#C09A5B]/30 bg-[#C09A5B]/5 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UserRound className="size-6 text-[#C09A5B]" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Entra na comunidade Kusanga Kitadi</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  A força está na ligação. Cria uma conta para submeter novos caixas, reportar disponibilidade de dinheiro e acompanhar os teus favoritos em Luanda.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() => onOpenAuth("login")}
                className="w-full sm:w-auto text-xs font-bold bg-[#26362F] text-white hover:bg-[#26362F]/90 rounded-xl gap-2 h-9 px-4"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Entrar com o Google
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAuth("register")}
                className="w-full sm:w-auto text-xs font-semibold rounded-xl h-9"
              >
                Outras Opções
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gamificação & Reputação Comunitária (Efeito Waze) */}
      <div className="mb-6 rounded-2xl border border-[#C09A5B]/30 bg-card p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#C09A5B]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[#C09A5B]/15 text-[#C09A5B]">
              <Award className="size-6 text-[#C09A5B]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-foreground">
                  Reputação Comunitária
                </h3>
                <Badge className="bg-[#C09A5B] text-[#26362F] font-bold text-[10px] hover:bg-[#C09A5B]/90 border-none">
                  Efeito Waze
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nível 2 · Sentinela de Luanda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <Zap className="size-3.5 text-[#C09A5B]" />
              240 Pontos de Karma
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Nível */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground">Progresso para Nível 3 (Guardião do Kwanza)</span>
            <span className="font-bold text-[#C09A5B]">240 / 300 pts (80%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#26362F] via-[#C09A5B] to-[#C09A5B] rounded-full transition-all duration-500"
              style={{ width: "80%" }}
            />
          </div>
        </div>

        {/* Métricas de Impacto Comunitário */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-5">
          <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <p className="font-display text-lg sm:text-xl font-bold text-foreground">14</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">Reportes Enviados</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <p className="font-display text-lg sm:text-xl font-bold text-status-available">230+</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">Cidadãos Ajudados</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
            <p className="font-display text-lg sm:text-xl font-bold text-[#C09A5B]">98%</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">Precisão Comunitária</p>
          </div>
        </div>

        {/* Conquistas e Medalhas */}
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Medalhas & Distintivos de Cidadão
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background">
              <span className="text-xl">⚡</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Reporte Relâmpago</p>
                <p className="text-[11px] text-muted-foreground truncate">Primeiro a avisar sobre notas disponíveis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background">
              <span className="text-xl">🛡️</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Verificador Confiável</p>
                <p className="text-[11px] text-muted-foreground truncate">5+ reportes confirmados por outros utentes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background">
              <span className="text-xl">📍</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Sentinela de Luanda</p>
                <p className="text-[11px] text-muted-foreground truncate">Mapeou caixas em 3 municípios diferentes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-background">
              <span className="text-xl">🤝</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Kamba Solidário</p>
                <p className="text-[11px] text-muted-foreground truncate">Partilhou ATM disponível via WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dica Comunitária */}
        <div className="mt-4 rounded-xl bg-[#C09A5B]/10 border border-[#C09A5B]/20 p-3 text-xs text-foreground/90 flex items-start gap-2.5">
          <Sparkles className="size-4 text-[#C09A5B] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-foreground">Como subir de nível:</strong> Ao passar por qualquer caixa, relata a disponibilidade, tamanho da fila ou se o dinheiro esgotou. Cada informação poupa tempo e combustível a milhares de angolanos!
          </p>
        </div>
      </div>

      {/* Secção: Painel de Moderação (Admin ou Moderador) */}
      <div className="mb-6 rounded-2xl border border-[#C09A5B]/30 bg-gradient-to-r from-[#26362F]/5 via-background to-[#C09A5B]/5 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5 text-[#C09A5B]" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display font-bold text-foreground">Painel de Moderação</p>
              <Badge variant="outline" className="border-[#C09A5B]/40 text-[#C09A5B] bg-[#C09A5B]/10 font-bold text-[10px]">
                {isAdmin ? "Super Administrador" : isModerator ? "Moderador Ativo" : "Equipa de Validação"}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isAdmin
                ? "Valida novos caixas, convida novos moderadores e gere a rede de bancos comerciais em Luanda."
                : "Revê as sugestões de caixas enviadas pelos cidadãos, verifica localizações e aprova a publicação na rede."}
            </p>
            <Button
              className="mt-4 rounded-xl font-bold text-xs bg-[#26362F] text-white hover:bg-[#26362F]/90"
              onClick={onOpenAdmin}
            >
              <ShieldCheck className="mr-1.5 size-4 text-[#C09A5B]" />
              Abrir Painel de Moderação
            </Button>
          </div>
        </div>
      </div>

      {/* Secção: Submeter ATM */}
      <div className="mb-6 border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#C09A5B]/15 text-[#C09A5B]">
            <PlusCircle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-foreground">Submeter Caixa Automático</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Conheces um caixa que não consta na lista? Submete a localização para validação e fortalece a nossa rede em Luanda.
            </p>
            <Button variant="outline" className="mt-4 rounded-xl text-xs font-bold border-border hover:border-[#C09A5B]" onClick={onSubmitAtm}>
              <PlusCircle className="mr-1.5 size-4 text-[#C09A5B]" />
              Submeter Caixa
            </Button>
          </div>
        </div>
      </div>

      {/* Secção: A Minha Actividade Comunitária (Histórico de Reportes do Utilizador) */}
      {user && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock3 className="size-4 text-[#C09A5B]" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">
                  A Minha Actividade Comunitária
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Reportes enviados por ti para apoiar os cidadãos de Luanda
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold">
              {userReports.length} {userReports.length === 1 ? "reporte" : "reportes"}
            </Badge>
          </div>

          {loadingReports ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              A carregar histórico pessoal...
            </div>
          ) : userReports.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Ainda não enviaste nenhum reporte. Ao passar por um caixa, clica em "Confirmar Notas" para acumulares karma!
            </div>
          ) : (
            <div className="space-y-2">
              {userReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-foreground truncate">{r.atm_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {r.atm_bank} {r.notes_available ? `· ${r.notes_available}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        r.availability === "available"
                          ? "border-status-available/40 text-status-available bg-status-available/10"
                          : "border-status-empty/40 text-status-empty bg-status-empty/10"
                      }`}
                    >
                      {r.availability === "available" ? "Com notas" : "Sem notas"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.confirmed_at).toLocaleDateString("pt-AO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Secção: Segurança e Gestão de Conta */}
      {user && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border mb-4">
            <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Lock className="size-4 text-[#C09A5B]" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-foreground">
                Segurança & Conta
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Gere o teu acesso e preferências de privacidade
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background">
              <div>
                <p className="text-xs font-bold text-foreground">Palavra-passe</p>
                <p className="text-[11px] text-muted-foreground">Recebe um link no teu email para definir nova palavra-passe.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-8 rounded-lg shrink-0"
                onClick={handlePasswordReset}
                disabled={sendingReset}
              >
                {sendingReset ? "A enviar..." : "Redefinir Palavra-passe"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
              <div>
                <p className="text-xs font-bold text-destructive">Zona de Privacidade / Eliminar Conta</p>
                <p className="text-[11px] text-muted-foreground">Solicita a eliminação definitiva dos teus dados e histórico de acesso.</p>
              </div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-[11px] h-8 font-bold"
                    onClick={() => {
                      toast.info("Pedido de eliminação registado. A equipa entrará em contacto.");
                      setShowDeleteConfirm(false);
                    }}
                  >
                    Confirmar Eliminação
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-8"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold h-8 rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Eliminar Conta
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <Button variant="ghost" className="text-xs text-muted-foreground" onClick={onShowInfo}>
          Ver avisos e notas do piloto
        </Button>
      </div>
    </>
  );
}

function EmptyResults() {
  return (
    <div className="grid min-h-48 place-items-center border border-dashed border-border px-5 py-10 text-center">
      <div>
        <Search className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
        <h3 className="mt-3 text-sm font-semibold">Nenhum resultado encontrado</h3>
        <p className="mt-1 text-xs text-muted-foreground">Experimenta outra pesquisa ou escolhe outro estado.</p>
      </div>
    </div>
  );
}
