# ATM KOTA — Plano do MVP

## Objectivo
Construir um MVP para o piloto em Luanda que permita consultar ATM e reportes comunitários recentes, sem apresentar dados fictícios como reais.

## Etapas
1. **Interface e navegação:** experiência primeiro para telemóveis, em português de Angola, com Início, Mapa, Pesquisar, Favoritos e Perfil. Conteúdo demonstrativo será claramente identificado.
2. **Contas e dados:** activar Lovable Cloud, criar autenticação por email e palavra-passe, perfis, favoritos, bancos, ATM e reportes; definir acesso público de leitura e regras seguras para utilizadores e administração.
3. **Consulta de ATM:** pesquisa, filtros, localização opcional, ordenação, detalhe do ATM e direcções. Nenhum ATM real será inventado; mapa externo depende da configuração disponível.
4. **Reportes comunitários:** confirmar dinheiro, ausência de dinheiro ou avaria; aplicar validade de 60 minutos, estados incertos, moderação e protecção contra repetição abusiva; actualizar a informação consultada.
5. **Administração:** gestão protegida de bancos, ATM, reportes, denúncias e actividade administrativa, com permissões verificadas no servidor.
6. **Validação e lançamento-piloto:** testar fluxos e estados vazios/erro, rever segurança, desempenho e preparação para publicação.

## Componentes e áreas
- Barra de navegação móvel e navegação adaptada a ecrãs maiores.
- Início com pesquisa, resumo de estados, ATM próximos e actualizações recentes.
- Mapa e filtros; lista de resultados para pesquisa manual.
- Detalhe de ATM com estado, origem, horário, histórico e acções.
- Acesso/conta, perfil, favoritos e histórico de contribuições.
- Área administrativa protegida.

## Decisões já definidas
- Utilizadores podem consultar informação pública sem conta; conta necessária para reportar e guardar favoritos.
- O perfil guarda nome e outros dados necessários; funções/permissões administrativas ficam separadas do perfil.
- Reportes comunitários expiram após 60 minutos e nunca garantem disponibilidade de dinheiro.
- Não inventar locais, endereços, estados ou integrações bancárias.
- A arquitectura é pensada para crescer em Angola e permitir futura conversão móvel.

## Dependências e limites
- Lovable Cloud será necessário para autenticação, dados persistentes e actualizações.
- Google Maps/Mapbox requer configuração do serviço; sem ela, manter pesquisa manual e indicar claramente a limitação.
- A lista inicial de ATM reais precisa de uma fonte validada; até lá, quaisquer exemplos serão rotulados como demonstração.
- O painel administrativo requer definição segura de administradores autorizados.

## Detalhes técnicos
- React, TypeScript, Tailwind e shadcn/ui dentro da estrutura existente TanStack Start.
- PostgreSQL no Lovable Cloud, UUIDs, RLS, papéis em tabela separada e validações privilegiadas no servidor.
- Usar funções de servidor TanStack para operações internas; não criar Supabase Edge Functions neste projecto.
- Implementar uma etapa de cada vez e validar antes de avançar para a próxima.
