import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  CheckCircle2,
  CircleAlert,
  Clock,
  Loader2,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const reportSchema = z.object({
  statusChoice: z.enum(["success", "no_cash", "broken"], {
    required_error: "Indica se conseguiste levantar dinheiro",
  }),
  notesAvailable: z.string().optional(),
  queueTime: z.enum(["none", "short", "medium", "long"]).optional(),
  comment: z.string().max(250, "Máximo 250 caracteres").optional(),
});

export type SubmitReportFormData = {
  availability: "available" | "no-cash" | "out-of-service";
  withdrew: boolean;
  notesAvailable?: string;
  queueTime?: string;
  comment?: string;
  feedbackSummary: string;
  confirmedAt: string;
};

interface SubmitReportFormProps {
  atmName: string;
  atmBank: string;
  atmArea?: string;
  onSubmit: (data: SubmitReportFormData) => Promise<void>;
  onCancel?: () => void;
}

export function SubmitReportForm({
  atmName,
  atmBank,
  atmArea,
  onSubmit,
  onCancel,
}: SubmitReportFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
    reset,
  } = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      statusChoice: "success",
      queueTime: "short",
    },
  });

  const statusChoice = watch("statusChoice");
  const selectedQueue = watch("queueTime");
  const selectedNotes = watch("notesAvailable");

  async function onFormSubmit(values: z.infer<typeof reportSchema>) {
    setServerError(null);
    try {
      let availability: "available" | "no-cash" | "out-of-service" = "available";
      let withdrew = true;
      let summary = "Levantamento realizado com sucesso";

      if (values.statusChoice === "no_cash") {
        availability = "no-cash";
        withdrew = false;
        summary = "Sem dinheiro no ATM";
      } else if (values.statusChoice === "broken") {
        availability = "out-of-service";
        withdrew = false;
        summary = "ATM fora de serviço / avariado";
      }

      const queueLabels: Record<string, string> = {
        none: "Sem fila",
        short: "Fila < 5 min",
        medium: "Fila 5-15 min",
        long: "Fila > 15 min",
      };

      const parts: string[] = [summary];
      if (values.queueTime && queueLabels[values.queueTime]) {
        parts.push(queueLabels[values.queueTime]);
      }
      if (values.notesAvailable) {
        parts.push(values.notesAvailable);
      }
      if (values.comment?.trim()) {
        parts.push(`"${values.comment.trim()}"`);
      }

      const payload: SubmitReportFormData = {
        availability,
        withdrew,
        notesAvailable: values.notesAvailable,
        queueTime: values.queueTime,
        comment: values.comment?.trim(),
        feedbackSummary: parts.join(" · "),
        confirmedAt: new Date().toISOString(),
      };

      await onSubmit(payload);
      setSubmitted(true);
      reset();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Erro ao enviar avaliação. Tenta novamente.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-status-available/15 text-status-available">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold">Avaliação enviada com sucesso!</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Obrigado pela tua contribuição! A informação já está ativa e vai ajudar os próximos cidadãos a saber onde levantar.
          </p>
        </div>
        <div className="mt-2 flex w-full gap-2">
          {onCancel && (
            <Button className="w-full rounded-md" onClick={onCancel}>
              Fechar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* Cabeçalho do ATM */}
      <div className="rounded-md border border-border bg-card p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Confirmar e Avaliar
        </p>
        <p className="mt-0.5 text-base font-semibold text-foreground">{atmName}</p>
        <p className="text-xs text-muted-foreground">
          {atmBank} {atmArea ? `· ${atmArea}` : ""}
        </p>
      </div>

      {/* Pergunta Principal: Conseguiu levantar? */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Conseguiste levantar dinheiro? <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Opção 1: Sim */}
          <button
            type="button"
            onClick={() => setValue("statusChoice", "success")}
            className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
              statusChoice === "success"
                ? "border-status-available bg-status-available/10 ring-2 ring-status-available/20"
                : "border-border hover:border-primary/40 bg-background"
            }`}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-status-available/20 text-status-available">
              <ThumbsUp className="size-4" />
            </span>
            <span className="text-xs font-semibold text-foreground">Sim, levantei</span>
            <span className="text-[11px] text-muted-foreground">Tem dinheiro disponível</span>
          </button>

          {/* Opção 2: Sem dinheiro */}
          <button
            type="button"
            onClick={() => setValue("statusChoice", "no_cash")}
            className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
              statusChoice === "no_cash"
                ? "border-status-empty bg-status-empty/10 ring-2 ring-status-empty/20"
                : "border-border hover:border-primary/40 bg-background"
            }`}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-status-empty/20 text-status-empty">
              <ThumbsDown className="size-4" />
            </span>
            <span className="text-xs font-semibold text-foreground">Sem dinheiro</span>
            <span className="text-[11px] text-muted-foreground">ATM vazio no momento</span>
          </button>

          {/* Opção 3: Avaria */}
          <button
            type="button"
            onClick={() => setValue("statusChoice", "broken")}
            className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
              statusChoice === "broken"
                ? "border-status-offline bg-status-offline/10 ring-2 ring-status-offline/20"
                : "border-border hover:border-primary/40 bg-background"
            }`}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-status-offline/20 text-status-offline">
              <Wrench className="size-4" />
            </span>
            <span className="text-xs font-semibold text-foreground">Avaria / Fora</span>
            <span className="text-[11px] text-muted-foreground">Ecrã preto ou bloqueado</span>
          </button>
        </div>
      </div>

      {/* Detalhes de notas (se conseguiu levantar) */}
      {statusChoice === "success" && (
        <div className="space-y-2 animate-in fade-in-50 duration-200">
          <Label className="text-xs font-medium text-muted-foreground">
            Que notas estão a sair? (Opcional)
          </Label>
          <div className="flex flex-wrap gap-2">
            {[
              "Notas de 5.000 Kz",
              "Notas de 2.000 e 5.000 Kz",
              "Notas de 1.000 Kz",
              "Notas de 10.000 Kz",
              "Todas as notas",
            ].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setValue("notesAvailable", selectedNotes === option ? "" : option)
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedNotes === option
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border bg-secondary/50 text-foreground hover:bg-secondary"
                }`}
              >
                <Banknote className="mr-1 inline-block size-3" />
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tempo de espera / Fila */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Como estava a fila no local?
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { id: "none", label: "Sem fila", desc: "Direto" },
            { id: "short", label: "< 5 min", desc: "Rápido" },
            { id: "medium", label: "5-15 min", desc: "Moderada" },
            { id: "long", label: "> 15 min", desc: "Fila longa" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setValue("queueTime", item.id as any)}
              className={`flex flex-col items-center rounded-md border p-2 text-center transition-colors ${
                selectedQueue === item.id
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-xs font-semibold">{item.label}</span>
              <span className="text-[10px] opacity-75">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comentário / Observação adicional */}
      <div className="space-y-1.5">
        <Label htmlFor="report-comment" className="text-xs font-medium text-muted-foreground">
          Observação ou dica rápida (Opcional)
        </Label>
        <Input
          id="report-comment"
          {...register("comment")}
          placeholder="Ex: Máquina rápida, segurança presente, luz ligada..."
          className="h-10 text-xs"
        />
      </div>

      {/* Aviso comunitário de expiração */}
      <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          A tua avaliação ficará ativa por <strong className="text-foreground">2 horas</strong> e atualiza imediatamente o estado para quem estiver a caminho.
        </p>
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {serverError}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1 rounded-md" onClick={onCancel}>
            Voltar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-md bg-primary font-semibold text-primary-foreground"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              A enviar...
            </>
          ) : (
            "Enviar confirmação"
          )}
        </Button>
      </div>
    </form>
  );
}
