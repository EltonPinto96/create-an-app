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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);

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

  function handleSwitchMode(newMode: "login" | "register") {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validações básicas
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor, introduz um endereço de email válido.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setErrorMessage("As palavras-passe não coincidem.");
        return;
      }
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
            setErrorMessage("Já existe uma conta registada com este endereço de email.");
          } else {
            setErrorMessage(error.message);
          }
        } else {
          if (requiresEmailConfirmation) {
            setSuccessMessage(
              "Conta criada! Enviámos um email de confirmação. Por favor, verifica a tua caixa de entrada."
            );
          } else {
            setSuccessMessage("Conta criada com sucesso! Bem-vindo ao ATM KOTA.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {mode === "login" ? (
              <KeyRound className="size-6" />
            ) : (
              <User className="size-6" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Entrar no ATM KOTA" : "Criar Nova Conta"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login"
              ? "Inicia sessão para gerir favoritos e reportar ATMs."
              : "Junta-te à comunidade e ajuda os cidadãos de Luanda."}
          </p>
        </div>

        {/* Abas Alternadoras */}
        <div className="mb-5 flex rounded-lg bg-secondary p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitchMode("login")}
            className={`flex-1 rounded-md py-1.5 transition-all ${
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Iniciar Sessão
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("register")}
            className={`flex-1 rounded-md py-1.5 transition-all ${
              mode === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Alertas de Erro ou Sucesso */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-status-available/20 bg-status-available/10 p-3 text-xs text-status-available">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{successMessage}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium">
                Nome ou Alcunha
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Ex: Elton Pinto"
                  className="pl-9 text-sm"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="authEmail" className="text-xs font-medium">
              Endereço de Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="authEmail"
                type="email"
                placeholder="nome@exemplo.com"
                required
                className="pl-9 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="authPassword" className="text-xs font-medium">
              Palavra-passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="authPassword"
                type="password"
                placeholder="Mínimo de 6 caracteres"
                required
                className="pl-9 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">
                Confirmar Palavra-passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repete a palavra-passe"
                  required
                  className="pl-9 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-semibold mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {mode === "login" ? "A autenticar..." : "A criar conta..."}
              </>
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Registar e Continuar"
            )}
          </Button>
        </form>

        {/* Rodapé / Alternância rápida */}
        <div className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <p>
              Ainda não tens conta?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("register")}
                className="font-semibold text-primary hover:underline"
              >
                Regista-te grátis
              </button>
            </p>
          ) : (
            <p>
              Já tens conta?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className="font-semibold text-primary hover:underline"
              >
                Inicia sessão
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
