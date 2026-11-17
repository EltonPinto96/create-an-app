import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---- Validação ----
const submitAtmSchema = z.object({
  bank: z.string().min(1, "Seleccione um banco"),
  name: z.string().min(2, "O nome/identificação é obrigatório"),
  address: z.string().min(5, "O endereço é obrigatório"),
  municipality: z.string().min(1, "Seleccione um município"),
  neighborhood: z.string().optional(),
  maps_url: z
    .string()
    .url("Introduza um link Google Maps válido")
    .refine(
      (v) => v.includes("google") || v.includes("maps.app.goo.gl"),
      "O link deve ser do Google Maps",
    ),
});

export type SubmitAtmFormData = z.infer<typeof submitAtmSchema>;

const BANKS = [
  "Banco Atlântico",
  "BFA — Banco de Fomento Angola",
  "BIC — Banco BIC",
  "BAI — Banco Angolano de Investimentos",
  "Millennium Atlântico",
  "BPC — Banco de Poupança e Crédito",
  "Banco Económico",
  "BCGTA",
  "SOL Banco",
  "Outro",
];

const MUNICIPALITIES = [
  "Belas",
  "Cacuaco",
  "Cazenga",
  "Icolo e Bengo",
  "Kilamba Kiaxi",
  "Luanda",
  "Maianga",
  "Rangel",
  "Sambizanga",
  "Talatona",
  "Viana",
];

interface SubmitAtmFormProps {
  /** Chamado com os dados quando o formulário é enviado com sucesso.
   *  Deve enviar para Supabase e retornar uma Promise. */
  onSubmit: (data: SubmitAtmFormData) => Promise<void>;
  onCancel?: () => void;
}

export function SubmitAtmForm({ onSubmit, onCancel }: SubmitAtmFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubmitAtmFormData>({
    resolver: zodResolver(submitAtmSchema),
  });

  async function handleFormSubmit(data: SubmitAtmFormData) {
    setServerError(null);
    try {
      await onSubmit(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CircleCheck className="size-12 text-status-available" aria-hidden="true" />
        <div>
          <p className="font-semibold">ATM enviado com sucesso!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O ATM será activado após aprovação do administrador.
          </p>
        </div>
        <Button variant="outline" className="rounded-md" onClick={() => setSubmitted(false)}>
          Submeter outro ATM
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-5">
      {/* Aviso */}
      <div className="flex items-start gap-3 border border-primary/20 bg-primary/5 px-4 py-3.5">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-5 text-foreground/80">
          O ATM será activado após aprovação do administrador. Os dados serão verificados antes de aparecerem publicamente.
        </p>
      </div>

      {/* Banco */}
      <div className="space-y-1.5">
        <Label htmlFor="bank">
          Banco <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <select
          id="bank"
          {...register("bank")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Seleccione um banco</option>
          {BANKS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {errors.bank && <p className="text-xs text-destructive">{errors.bank.message}</p>}
      </div>

      {/* Nome / Identificação */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Nome / Identificação do ATM <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="ex: ATM Center MDC"
          className="rounded-md"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Endereço */}
      <div className="space-y-1.5">
        <Label htmlFor="address">
          Endereço <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="ex: Avenida Fidel de Castro Ruz, MDC Shopping Via Express"
          className="rounded-md"
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
      </div>

      {/* Município */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="municipality">
            Município <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <select
            id="municipality"
            {...register("municipality")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Seleccione</option>
            {MUNICIPALITIES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {errors.municipality && <p className="text-xs text-destructive">{errors.municipality.message}</p>}
        </div>

        {/* Bairro */}
        <div className="space-y-1.5">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            {...register("neighborhood")}
            placeholder="ex: Kicuxi"
            className="rounded-md"
          />
        </div>
      </div>

      {/* Link Google Maps */}
      <div className="space-y-1.5">
        <Label htmlFor="maps_url">
          Link Google Maps <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="maps_url"
          type="url"
          {...register("maps_url")}
          placeholder="https://maps.app.goo.gl/..."
          className="rounded-md"
        />
        <p className="text-[11px] text-muted-foreground">
          Abra o ATM no Google Maps, toque em "Partilhar" e copie o link.
        </p>
        {errors.maps_url && <p className="text-xs text-destructive">{errors.maps_url.message}</p>}
      </div>

      {/* Erro de servidor */}
      {serverError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {serverError}
        </div>
      )}

      {/* Acções */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1 rounded-md" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-md">
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? "A enviar…" : "Submeter ATM"}
        </Button>
      </div>
    </form>
  );
}
