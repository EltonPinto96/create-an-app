import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  User,
  X,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase, hasSupabase } from "@/lib/supabase";
import { KusangaSymbol } from "@/components/KusangaLogo";
import { recordNewUserRegistration } from "@/lib/user-registration-notifications";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register" | "recovery";
  requiredReason?: string | null;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
  requiredReason,
}: AuthModalProps) {
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "recovery">(defaultMode);

  // Campos do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  function resetForm() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleSwitchMode(newMode: "login" | "register" | "recovery") {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erro ao conectar com o Google.");
      setLoading(false);
    }
  }

  async function handlePasswordRecovery(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Introduz um endereço de email válido para recuperar a palavra-passe.");
      return;
    }

    setLoading(true);
    if (!hasSupabase) {
      setErrorMessage("Autenticação não configurada. Define as variáveis de ambiente do Supabase.");
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Instruções de recuperação enviadas para o teu email.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao pedir recuperação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "recovery") {
      return handlePasswordRecovery(e);
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validações básicas
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor introduz um email válido.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("A palavra-passe deve conter pelo menos 6 caracteres.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setErrorMessage("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErrorMessage("Email ou palavra-passe incorretos. Verifica os teus dados.");
          } else {
            setErrorMessage(error.message);
          }
        } else {
          setSuccessMessage("Sessão iniciada com sucesso!");
          setTimeout(() => {
            resetForm();
            onClose();
          }, 600);
        }
      } else if (mode === "register") {
        const { error, requiresEmailConfirmation } = await signUp(
          email.trim(),
          password,
          displayName.trim()
        );

        if (error) {
          if (error.message.includes("User already registered")) {
            setErrorMessage("Este email já se encontra registado. Experimenta iniciar sessão.");
          } else {
            setErrorMessage(error.message);
          }
        } else {
          // Registar notificação de cadastro para os Administradores e Moderadores
          recordNewUserRegistration({
            userEmail: email.trim(),
            userName: displayName.trim(),
            provider: "email",
          });

          if (requiresEmailConfirmation) {
            setSuccessMessage(
              "Conta criada! Enviámos um email de confirmação. Por favor, verifica a tua caixa de entrada."
            );
          } else {
            setSuccessMessage("Conta criada com sucesso! Bem-vindo ao Kusanga Kitadi.");
            setTimeout(() => {
              resetForm();
              onClose();
            }, 800);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-xs p-4 animate-in fade-in-50">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>

        {/* Cabeçalho com Símbolo Oficial Kusanga Kitadi */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center">
            <KusangaSymbol size={48} />
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            {mode === "login"
              ? "Entrar no Kusanga Kitadi"
              : mode === "register"
              ? "Criar Conta no Kusanga Kitadi"
              : "Recuperar Palavra-passe"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login"
              ? "Inicia sessão para reportar disponibilidade e aceder a todos os recursos."
              : mode === "register"
              ? "A força está na ligação. Junta-te à comunidade em Luanda."
              : "Introduz o teu email para redefinir o acesso à tua conta."}
          </p>
        </div>

        {/* Aviso de Autenticação Obrigatória para Contribuição Comunitária */}
        {requiredReason && (
          <div className="mb-4 rounded-2xl border border-[#C09A5B]/40 bg-[#C09A5B]/10 p-3.5 text-xs text-foreground flex items-start gap-2.5">
            <ShieldAlert className="size-4 text-[#C09A5B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#C09A5B] block">Identificação Necessária</span>
              <span className="text-muted-foreground text-[11px] leading-relaxed">
                {requiredReason}
              </span>
            </div>
          </div>
        )}

        {/* Botão de Login com o Google (Destaque Principal) */}
        {mode !== "recovery" && (
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 rounded-2xl border-border/80 bg-background hover:bg-muted font-bold text-xs gap-3 shadow-xs transition-all hover:border-[#C09A5B]/70"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </Button>

            {/* Separador */}
            <div className="relative my-4 flex items-center justify-center text-[10px] uppercase">
              <div className="h-px w-full bg-border/70" />
              <span className="bg-card px-2.5 font-semibold text-muted-foreground whitespace-nowrap">
                ou com email e palavra-passe
              </span>
              <div className="h-px w-full bg-border/70" />
            </div>
          </div>
        )}

        {/* Abas Alternadoras (Apenas Login / Registo) */}
        {mode !== "recovery" && (
          <div className="mb-4 flex rounded-xl bg-secondary/70 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 rounded-lg py-1.5 transition-all ${
                mode === "login"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("register")}
              className={`flex-1 rounded-lg py-1.5 transition-all ${
                mode === "register"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Botão Voltar (em modo recovery) */}
        {mode === "recovery" && (
          <button
            type="button"
            onClick={() => handleSwitchMode("login")}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            <ArrowLeft className="size-3.5" />
            Voltar ao Início de Sessão
          </button>
        )}

        {/* Mensagens de Sucesso e Erro */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-status-available/30 bg-status-available/10 p-3 text-xs text-status-available">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{successMessage}</p>
          </div>
        )}

        {/* Formulário com Email e Password */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div className="space-y-1">
              <Label htmlFor="displayName" className="text-xs font-semibold text-foreground">
                Nome de Apresentação
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Ex: Manuel António"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-9 text-xs h-10 rounded-xl border-border focus:border-[#C09A5B]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="authEmail" className="text-xs font-semibold text-foreground">
              Endereço de Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="authEmail"
                type="email"
                required
                placeholder="nome@exemplo.ao"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs h-10 rounded-xl border-border focus:border-[#C09A5B]"
              />
            </div>
          </div>

          {mode !== "recovery" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="authPassword" className="text-xs font-semibold text-foreground">
                  Palavra-passe
                </Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("recovery")}
                    className="text-[11px] text-[#C09A5B] hover:underline font-semibold"
                  >
                    Esqueceste-te?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="authPassword"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs h-10 rounded-xl border-border focus:border-[#C09A5B]"
                />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                Confirmar Palavra-passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Repete a palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 text-xs h-10 rounded-xl border-border focus:border-[#C09A5B]"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-sm mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                A processar...
              </>
            ) : mode === "login" ? (
              "Iniciar Sessão com Email"
            ) : mode === "register" ? (
              "Criar Conta com Email"
            ) : (
              "Enviar Link de Recuperação"
            )}
          </Button>
        </form>

        {/* Rodapé institucional */}
        <div className="mt-4 text-center text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
          <p className="font-semibold text-[#C09A5B]">KUSANGA KITADI</p>
          <p className="italic">A força está na ligação. Saiba onde levantar.</p>
        </div>
      </div>
    </div>
  );
}
