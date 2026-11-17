import { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Crosshair,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KusangaSymbol } from "@/components/KusangaLogo";
import { useAuth } from "@/lib/auth-context";
import { hasSupabase } from "@/lib/supabase";

interface AuthGatePortalProps {
  onOpenEmailAuth: (mode: "login" | "register") => void;
  onBypassDev?: () => void;
}

export function AuthGatePortal({ onOpenEmailAuth, onBypassDev }: AuthGatePortalProps) {
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocorreu um erro ao conectar com a conta Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#F7F4EC] text-[#26362F] selection:bg-[#C09A5B]/30 overflow-x-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-[#C09A5B]/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -left-40 size-80 rounded-full bg-[#26362F]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Cabeçalho da Apresentação */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#26362F] shadow-md shadow-[#26362F]/15 border border-[#C09A5B]/40">
            <KusangaSymbol size={28} />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-[#26362F]">
              KUSANGA <span className="text-[#C09A5B]">KITADI</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[#718477] font-semibold">
              Luanda · Angola
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenEmailAuth("login")}
            className="text-xs font-semibold text-[#26362F] hover:bg-[#26362F]/5 rounded-lg"
          >
            Já tens conta? Entrar
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal / Hero Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-3xl mx-auto grid gap-8 lg:grid-cols-12 items-center">
          
          {/* Coluna Esquerda: Mensagem e Proposta de Valor */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C09A5B]/40 bg-[#C09A5B]/10 px-3 py-1 text-xs font-bold text-[#8B6328]">
              <Sparkles className="size-3.5 text-[#C09A5B]" />
              Rede Comunitária de Caixas Automáticos
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#26362F] leading-tight">
                A força está na ligação.{" "}
                <span className="text-[#C09A5B] block sm:inline">Saiba onde levantar.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#343D3A] leading-relaxed max-w-xl mx-auto lg:mx-0">
                Localiza caixas automáticos com numerário em Luanda, evita filas desnecessárias e consulta 
                reportes confirmados pela comunidade em tempo real.
              </p>
            </div>

            {/* Benefícios Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              <div className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-white/60 p-3 shadow-xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#26362F]/10 text-[#26362F]">
                  <Banknote className="size-4 text-[#26362F]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26362F]">Notas Disponíveis</p>
                  <p className="text-[11px] text-[#718477]">Sabe se tem notas de 2.000 ou 5.000 Kz antes de ir.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-white/60 p-3 shadow-xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#C09A5B]/15 text-[#8B6328]">
                  <Clock className="size-4 text-[#8B6328]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26362F]">Tempo de Fila</p>
                  <p className="text-[11px] text-[#718477]">Estimativa de espera reportada por quem já levantou.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-white/60 p-3 shadow-xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#26362F]/10 text-[#26362F]">
                  <Crosshair className="size-4 text-[#26362F]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26362F]">Perto de Mim</p>
                  <p className="text-[11px] text-[#718477]">Ordenação imediata por distância a partir do teu GPS.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-black/5 bg-white/60 p-3 shadow-xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#C09A5B]/15 text-[#8B6328]">
                  <Users className="size-4 text-[#8B6328]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26362F]">Colaboração Real</p>
                  <p className="text-[11px] text-[#718477]">Informação verificada e actualizada por cidadãos.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Cartão de Acesso Obrigatório */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border-2 border-[#C09A5B]/30 bg-white p-6 sm:p-7 shadow-xl shadow-[#26362F]/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-[#C09A5B]/10 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#26362F] text-[#C09A5B]">
                  <Lock className="size-4" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-[#26362F]">
                    Acesso Exclusivo para Membros
                  </h2>
                  <p className="text-[11px] text-[#718477]">
                    Inicia sessão para consultar os caixas e estados.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed mb-5">
                <div className="flex gap-2">
                  <ShieldCheck className="size-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Para assegurar a <strong>qualidade dos dados</strong> e prevenir abusos, 
                    o acesso ao mapa e aos caixas exige autenticação.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 mb-4">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-3">
                {/* Botão Google (1-Clique) */}
                <Button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full h-12 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold border border-neutral-300 shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
                >
                  {googleLoading ? (
                    <Loader2 className="size-4 animate-spin text-neutral-600" />
                  ) : (
                    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>Entrar com a Conta Google</span>
                </Button>

                {/* Divisor */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-black/10 w-full" />
                  <span className="bg-white px-3 text-[11px] uppercase font-bold text-muted-foreground shrink-0">
                    ou
                  </span>
                  <div className="border-t border-black/10 w-full" />
                </div>

                {/* Botão Email */}
                <Button
                  onClick={() => onOpenEmailAuth("login")}
                  variant="outline"
                  className="w-full h-11 rounded-xl border-[#26362F]/30 text-[#26362F] hover:bg-[#26362F]/5 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Mail className="size-4" />
                  <span>Entrar com Email e Palavra-passe</span>
                </Button>

                {/* Botão Criar Conta Nova */}
                <Button
                  onClick={() => onOpenEmailAuth("register")}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#26362F] to-[#1C2923] hover:from-[#2D4037] hover:to-[#26362F] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Criar Nova Conta Gratuita</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>

              {/* Botão de Bypass de Demonstração (apenas em desenvolvimento ou se Supabase não estiver configurado) */}
              {(!hasSupabase || import.meta.env.DEV) && onBypassDev && (
                <div className="mt-4 pt-3 border-t border-dashed border-border text-center">
                  <button
                    type="button"
                    onClick={onBypassDev}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
                  >
                    Ambiente Dev: Explorar em Modo Demonstração
                  </button>
                </div>
              )}

              <p className="mt-4 text-[10px] text-center text-muted-foreground">
                Ao continuar, concordas com os termos comunitários de Luanda e com o compromisso de reportar 
                informações verídicas.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Rodapé da Apresentação */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718477]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Serviço Comunitário Activo em Luanda, Angola</span>
        </div>
        <p className="text-[11px]">
          © {new Date().getFullYear()} KUSANGA KITADI. A força está na ligação.
        </p>
      </footer>
    </div>
  );
}
