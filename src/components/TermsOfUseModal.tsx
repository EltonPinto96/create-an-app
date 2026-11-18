import { X, Users, AlertTriangle, Scale, Heart, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TermsOfUseModalProps {
  onClose: () => void;
}

export function TermsOfUseModal({ onClose }: TermsOfUseModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Termos de Uso"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteúdo */}
      <div className="relative z-10 w-full sm:max-w-xl bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full p-1.5 bg-[#C09A5B]/15">
              <Scale className="size-4 text-[#C09A5B]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-sora">
                Termos de Uso Comunitário
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Kusanga Kitadi · Plataforma Colaborativa de ATM em Luanda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 text-sm text-foreground">
          {/* Introdução */}
          <div className="rounded-xl border border-[#26362F]/20 bg-[#26362F]/5 p-4">
            <p className="text-[13px] font-semibold text-[#26362F]">
              A força está na ligação. Usa a plataforma com responsabilidade.
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              O Kusanga Kitadi é uma plataforma de informação comunitária e colaborativa que
              agrega reportes voluntários de cidadãos sobre a disponibilidade de caixas
              automáticos (ATM) em Luanda, Angola. Ao utilizar a plataforma, aceitas os
              presentes Termos de Uso.
            </p>
          </div>

          {/* 1. Natureza da Plataforma */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-[#26362F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F]">
                1. Natureza da Informação
              </h3>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mb-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">⚠ Aviso Importante:</strong> Toda a
                informação disponível no Kusanga Kitadi é gerada por utilizadores voluntários
                da comunidade. O Kusanga Kitadi{" "}
                <strong className="text-foreground">
                  não garante a exactidão, actualidade ou completude
                </strong>{" "}
                dos dados sobre disponibilidade de ATM, estado dos terminais ou níveis de
                fila. Verifica sempre o estado no local antes de te deslocares.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                Os reportes reflectem a experiência pessoal dos utilizadores no momento da
                submissão e podem desactualizar-se rapidamente.
              </li>
              <li>
                O Kusanga Kitadi não tem acordos comerciais com nenhum banco ou instituição
                financeira angolana.
              </li>
              <li>
                A plataforma não é responsável por decisões financeiras tomadas com base
                nos dados comunitários.
              </li>
            </ul>
          </section>

          {/* 2. Regras de Conduta */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="size-4 text-[#26362F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F]">
                2. Regras de Conduta Comunitária
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Para manteres o acesso à plataforma, deves:
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                Submeter reportes <strong className="text-foreground">honestos e actuais</strong>{" "}
                baseados na tua experiência directa.
              </li>
              <li>
                Usar linguagem respeitosa e construtiva nas notas textuais dos reportes.
              </li>
              <li>
                Reportar ATM que realmente visitaste — não especules sobre locais
                que não conheces.
              </li>
              <li>
                Utilizar a funcionalidade de reporte de problemas para assinalar informação
                incorrecta ou desactualizada submetida por outros utilizadores.
              </li>
            </ul>
          </section>

          {/* 3. Comportamentos Proibidos */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Ban className="size-4 text-destructive shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-destructive">
                3. Comportamentos Proibidos
              </h3>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
                <li>
                  Submeter reportes falsos, enganosos ou intencionalmente incorrectos.
                </li>
                <li>
                  Usar a plataforma para esquemas de fraude, phishing ou engenharia social.
                </li>
                <li>
                  Solicitar ou recolher dados financeiros sensíveis (PINs, dados de cartões,
                  credenciais bancárias) de outros utilizadores.
                </li>
                <li>
                  Criar múltiplas contas para manipular a reputação comunitária.
                </li>
                <li>
                  Publicar conteúdo ofensivo, discriminatório ou violador da lei angolana.
                </li>
                <li>
                  Utilizar bots, scripts ou meios automatizados para submeter reportes em
                  volume.
                </li>
              </ul>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Infracções graves resultam em suspensão permanente da conta e podem ser
              reportadas às autoridades competentes angolanas.
            </p>
          </section>

          {/* 4. Aviso de Segurança Financeira */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-[#C09A5B] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C09A5B]">
                4. Aviso de Segurança Financeira
              </h3>
            </div>
            <div className="rounded-lg border border-[#C09A5B]/30 bg-[#C09A5B]/5 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                O Kusanga Kitadi{" "}
                <strong className="text-foreground">nunca solicitará</strong> o teu PIN bancário,
                número de cartão, CVV, passwords bancárias ou qualquer credencial financeira.
                Nenhum representante da plataforma tem legitimidade para pedir estes dados.
                Em caso de dúvida, contacta directamente o teu banco. A tua segurança
                financeira é inegociável.
              </p>
            </div>
          </section>

          {/* 5. Propriedade dos Conteúdos */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F] mb-2">
              5. Propriedade dos Conteúdos e Licença
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao submeter um reporte ou nota, concedes ao Kusanga Kitadi uma licença não
              exclusiva, gratuita e revogável para exibir e agregar anonimamente esse
              conteúdo para fins informativos comunitários. Manténs todos os direitos
              sobre o conteúdo original e podes solicitar a sua eliminação a qualquer momento.
            </p>
          </section>

          {/* 6. Modificações */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F] mb-2">
              6. Modificações aos Termos
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O Kusanga Kitadi reserva-se o direito de actualizar estes Termos de Uso. As
              alterações serão comunicadas através da aplicação com antecedência mínima de
              15 dias. A continuação do uso após a data de entrada em vigor constitui
              aceitação das modificações.
            </p>
          </section>

          {/* Lei aplicável */}
          <div className="text-[11px] text-muted-foreground/70 border-t border-border pt-3">
            Lei aplicável: República de Angola. Foro competente: Tribunal Provincial de Luanda.
            Versão: Novembro 2024 — Kusanga Kitadi, Luanda, Angola.
          </div>
        </div>

        {/* Acção */}
        <div className="shrink-0 px-5 py-3 border-t border-border">
          <Button
            onClick={onClose}
            className="w-full bg-[#26362F] hover:bg-[#26362F]/90 text-white font-semibold text-sm"
          >
            Li e Aceito — Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
