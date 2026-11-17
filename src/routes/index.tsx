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
import { supabase } from "@/lib/supabase";
import { AdminPanel } from "@/components/AdminPanel";
import { InteractiveMap } from "@/components/InteractiveMap";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { useFavorites } from "@/lib/use-favorites";

type Section = "home" | "map" | "search" | "favorites" | "profile" | "admin";
type Filter = "all" | DemoAvailability;
type AtmData = DemoAtm | RealAtm;

/** true quando VITE_SUPABASE_URL está configurado */
const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATM KOTA — Saiba onde levantar" },
      {
        name: "description",
        content:
          "Encontra ATM e consulta reportes comunitários recentes no ATM KOTA. Disponível em breve para o piloto de Luanda.",
      },
      { property: "og:title", content: "ATM KOTA — Saiba onde levantar" },
      {
        property: "og:description",
        content:
          "Saiba onde levantar. Poupe tempo. Consulte a disponibilidade comunitária de ATM em Angola.",
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
  const { user, profile, isAdmin } = useAuth();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [section, setSection] = useState<Section>("home");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [locationMessage, setLocationMessage] = useState("");
  const [selectedAtm, setSelectedAtm] = useState<AtmData | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showSubmitAtm, setShowSubmitAtm] = useState(false);
  const [reportingAtm, setReportingAtm] = useState<RealAtm | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  function openAuth(mode: "login" | "register" = "login") {
    setAuthModalMode(mode);
    setShowAuthModal(true);
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

  const visibleAtms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-AO");
    return atmList.filter((atm) => {
      const matchesText = `${atm.name} ${atm.bank} ${atm.area}`
        .toLocaleLowerCase("pt-AO")
        .includes(needle);
      const avail = atm.availability as string;
      return matchesText && (filter === "all" || avail === filter);
    });
  }, [filter, query, atmList]);

  function useLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("A localização não está disponível neste dispositivo.");
      return;
    }
    setLocationMessage("A pedir autorização para usar a tua localização…");
    navigator.geolocation.getCurrentPosition(
      () =>
        setLocationMessage(
          "Localização autorizada. Os exemplos de demonstração não usam a tua posição.",
        ),
      () => setLocationMessage("Sem localização? Podes pesquisar manualmente."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
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
          <div className="flex items-start gap-3 px-3 py-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-5 text-muted-foreground">
              Nunca pedimos o PIN ou dados do teu cartão.
            </p>
          </div>
          <p className="px-3 pt-3 text-xs text-muted-foreground">ATM KOTA · Piloto Luanda</p>
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
              variant="ghost"
              size="icon"
              className="relative size-10 rounded-full"
              aria-label="Avisos de demonstração"
              title="Avisos de demonstração"
              onClick={() => setShowInfo((value) => !value)}
            >
              <Bell className="size-[18px]" aria-hidden="true" />
              {!hasSupabase && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-status-stale" />}
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
              onLocation={useLocation}
              locationMessage={locationMessage}
              onMap={() => setSection("map")}
              onSelect={setSelectedAtm}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
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
            />
          )}
          {section === "map" && <MapView atms={atmList} onSelect={setSelectedAtm} />}
          {section === "favorites" && (
            <FavoritesView
              atms={atmList}
              favoriteIds={favoriteIds}
              onSelect={setSelectedAtm}
              onToggleFavorite={toggleFavorite}
              onExplore={() => setSection("home")}
            />
          )}
          {section === "profile" && (
            <ProfileView
              onShowInfo={() => setShowInfo(true)}
              onSubmitAtm={() => setShowSubmitAtm(true)}
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
              onReport={() => setReportingAtm(selectedAtm as RealAtm)}
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
          {/* Modal de Autenticação (Login / Registo) */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            defaultMode={authModalMode}
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
  return (
    <div className={`flex items-center gap-3 ${compact ? "py-0" : "px-6 py-6"}`}>
      <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Banknote className="size-5" strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div className="leading-none">
        <p className="font-display text-[19px] font-bold tracking-[0]">ATM KOTA</p>
        {!compact && <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0] text-muted-foreground">Saiba onde levantar</p>}
      </div>
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
          ? `flex h-[58px] w-full flex-col gap-1 rounded-none px-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`
          : `h-11 w-full justify-start rounded-md px-3 text-sm ${active ? "bg-secondary font-semibold text-primary" : "font-medium text-muted-foreground"}`
      }
      aria-current={active ? "page" : undefined}
      aria-label={mobile ? item.label : undefined}
      onClick={onClick}
    >
      <Icon className={mobile ? "size-[19px]" : "size-[18px]"} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
      {item.label}
    </Button>
  );
}

function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0] text-primary">{eyebrow}</p>
      <h1 className="font-display text-3xl font-semibold tracking-[0] sm:text-[34px]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="flex items-start gap-3 border border-status-stale/20 bg-status-stale/10 px-4 py-3.5">
      <CircleHelp className="mt-0.5 size-4 shrink-0 text-status-stale" aria-hidden="true" />
      <p className="text-xs leading-5 text-foreground/80">
        <strong className="font-semibold">Dados de demonstração.</strong> ATM, locais e reportes abaixo são fictícios e não indicam disponibilidade real.
      </p>
    </div>
  );
}

