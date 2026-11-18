import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl font-bold text-[#26362F] font-sora">404</div>
        <div className="mt-3 text-4xl">🗺️</div>
        <h1 className="mt-4 text-xl font-bold text-foreground font-sora">
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Esta rota não existe ou foi movida. Volta ao início para encontrar
          os caixas automáticos perto de ti em Luanda.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#26362F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#26362F]/90"
          >
            Voltar ao Início
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          KUSANGA KITADI · A força está na ligação.
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sora">
          Algo correu mal
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Ocorreu um erro inesperado na aplicação. Podes tentar novamente ou
          regressar ao início. A equipa do Kusanga Kitadi foi notificada.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#26362F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#26362F]/90"
          >
            Tentar Novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Voltar ao Início
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          KUSANGA KITADI · A força está na ligação.
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" },
      { title: "KUSANGA KITADI — A força está na ligação. Saiba onde levantar." },
      { name: "description", content: "A força está na ligação. Saiba onde levantar. Plataforma tecnológica angolana para localizar caixas automáticos (ATM) e disponibilidade de dinheiro em tempo real." },
      { name: "author", content: "Kusanga Kitadi" },
      { name: "theme-color", content: "#26362F" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Kusanga Kitadi" },
      { property: "og:title", content: "KUSANGA KITADI — A força está na ligação" },
      { property: "og:description", content: "A força está na ligação. Saiba onde levantar. Consulte a disponibilidade comunitária de ATM em Angola." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon.svg" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-AO">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.info("[PWA] Service Worker ativo:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Registo do Service Worker falhou:", err);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
