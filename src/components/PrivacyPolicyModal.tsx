import { X, Shield, Lock, Eye, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Política de Privacidade"
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
            <div className="rounded-full p-1.5 bg-[#26362F]/10">
              <Shield className="size-4 text-[#26362F]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-sora">
                Política de Privacidade
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Kusanga Kitadi · Vigente desde Novembro 2024
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
          <div className="rounded-xl border border-[#C09A5B]/30 bg-[#C09A5B]/5 p-4">
            <p className="text-[13px] font-semibold text-[#26362F]">
              A tua privacidade é a nossa responsabilidade.
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              O Kusanga Kitadi é uma plataforma comunitária angolana de localização de caixas
              automáticos (ATM) em Luanda. Esta política descreve de forma clara e transparente
              como recolhemos, utilizamos e protegemos os teus dados pessoais, em conformidade
              com a Lei n.º 22/11 de 17 de Junho (Lei de Protecção de Dados Pessoais de Angola)
              e com os princípios gerais do RGPD.
            </p>
          </div>

          {/* 1. Dados Recolhidos */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="size-4 text-[#26362F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F]">
                1. Dados que Recolhemos
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-foreground">Conta Google:</strong> nome de exibição,
                endereço de e-mail e foto de perfil — fornecidos exclusivamente pela autenticação
                OAuth da Google, com o teu consentimento explícito.
              </li>
              <li>
                <strong className="text-foreground">Reportes Comunitários:</strong> estado do ATM,
                disponibilidade de dinheiro, nível de fila e notas textuais que submetes
                voluntariamente sobre caixas automáticos.
              </li>
              <li>
                <strong className="text-foreground">Localização (opcional):</strong> coordenadas
                GPS para ordenar os ATM por proximidade — apenas quando autorizas o acesso no
                dispositivo. Não são armazenadas no servidor.
              </li>
              <li>
                <strong className="text-foreground">Favoritos:</strong> lista de ATM que marcas
                para acompanhamento, sincronizada com a tua conta.
              </li>
            </ul>
          </section>

          {/* 2. O que NUNCA Recolhemos */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="size-4 text-[#26362F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F]">
                2. O que NUNCA Recolhemos
              </h3>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                O Kusanga Kitadi{" "}
                <strong className="text-destructive">nunca solicitará</strong> nem armazenará:
                PINs bancários, dados de cartões de débito ou crédito, credenciais bancárias,
                saldos de conta, histórico de transacções ou qualquer informação financeira
                sensível. Se alguma vez te for pedido este tipo de informação num contexto
                associado ao Kusanga Kitadi,{" "}
                <strong className="text-destructive">não forneças — é fraude</strong>.
              </p>
            </div>
          </section>

          {/* 3. Como Utilizamos os Dados */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-4 text-[#26362F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F]">
                3. Como Utilizamos os Teus Dados
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
              <li>Autenticação segura e identificação da conta na plataforma.</li>
              <li>
                Exibição do teu nome e foto de perfil dentro da aplicação, apenas para ti.
              </li>
              <li>
                Associação dos teus reportes comunitários ao teu perfil, para moderação de
                qualidade e prevenção de spam.
              </li>
              <li>Sincronização da lista de ATM favoritos entre dispositivos.</li>
              <li>
                Geração de estatísticas anónimas e agregadas sobre a rede de ATM em Luanda
                (sem identificação individual).
              </li>
            </ul>
          </section>

          {/* 4. Partilha com Terceiros */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F] mb-2">
              4. Partilha com Terceiros
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Os teus dados <strong className="text-foreground">não são vendidos</strong> nem
              partilhados com terceiros para fins comerciais. Utilizamos os seguintes
              subprocessadores de confiança, exclusivamente para o funcionamento da plataforma:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">Supabase (PostgreSQL):</strong> base de dados
                e autenticação, com servidores na região da Europa.
              </li>
              <li>
                <strong className="text-foreground">Cloudflare:</strong> alojamento e distribuição
                global da aplicação web.
              </li>
              <li>
                <strong className="text-foreground">Google OAuth:</strong> autenticação — apenas o
                identificador único, e-mail e nome.
              </li>
            </ul>
          </section>

          {/* 5. Os Teus Direitos */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="size-4 text-[#26362F] shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F]">
                5. Os Teus Direitos
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Em conformidade com a legislação angolana e o RGPD, tens direito a:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
              <li>Aceder aos teus dados pessoais armazenados.</li>
              <li>Corrigir informações incorrectas.</li>
              <li>
                Solicitar a eliminação completa da tua conta e de todos os dados associados
                (através do botão «Eliminar Conta» no teu Perfil).
              </li>
              <li>Opor-te ao tratamento dos teus dados a qualquer momento.</li>
            </ul>
          </section>

          {/* 6. Contacto */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#26362F] mb-2">
              6. Contacto do Responsável pelo Tratamento
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para questões sobre privacidade, exercício dos teus direitos ou reclamações,
              contacta a equipa do Kusanga Kitadi através do endereço:{" "}
              <strong className="text-foreground">privacidade@kusanga-kitadi.ao</strong>.
              Comprometemo-nos a responder no prazo máximo de 15 dias úteis.
            </p>
          </section>

          {/* Rodapé legal */}
          <div className="text-[11px] text-muted-foreground/70 border-t border-border pt-3">
            Última actualização: Novembro 2024 · Kusanga Kitadi é um projecto comunitário
            independente, sem fins lucrativos. Esta política pode ser actualizada; a data de
            vigência acima será actualizada em conformidade.
          </div>
        </div>

        {/* Acção */}
        <div className="shrink-0 px-5 py-3 border-t border-border">
          <Button
            onClick={onClose}
            className="w-full bg-[#26362F] hover:bg-[#26362F]/90 text-white font-semibold text-sm"
          >
            Compreendido — Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
