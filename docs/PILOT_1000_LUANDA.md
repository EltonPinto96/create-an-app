# 🧭 KUSANGA KITADI — Manual Operacional do Piloto (1.000 Cidadãos em Luanda)

> **Documento Operacional de Campo**  
> **Escopo:** 1.000 Utilizadores Activos em Luanda, Angola  
> **Período Recomendado:** 21 Dias (cobrindo um ciclo de pagamentos de fim de mês)

---

## 1. Visão Geral do Piloto

O projecto **KUSANGA KITADI** foi dimensionado para servir a comunidade luandense em momentos de escassez de numerário. O piloto com **1.000 cidadãos** tem como objectivo:

1. Validar a acurácia dos reportes em tempo real de notas disponíveis (**5.000 Kz, 2.000 Kz, 1.000 Kz**).
2. Avaliar a precisão dos tempos de fila estimados pelos utilizadores.
3. Garantir a resiliência do sistema durante os **dias de pico de pagamento (dias 25 a 30)**.
4. Testar a moderação comunitária descentralizada e prevenção de vandalismo.

---

## 2. Estrutura das 4 Coortes Geográficas de Luanda

Para assegurar uma cobertura representativa dos principais corredores financeiros da província, os 1.000 utilizadores são distribuídos em 4 coortes territoriais:

| Coorte | Zona Geográfica | Cidadãos | Foco Principal |
|---|---|---|---|
| **Coorte 1: Central** | Ingombota, Maianga, Mutamba, Maculusso, Ilha de Luanda, Cruzeiro | **300** | Sede de grandes bancos (BAI, BFA, BPC), ATMs comerciais de alta rotação |
| **Coorte 2: Sul** | Talatona, Morro Bento, Futungo, Benfica, Nova Vida, Samba | **250** | Centros comerciais (Belas Shopping, Kero, Alimenta Angola), condomínios |
| **Coorte 3: Central-Leste** | Centralidade do Kilamba, Kilamba Kiaxi, Golfe, Camama, Palanca | **250** | Áreas densamente povoadas com forte procura em agências e postos de abastecimento |
| **Coorte 4: Expansão** | Viana, Zango 0 a 4, Cazenga, Cacuaco, Grafanil | **200** | Zonas periféricas com menor densidade de caixas, onde a informação de dinheiro é mais crítica |

---

## 3. Cronograma Operacional (21 Dias)

### Semana 1: Onboarding e Ambientação (Dias 1 a 7)
- Distribuição do link de acesso PWA (`https://eltonpinto96-create-an-app.pages.dev`) e APK Android para os 1.000 participantes.
- Activação das contas via Google OAuth.
- Teste de geolocalização e busca por proximidade em cada município.
- Primeiros 500 reportes de calibração.

### Semana 2: Teste de Stress do Fim do Mês (Dias 8 a 14)
- **Janela de Fogo:** Dias 25 a 29 do mês (corrida salarial aos ATMs).
- Monitorização contínua do Supabase Connection Pooler e latência.
- Teste das notificações de ATMs favoritos quando o estado mudar para "Com Dinheiro".
- Validação do algoritmo de contradição de reportes em menos de 15 minutos.

### Semana 3: Auditoria, Consolidação e Feedback (Dias 15 a 21)
- Sessão de avaliação com a rede de Embaixadores de Bairro.
- Aplicação do questionário de satisfação (NPS e facilidade de uso).
- Auditoria de reportes inválidos/spam pelo painel administrativo.
- Emissão do relatório final de prontidão para lançamento público em massa.

---

## 4. Rede de "Embaixadores de Bairro" (12 a 15 Moderadores)

Cada grupo de bairros terá **3 Embaixadores Comunitários** voluntários com papel `moderator` no Supabase:

### Responsabilidades dos Embaixadores:
1. **Auditoria de Spam:** Utilizar a aba **"Auditoria de Reportes"** do painel administrativo para invalidar submissões falsas ou desactualizadas.
2. **Confirmação de Novos ATMs:** Verificar no local novos caixas sugeridos pela comunidade antes da aprovação final pelo administrador.
3. **Ponto Focal no WhatsApp:** Recolher dúvidas de utilizadores locais e apoiar idosos ou utilizadores menos familiarizados com tecnologia.

---

## 5. Protocolo de Testes de Campo para os Utilizadores

Cada participante do piloto deve executar pelo menos 3 das seguintes acções durante o período:

1. **Reporte Completo:**
   - Ir a um ATM, verificar o estado real e registar:
     - Disponibilidade: *Normal* ou *Sem Dinheiro*.
     - Notas activas: assinalar se saem notas de *5.000 Kz*, *2.000 Kz* ou *1.000 Kz*.
     - Nível da fila: *Sem fila*, *Rápida (<15 min)*, *Moderada* ou *Longa (>30 min)*.
2. **Favoritos e Notificações:**
   - Adicionar os 3 ATMs mais frequentes do seu quotidiano à lista de favoritos.
   - Observar se o indicador no sino e a cor do badge mudam correctamente.
3. **Pesquisa por Bairro:**
   - Utilizar o filtro rápido por Município e Bairro (ex: "Talatona" → "Camama") para encontrar caixas alternativos num raio de 2 km.
4. **Teste de Modo Offline:**
   - Abrir o mapa sem dados móveis activos para verificar a persistência do cache PWA (`kusanga-kitadi-v1`).

---

## 6. Métricas de Sucesso e KPIs do Piloto

| Métrica | Meta do Piloto (1.000 Cidadãos) | Método de Medição |
|---|---|---|
| **Utilizadores Activos Diários (DAU)** | ≥ 400 utilizadores/dia | Supabase Auth Logs / Cloudflare Analytics |
| **Acurácia dos Reportes** | ≥ 90% de confirmações sem contradição | Rácio de reportes confirmados vs contraditórios |
| **Tempo de Resolução de Contradições** | ≤ 20 minutos | Log de timestamps de reportes divergentes |
| **Latência Média da Aplicação** | ≤ 250 ms em redes móveis 3G/4G | Cloudflare Worker Web Vitals |
| **Taxa de Erro do Backend** | < 0.1% | Log de erros Supabase API |
| **Satisfação Geral (CSAT / NPS)** | ≥ 80% de avaliações positivas | Inquérito final do piloto |

---

## 7. Canais de Suporte e Comunicação

- **Grupo Comunitário de Coordenação:** Comunidade WhatsApp KUSANGA KITADI (restrito a avisos dos embaixadores).
- **Canal de Denúncias de Fraude:** `privacidade@kusanga-kitadi.ao`.
- **Canal Técnico:** Repositório GitHub [create-an-app](https://github.com/EltonPinto96/create-an-app).

---

*KUSANGA KITADI — A força está na ligação. Saiba onde levantar.*  
*Luanda, Angola.*
