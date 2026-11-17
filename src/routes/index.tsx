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
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";

import atmPhoto from "@/assets/atm-kota-demo.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoAtms, type DemoAtm, type DemoAvailability } from "@/lib/atm-demo-data";

type Section = "home" | "map" | "search" | "favorites" | "profile";
type Filter = "all" | DemoAvailability;

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
  const [section, setSection] = useState<Section>("home");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [locationMessage, setLocationMessage] = useState("");
  const [selectedAtm, setSelectedAtm] = useState<DemoAtm | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const visibleAtms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-AO");
    return demoAtms.filter((atm) => {
      const matchesText = `${atm.name} ${atm.bank} ${atm.area}`
        .toLocaleLowerCase("pt-AO")
        .includes(needle);
      return matchesText && (filter === "all" || atm.availability === filter);
    });
  }, [filter, query]);

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
              Pré-lançamento
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
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-status-stale" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-9 rounded-md px-3 text-xs sm:inline-flex"
              onClick={() => setSection("profile")}
            >
              <UserRound className="size-4" aria-hidden="true" />
              Entrar em breve
            </Button>
          </div>
        </header>

        <main id="conteudo-principal" className="mx-auto w-full max-w-[1440px] min-w-0 px-4 pb-28 pt-7 sm:px-7 md:pt-9 lg:px-10 lg:pb-12">
          {showInfo && (
            <div role="status" className="mb-5 flex items-start justify-between gap-3 border border-status-stale/25 bg-status-stale/10 px-4 py-3 text-sm">
              <p className="leading-6">Esta versão mostra apenas exemplos fictícios. A consulta de ATM reais será activada quando existir uma lista validada.</p>
              <Button size="icon" variant="ghost" className="size-7 shrink-0" aria-label="Fechar aviso" onClick={() => setShowInfo(false)}><X className="size-4" /></Button>
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
            />
          )}
          {section === "map" && <MapView onSearch={() => setSection("search")} />}
          {section === "favorites" && <AccountView kind="favorites" onProfile={() => setSection("profile")} />}
          {section === "profile" && <AccountView kind="profile" onProfile={() => setShowInfo(true)} />}

          {selectedAtm && (
            <AtmDetails
              atm={selectedAtm}
              onClose={() => setSelectedAtm(null)}
              onAccount={() => {
                setSelectedAtm(null);
                setSection("profile");
              }}
            />
          )}
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
      className={mobile
        ? `flex h-[58px] w-full flex-col gap-1 rounded-none px-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`
        : `h-11 w-full justify-start rounded-md px-3 text-sm ${active ? "bg-secondary font-semibold text-primary" : "font-medium text-muted-foreground"}`}
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
}: {
  query: string;
  setQuery: (value: string) => void;
  visibleAtms: DemoAtm[];
  onLocation: () => void;
  locationMessage: string;
  onMap: () => void;
  onSelect: (atm: DemoAtm) => void;
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
            <MapPin className="mr-1.5 size-3" aria-hidden="true" /> LUANDA · VERSÃO DE DEMONSTRAÇÃO
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
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${statusCopy[key].className}`}><Icon className="size-[18px]" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="font-display text-2xl font-semibold leading-none">{amount}</p><p className="mt-1.5 text-xs leading-4 text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="mb-6"><DemoNotice /></div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0] text-primary">Amostras fictícias</p><h2 className="mt-1 font-display text-xl font-semibold">Reportes de demonstração</h2></div>
          <Button variant="ghost" className="h-9 shrink-0 px-2 text-xs font-semibold text-primary" onClick={onMap}>Abrir mapa <ChevronRight className="size-4" aria-hidden="true" /></Button>
        </div>
        {visibleAtms.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
            {visibleAtms.slice(0, 4).map((atm) => <AtmCard key={atm.id} atm={atm} onClick={() => onSelect(atm)} />)}
          </div>
        ) : <EmptyResults />}
      </section>
    </>
  );
}

function AtmCard({ atm, onClick }: { atm: DemoAtm; onClick: () => void }) {
  const status = statusCopy[atm.availability];
  return (
    <button type="button" className="group flex w-full items-center gap-4 border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 sm:p-5" onClick={onClick}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-md ${status.className}`}><Banknote className="size-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2"><span className="truncate font-semibold">{atm.name}</span><span className="rounded-sm border border-border px-1.5 py-0.5 text-[9px] font-medium uppercase text-muted-foreground">Exemplo</span></span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{atm.bank} · {atm.area}</span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={`font-medium ${status.className}`}>{status.label}</span>
          <span className="text-muted-foreground">{atm.updated}</span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
}

