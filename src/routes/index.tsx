import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bell,
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
  UserRound,
  LogIn,
  LogOut,
  X,
} from "lucide-react";

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
import { useApprovedAtms } from "@/lib/atm-queries";
import { supabase, hasSupabase } from "@/lib/supabase";
import { AdminPanel } from "@/components/AdminPanel";
import { InteractiveMap } from "@/components/InteractiveMap";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { useFavorites } from "@/lib/use-favorites";
import { BankStats } from "@/components/BankStats";
import { useFavoriteNotifications } from "@/lib/use-favorite-notifications";
import { NotificationsModal } from "@/components/NotificationsModal";
import { KusangaLogo, KusangaSymbol, KusangaSloganPill } from "@/components/KusangaLogo";
import { NearbyAtmsModal } from "@/components/NearbyAtmsModal";

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
  const { user, profile, isAdmin, isModerator, canModerate } = useAuth();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [section, setSection] = useState<Section>("home");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("all");
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

  const { data: dbAtms } = useApprovedAtms();

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

    // Combinar com os 20 ATMs reais de Luanda (evita duplicados pelo nome)
    const dbNames = new Set(dbMapped.map((a) => a.name.toLowerCase()));
    const remainingReal = REAL_ATMS_LUANDA.filter(
      (real) => !dbNames.has(real.name.toLowerCase())
    );

    return [...dbMapped, ...remainingReal];
  }, [dbAtms]);

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

  const municipalityOptions = [
    "Maianga",
    "Talatona",
    "Viana",
    "Cazenga",
    "Kilamba",
    "Ingombota",
    "Belas",
  ];

  const visibleAtms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-AO");
    return atmList.filter((atm) => {
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
      return matchesText && matchesAvail && matchesBank && matchesMunicipality;
    });
  }, [filter, query, selectedBank, selectedMunicipality, atmList]);

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
      if (favoriteIds.includes(reportingAtm.id)) {
        simulateStatusChange(reportingAtm.id, data.availability);
      }
      if (hasSupabase && reportingAtm.id && reportingAtm.id.includes("-") && !reportingAtm.id.startsWith("sample")) {
        try {
          const { error } = await supabase.from("reports").insert({
            atm_id: reportingAtm.id,
            availability: data.availability,
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
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <Brand />
        <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-4 py-7">
          {navigation.map((item) => (
            <NavButton
              key={item.id}
              active={section === item.id}
              item={item}
              onClick={() => setSection(item.id)}
            />
          ))}
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
          <div className="lg:hidden"><Brand compact /></div>
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
              variant="outline"
              className="h-9 rounded-md px-3 text-xs gap-1.5 border-[#C09A5B]/50 text-[#C09A5B] hover:bg-[#C09A5B]/10 font-bold inline-flex"
              onClick={useLocation}
              title="Ver ATMs mais próximos com base na sua localização"
            >
              <Crosshair className={`size-3.5 ${isLocating ? "animate-spin" : ""}`} aria-hidden="true" />
              <span className="hidden md:inline">Perto de Mim</span>
            </Button>
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
            <Button
              variant="outline"
              className="h-9 rounded-md px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 inline-flex"
              onClick={() => setSection("admin")}
              title="Abrir painel de moderação de administrador"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Moderação
            </Button>
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
            <HomeView
              query={query}
              setQuery={setQuery}
              visibleAtms={visibleAtms}
              atmList={atmList}
              onLocation={useLocation}
              locationMessage={locationMessage}
              onMap={() => setSection("map")}
              onSelect={setSelectedAtm}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              selectedBank={selectedBank}
              setSelectedBank={setSelectedBank}
              bankOptions={bankOptions}
            />
          )}
          {section === "search" && (
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
            />
          )}
          {section === "map" && <MapView atms={atmList} onSelect={setSelectedAtm} onOpenNearby={useLocation} />}
          {section === "favorites" && (
            <FavoritesView
              atms={atmList}
              favoriteIds={favoriteIds}
              onSelect={setSelectedAtm}
              onToggleFavorite={toggleFavorite}
              onExplore={() => setSection("home")}
              notifications={notifications}
              onSimulateChange={simulateStatusChange}
              onOpenNotifications={() => setShowNotificationsModal(true)}
            />
          )}
          {section === "profile" && (
            <ProfileView
              onShowInfo={() => setShowInfo(true)}
              onSubmitAtm={handleInitiateSubmitAtm}
              onOpenAdmin={() => setSection("admin")}
              onOpenAuth={openAuth}
            />
          )}
          {section === "admin" && (
            <AdminPanel onBackToApp={() => setSection("home")} />
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

      <nav aria-label="Navegação móvel" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        {navigation.map((item) => (
          <NavButton key={item.id} active={section === item.id} item={item} onClick={() => setSection(item.id)} mobile />
        ))}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="py-1">
        <KusangaLogo variant="compact" size={32} theme="light" />
      </div>
    );
  }

  return (
    <div className="px-5 py-5 border-b border-border/80">
      <KusangaLogo variant="brand" size={40} theme="light" />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#C09A5B]">
        A força está na ligação
      </p>
    </div>
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
  visibleAtms,
  atmList,
  onLocation,
  locationMessage,
  onMap,
  onSelect,
  isFavorite,
  onToggleFavorite,
  selectedBank,
  setSelectedBank,
  bankOptions,
}: {
  query: string;
  setQuery: (value: string) => void;
  visibleAtms: AtmData[];
  atmList: AtmData[];
  onLocation: () => void;
  locationMessage: string;
  onMap: () => void;
  onSelect: (atm: AtmData) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  selectedBank: string;
  setSelectedBank: (v: string) => void;
  bankOptions: string[];
}) {
  const counts = useMemo(() => {
    const avail = atmList.filter((a) => a.availability === "available").length;
    const noCash = atmList.filter((a) => a.availability === "no-cash").length;
    const offline = atmList.filter((a) => a.availability === "out-of-service").length;
    const stale = atmList.filter((a) => a.availability === "stale" || !a.availability).length;

    return [
      { key: "available" as const, label: "Com dinheiro", amount: avail, icon: ArrowUpRight },
      { key: "no-cash" as const, label: "Sem dinheiro", amount: noCash, icon: ArrowDownRight },
      { key: "out-of-service" as const, label: "Fora de serviço", amount: offline, icon: X },
      { key: "stale" as const, label: "Sem informação recente", amount: stale, icon: Clock3 },
    ];
  }, [atmList]);

  return (
    <>
      {/* Hero Oficial Kusanga Kitadi — Tecnologia Africana Premium */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#C09A5B]/30 bg-gradient-to-br from-[#2D4037] via-[#26362F] to-[#1C2923] text-[#F7F4EC] shadow-lg">
        {/* Padrão geométrico subtil em marca de água nos cantos */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full border border-[#C09A5B]/15" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border border-[#C09A5B]/10" />

        <div className="relative z-10 flex flex-col items-start px-6 py-9 sm:px-10 md:py-12">
          {/* Cápsula do Slogan Oficial */}
          <div className="mb-4">
            <KusangaSloganPill dark />
          </div>

          <h1 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[42px] text-[#F7F4EC]">
            A força está na ligação. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF2CE] via-[#D8B168] to-[#C09A5B]">
              Saiba onde levantar.
            </span>
          </h1>

          <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-[#F7F4EC]/80">
            Plataforma tecnológica angolana para localizar caixas automáticos (ATM) e consultar reportes colaborativos de disponibilidade de numerário em Luanda.
          </p>

          <div className="mt-7 flex w-full max-w-2xl flex-col gap-2.5 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Onde pretendes levantar dinheiro em Luanda?"
                aria-label="Pesquisar ATM por nome, banco ou bairro"
                className="h-12 rounded-xl border-[#C09A5B]/30 bg-background/95 pl-10 text-foreground placeholder:text-muted-foreground focus:border-[#C09A5B]"
              />
            </label>
            <Button
              variant="secondary"
              className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-[#E2BE78] via-[#C09A5B] to-[#9E7638] px-5 text-[#1C2923] font-bold text-xs hover:brightness-110 shadow-sm gap-2"
              onClick={onLocation}
            >
              <Crosshair className="size-4 text-[#1C2923]" aria-hidden="true" />
              A minha localização
            </Button>
          </div>
          {locationMessage && (
            <p role="status" className="mt-2.5 text-xs text-[#C09A5B] font-medium">
              {locationMessage}
            </p>
          )}
        </div>
      </section>

      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {counts.map(({ key, label, amount, icon: Icon }) => (
          <div key={key} className="flex min-h-[102px] items-center gap-3 border border-border bg-card px-4 py-4 sm:px-5">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${statusCopy[key].className}`}>
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold leading-none">{amount}</p>
              <p className="mt-1.5 text-xs leading-4 text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {!hasSupabase && <div className="mb-6"><DemoNotice /></div>}

      {/* Estatísticas de Disponibilidade por Banco (Últimas 24h) */}
      <div className="mb-8">
        <BankStats
          atms={atmList}
          selectedBank={selectedBank}
          onSelectBank={setSelectedBank}
        />
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0] text-primary">
              {hasSupabase ? "ATM verificados" : "Amostras fictícias"}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              {hasSupabase ? "Reportes recentes" : "Reportes de demonstração"}
            </h2>
          </div>
          <Button variant="ghost" className="h-9 shrink-0 px-2 text-xs font-semibold text-primary" onClick={onMap}>
            Abrir mapa <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {/* Filtro rápido por banco */}
        {bankOptions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBank("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                selectedBank === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              Todos
            </button>
            {bankOptions.map((bank) => (
              <button
                key={bank}
                onClick={() => setSelectedBank(bank)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  selectedBank === bank
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {bank}
              </button>
            ))}
          </div>
        )}
        {visibleAtms.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
            {visibleAtms.slice(0, 4).map((atm) => (
              <AtmCard
                key={atm.id}
                atm={atm}
                onClick={() => onSelect(atm)}
                isFavorite={isFavorite(atm.id)}
                onToggleFavorite={() => onToggleFavorite(atm.id)}
              />
            ))}
          </div>
        ) : <EmptyResults />}
      </section>

      {/* Secção Explicativa e Participação Comunitária */}
      <section className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-9 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-[#C09A5B]">
            Como Funciona
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            A força está na ligação.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Uma trama é formada por elementos individuais que, quando ligados, criam uma estrutura mais forte. No Kusanga Kitadi, cada pessoa contribui com informação e cada reporte ajuda a comunidade a tomar melhores decisões.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-background/70 p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-display font-bold text-sm mb-3">
              01
            </span>
            <h4 className="font-display font-bold text-base text-foreground">
              Localiza no Mapa
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Pesquisa caixas automáticos por banco (BAI, BFA, Atlântico, etc.), município ou proximidade.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/70 p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#C09A5B]/15 text-[#C09A5B] font-display font-bold text-sm mb-3">
              02
            </span>
            <h4 className="font-display font-bold text-base text-foreground">
              Consulta a Disponibilidade
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Verifica se o caixa tem notas disponíveis ou se está fora de serviço antes de sair de casa.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/70 p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-display font-bold text-sm mb-3">
              03
            </span>
            <h4 className="font-display font-bold text-base text-foreground">
              Partilha com a Comunidade
            </h4>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Após levantares, confirma com 1 clique se havia notas e apoia o próximo cidadão.
            </p>
          </div>
        </div>

        {/* Aviso de Transparência Institucional */}
        <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/30 p-4 text-xs text-muted-foreground flex items-start gap-3">
          <ShieldCheck className="size-4 text-[#C09A5B] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground font-semibold">Nota de transparência:</strong> A informação sobre disponibilidade de numerário é gerada exclusivamente pela comunidade através de reportes participativos. Não constitui confirmação oficial dos bancos nem acesso a dados bancários internos.
          </p>
        </div>
      </section>

      {/* Rodapé Institucional */}
      <footer className="mt-12 rounded-3xl border border-border/70 bg-card p-6 sm:p-8 text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
          <KusangaLogo variant="brand" size={36} theme="light" />
          <KusangaSloganPill dark={false} />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© {new Date().getFullYear()} KUSANGA KITADI · Plataforma Tecnológica Angolana.</p>
          <p className="italic text-[#C09A5B] font-semibold">
            A força está na ligação. Saiba onde levantar.
          </p>
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
      <div className="mb-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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
      <p className="mb-3 text-xs text-muted-foreground">
        {visibleAtms.length} {visibleAtms.length === 1 ? (hasSupabase ? "ATM encontrado" : "exemplo encontrado") : (hasSupabase ? "ATM encontrados" : "exemplos encontrados")}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleAtms.map((atm) => (
          <AtmCard
            key={atm.id}
            atm={atm}
            onClick={() => onSelect(atm)}
            isFavorite={isFavorite(atm.id)}
            onToggleFavorite={() => onToggleFavorite(atm.id)}
          />
        ))}
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
}: {
  atms: AtmData[];
  favoriteIds: string[];
  onSelect: (atm: AtmData) => void;
  onToggleFavorite: (id: string) => void;
  onExplore: () => void;
  notifications?: import("@/lib/use-favorite-notifications").FavoriteNotification[];
  onSimulateChange?: (atmId: string, newStatus: "available" | "no-cash" | "out-of-service" | "stale") => void;
  onOpenNotifications?: () => void;
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
            {favoriteAtms.map((atm) => (
              <AtmCard
                key={atm.id}
                atm={atm}
                onClick={() => onSelect(atm)}
                isFavorite={true}
                onToggleFavorite={() => onToggleFavorite(atm.id)}
              />
            ))}
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

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
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
            <div className="flex items-center gap-3.5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{displayName}</h3>
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
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
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
              className="rounded-lg text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
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
