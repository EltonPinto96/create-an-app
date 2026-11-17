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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase, hasSupabase } from "@/lib/supabase";
import { KusangaSymbol } from "@/components/KusangaLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register" | "recovery";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const { signIn, signUp } = useAuth();
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

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor, introduz um endereço de email válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A palavra-passe deve ter pelo menos 6 caracteres.");
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
            setErrorMessage("Credenciais inválidas. Verifica o email e a palavra-passe.");
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
      } else {
        const { error, requiresEmailConfirmation } = await signUp(
          email.trim(),
          password,
          displayName.trim() || undefined
        );

        if (error) {
          if (error.message.includes("User already registered")) {
            setErrorMessage("Já existe uma conta com este email. Experimenta iniciar sessão.");
          } else {
            setErrorMessage(error.message);
          }
        } else {
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
        <div className="mb-6 text-center">
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
              ? "Inicia sessão para guardar favoritos e avaliar caixas."
              : mode === "register"
              ? "A força está na ligação. Junta-te à comunidade de Luanda."
              : "Introduz o teu email para redefinir o acesso à tua conta."}
          </p>
        </div>

        {/* Abas Alternadoras (Apenas Login / Registo) */}
        {mode !== "recovery" && (
          <div className="mb-5 flex rounded-xl bg-secondary/70 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 rounded-lg py-2 transition-all ${
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
              className={`flex-1 rounded-lg py-2 transition-all ${
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                A processar...
              </>
            ) : mode === "login" ? (
              "Iniciar Sessão"
            ) : mode === "register" ? (
              "Criar Conta"
            ) : (
              "Enviar Link de Recuperação"
            )}
          </Button>
        </form>

        {/* Rodapé institucional */}
        <div className="mt-5 text-center text-[10px] text-muted-foreground border-t border-border/60 pt-3">
          <p className="font-semibold text-[#C09A5B]">KUSANGA KITADI</p>
          <p className="italic">A força está na ligação. Saiba onde levantar.</p>
        </div>
      </div>
    </div>
  );
}