function SearchView({
  query,
  setQuery,
  filter,
  setFilter,
  visibleAtms,
  onSelect,
}: {
  query: string;
  setQuery: (value: string) => void;
  filter: Filter;
  setFilter: (value: Filter) => void;
  visibleAtms: DemoAtm[];
  onSelect: (atm: DemoAtm) => void;
}) {
  return (
    <>
      <PageHeading eyebrow="Encontra um ATM" title="Pesquisar" text="Procura por banco, identificação ou zona. Nesta versão, os resultados são apenas exemplos fictícios." />
      <div className="mb-5"><DemoNotice /></div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Banco, ATM ou localização fictícia" className="h-11 rounded-md pl-10" aria-label="Pesquisar exemplos de ATM" />
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
      <p className="mb-3 text-xs text-muted-foreground">{visibleAtms.length} {visibleAtms.length === 1 ? "exemplo encontrado" : "exemplos encontrados"}</p>
      <div className="grid gap-3 md:grid-cols-2">{visibleAtms.map((atm) => <AtmCard key={atm.id} atm={atm} onClick={() => onSelect(atm)} />)}</div>
      {!visibleAtms.length && <EmptyResults />}
    </>
  );
}

function MapView({ onSearch }: { onSearch: () => void }) {
  return (
    <>
      <PageHeading eyebrow="Explorar a cidade" title="Mapa" text="Encontra caixas automáticas perto de ti — quando a lista validada de ATM estiver disponível." />
      <DemoNotice />
      <div className="mt-5 grid min-h-[350px] place-items-center border border-border bg-secondary/60 px-5 py-12 text-center">
        <div className="max-w-md">
          <span className="mx-auto flex size-14 items-center justify-center rounded-md bg-background text-primary"><Map className="size-6" aria-hidden="true" /></span>
          <h2 className="mt-4 font-display text-xl font-semibold">Mapa em preparação</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">O mapa real depende da configuração do serviço de mapas e de uma lista validada de ATM. Não mostramos marcadores inventados.</p>
          <Button className="mt-5 rounded-md" onClick={onSearch}><Search className="size-4" aria-hidden="true" />Ver exemplos na pesquisa</Button>
        </div>
      </div>
    </>
  );
}

function AccountView({ kind, onProfile }: { kind: "favorites" | "profile"; onProfile: () => void }) {
  const favorites = kind === "favorites";
  return (
    <>
      <PageHeading eyebrow={favorites ? "Os teus ATM" : "A tua conta"} title={favorites ? "Favoritos" : "Perfil"} text={favorites ? "Guarda os ATM que consultas com frequência." : "Acede ao teu perfil, contribuições e preferências."} />
      <div className="grid min-h-[320px] place-items-center border border-border bg-card px-5 py-12 text-center">
        <div className="max-w-md">
          <span className="mx-auto flex size-14 items-center justify-center rounded-md bg-secondary text-primary">{favorites ? <Heart className="size-6" aria-hidden="true" /> : <UserRound className="size-6" aria-hidden="true" />}</span>
          <h2 className="mt-4 font-display text-xl font-semibold">{favorites ? "Favoritos com conta" : "Conta disponível numa próxima etapa"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{favorites ? "Para guardar e sincronizar favoritos, será necessário iniciar sessão. As contas serão activadas depois da validação desta interface." : "O registo, início de sessão e perfil pessoal serão ligados numa próxima etapa. Ainda não aceitamos palavras-passe neste ecrã."}</p>
          {favorites && <Button variant="outline" className="mt-5 rounded-md" onClick={onProfile}>Ver perfil</Button>}
        </div>
      </div>
    </>
  );
}

function AtmDetails({ atm, onClose, onAccount }: { atm: DemoAtm; onClose: () => void; onAccount: () => void }) {
  const status = statusCopy[atm.availability];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 sm:items-center sm:p-5" role="presentation" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="atm-detail-title" className="w-full max-w-lg border border-border bg-background p-5 shadow-xl sm:p-7" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><Badge variant="outline" className="mb-3 rounded-sm">Amostra fictícia</Badge><h2 id="atm-detail-title" className="font-display text-2xl font-semibold">{atm.name}</h2><p className="mt-1 text-sm text-muted-foreground">{atm.bank}</p></div>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-9" aria-label="Fechar detalhes" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <DemoNotice />
        <dl className="my-5 divide-y divide-border border-y border-border text-sm">
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Localização</dt><dd className="text-right">{atm.area}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Estado do exemplo</dt><dd className={`text-right font-medium ${status.className}`}>{status.label}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Última confirmação fictícia</dt><dd className="text-right">{atm.updated}</dd></div>
          <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Confirmações de exemplo</dt><dd className="text-right">{atm.confirmations}</dd></div>
        </dl>
        <p className="mb-4 text-xs leading-5 text-muted-foreground">As confirmações comunitárias não garantem dinheiro disponível. Estes dados são exclusivamente ilustrativos.</p>
        <Button className="w-full rounded-md" variant="outline" onClick={onAccount}><Heart className="size-4" aria-hidden="true" />Favoritos e reportes chegam com as contas</Button>
      </section>
    </div>
  );
}

function EmptyResults() {
  return <div className="grid min-h-48 place-items-center border border-dashed border-border px-5 py-10 text-center"><div><Search className="mx-auto size-6 text-muted-foreground" aria-hidden="true" /><h3 className="mt-3 text-sm font-semibold">Nenhum exemplo encontrado</h3><p className="mt-1 text-xs text-muted-foreground">Experimenta outra pesquisa ou escolhe outro estado.</p></div></div>;
}