function HomeView({
  query,
  setQuery,
  visibleAtms,
  onLocation,
  locationMessage,
  onMap,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: {
  query: string;
  setQuery: (value: string) => void;
  visibleAtms: AtmData[];
  onLocation: () => void;
  locationMessage: string;
  onMap: () => void;
  onSelect: (atm: AtmData) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const counts = [
    { key: "available", label: "Com dinheiro", amount: 1, icon: ArrowUpRight },
    { key: "no-cash", label: "Sem dinheiro", amount: 1, icon: ArrowDownRight },
    { key: "out-of-service", label: "Fora de serviço", amount: 1, icon: X },
    { key: "stale", label: "Sem informação recente", amount: 1, icon: Clock3 },
  ] as const;

  return (
    <>
      <section className="relative mb-8 grid min-h-[300px] overflow-hidden rounded-md bg-primary text-primary-foreground md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 flex flex-col items-start justify-center px-6 py-8 sm:px-9 md:px-10 md:py-10">
          <Badge variant="outline" className="mb-5 rounded-sm border-primary-foreground/30 bg-primary-foreground/10 px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
            <MapPin className="mr-1.5 size-3" aria-hidden="true" /> LUANDA · {hasSupabase ? "DADOS REAIS" : "VERSÃO DE DEMONSTRAÇÃO"}
          </Badge>
          <h1 className="max-w-xl font-display text-3xl font-semibold leading-tight tracking-[0] sm:text-4xl">
            Saiba onde levantar. <span className="text-brand-lime">Poupe tempo.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/75">
            Consulte reportes comunitários sobre ATM e disponibilidade de dinheiro.
          </p>
          <div className="mt-6 flex w-full max-w-lg flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Onde pretendes levantar dinheiro?"
                aria-label="Pesquisar ATM por nome, banco ou bairro"
                className="h-11 rounded-md border-primary-foreground/20 bg-background pl-10 text-foreground placeholder:text-muted-foreground"
              />
            </label>
            <Button variant="secondary" className="h-11 shrink-0 rounded-md bg-brand-lime px-4 text-brand-ink hover:bg-brand-lime/90" onClick={onLocation}>
              <Crosshair className="size-4" aria-hidden="true" />
              Usar a minha localização
            </Button>
          </div>
          {locationMessage && <p role="status" className="mt-2 text-xs leading-5 text-primary-foreground/80">{locationMessage}</p>}
        </div>
        <div className="relative hidden min-h-[300px] md:block">
          <img src={atmPhoto} alt="Imagem ilustrativa de uma caixa automática genérica, sem ligação a um banco real" width={1024} height={768} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/35 to-transparent" />
          <span className="absolute bottom-4 right-4 border border-background/40 bg-foreground/80 px-2 py-1 text-[10px] text-background">Imagem ilustrativa · não representa ATM real</span>
        </div>
        <div className="absolute inset-0 md:hidden">
          <img src={atmPhoto} alt="Imagem ilustrativa de uma caixa automática genérica, sem ligação a um banco real" width={1024} height={768} className="size-full object-cover opacity-15" />
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
}: {
  query: string;
  setQuery: (value: string) => void;
  filter: Filter;
  setFilter: (value: Filter) => void;
  visibleAtms: AtmData[];
  onSelect: (atm: AtmData) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <>
      <PageHeading eyebrow="Encontra um ATM" title="Pesquisar" text={hasSupabase ? "Procura por banco, identificação ou zona." : "Procura por banco, identificação ou zona. Nesta versão, os resultados são apenas exemplos fictícios."} />
      {!hasSupabase && <div className="mb-5"><DemoNotice /></div>}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={hasSupabase ? "Banco, ATM ou localização" : "Banco, ATM ou localização fictícia"} className="h-11 rounded-md pl-10" aria-label="Pesquisar ATM" />
        </label>
        <label className="flex h-11 items-center gap-2 border border-input bg-background px-3 text-sm">
          <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Filtrar disponibilidade</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="h-full min-w-40 bg-transparent text-sm outline-none">
            <option value="all">Todos os estados</option>
            <option value="available">Reportado com dinheiro</option>
            <option value="no-cash">Reportado sem dinheiro</option>
            <option value="out-of-service">Fora de serviço</option>
            <option value="stale">Informação desactualizada</option>
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
}: {
  atms: AtmData[];
  onSelect: (atm: AtmData) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Explorar a cidade"
        title="Mapa de Luanda"
        text="Consulta a disponibilidade de caixas automáticos em tempo real. Clica nos marcadores para traçar rota ou avaliar."
      />
      <InteractiveMap atms={atms} onSelectAtm={onSelect} />
    </>
  );
}

function FavoritesView({
  atms,
  favoriteIds,
  onSelect,
  onToggleFavorite,
  onExplore,
}: {
  atms: AtmData[];
  favoriteIds: string[];
  onSelect: (atm: AtmData) => void;
  onToggleFavorite: (id: string) => void;
  onExplore: () => void;
}) {
  const favoriteAtms = useMemo(
    () => atms.filter((atm) => favoriteIds.includes(atm.id)),
    [atms, favoriteIds]
  );

  return (
    <>
      <PageHeading
        eyebrow="Os teus ATMs"
        title="Favoritos"
        text="Acede rapidamente aos ATMs que consultas com mais frequência em Luanda."
      />

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
  const { user, profile, isAdmin, signOut, loading } = useAuth();
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
                  {isAdmin && (
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Membro da rede colaborativa ATM KOTA
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
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <UserRound className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Entra na comunidade ATM KOTA</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Cria uma conta ou inicia sessão para submeter novos ATMs de Luanda, reportar disponibilidade de dinheiro e guardar os teus favoritos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAuth("login")}
                className="flex-1 sm:flex-initial text-xs font-semibold"
              >
                <LogIn className="mr-1.5 size-3.5" />
                Iniciar Sessão
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenAuth("register")}
                className="flex-1 sm:flex-initial text-xs font-semibold"
              >
                Criar Conta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Secção: Painel de Moderação (Admin) */}
      <div className="mb-6 rounded-lg border border-primary/25 bg-primary/5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">Painel de Moderação</p>
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                Administrador
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Revê as sugestões de novos ATMs enviadas pelos cidadãos, verifica no Google Maps e aprova a publicação.
            </p>
            <Button className="mt-4 rounded-md font-semibold" onClick={onOpenAdmin}>
              <ShieldCheck className="mr-1.5 size-4" />
              Abrir Painel de Moderação
            </Button>
          </div>
        </div>
      </div>

      {/* Secção: Submeter ATM */}
      <div className="mb-6 border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <PlusCircle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Submeter um ATM</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Conheces um ATM que não está na lista? Submete-o para aprovação e ajuda a comunidade.
            </p>
            <Button variant="outline" className="mt-4 rounded-md" onClick={onSubmitAtm}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Submeter ATM
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
