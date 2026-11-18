# 📦 KUSANGA KITADI — Guia de Deploy em Produção

> **Stack:** TanStack Start (SSR) · Nitro · Vite · Supabase · Cloudflare Pages/Workers

---

## 1. Pré-requisitos

| Ferramenta | Versão Mínima | Notas |
|------------|---------------|-------|
| Node.js | 20 LTS | Recomendado: 20.x |
| pnpm / npm | 9+ / 10+ | O projecto usa npm |
| Conta Cloudflare | — | [cloudflare.com](https://cloudflare.com) |
| Conta Supabase | — | [supabase.com](https://supabase.com) |
| Conta GitHub | — | Para CI/CD automático |

---

## 2. Configuração das Variáveis de Ambiente

### 2.1 Ficheiro Local (Desenvolvimento)

```bash
# Na raiz do projecto:
cp .env.example .env
```

Edita o `.env` com os teus valores reais do painel Supabase:

```env
VITE_SUPABASE_URL=https://csgxlruqvzxvijrkvvxi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **NUNCA** commites o `.env` com valores reais. O `.gitignore` já o exclui.

### 2.2 Variáveis de Produção no Cloudflare

No painel Cloudflare:
1. Vai a **Workers & Pages** → Selecciona o teu projecto.
2. Clica em **Settings** → **Variables and Secrets**.
3. Adiciona:
   - `VITE_SUPABASE_URL` → URL do projecto Supabase
   - `VITE_SUPABASE_ANON_KEY` → chave `anon public`
4. Clica em **Save and Deploy**.

---

## 3. Base de Dados Supabase — Migrações

Antes do primeiro deploy, todas as migrações SQL devem estar executadas no projecto Supabase remoto.

### 3.1 Via SQL Editor (Recomendado para o Projecto Actual)

1. Acede a [supabase.com/dashboard](https://supabase.com/dashboard).
2. Selecciona o projecto **KUSANGA KITADI** (`csgxlruqvzxvijrkvvxi`).
3. Vai a **SQL Editor**.
4. Executa sequencialmente os ficheiros em `supabase/migrations/`:

| Ordem | Ficheiro | Descrição |
|-------|----------|-----------|
| 1 | `001_initial_schema.sql` | Schema inicial de ATMs e reportes |
| 2 | `002_reports_confidence.sql` | Sistema de confiança dos reportes |
| 3 | `003_rate_limiting.sql` | Limitação de taxa por utilizador |
| 4 | `004_contradiction_detection.sql` | Detecção de reportes contraditórios |
| 5 | `005_user_favorites.sql` | Tabela de favoritos do utilizador |
| 6 | `006_profile_history.sql` | Histórico de contribuições do perfil |
| 7 | `007_admin_moderation_audit.sql` | Políticas RLS para moderação e auditoria |

### 3.2 Via Supabase CLI (CI/CD)

```bash
# Instalar CLI
npm install -g supabase

# Autenticar
supabase login

# Ligar ao projecto remoto
supabase link --project-ref csgxlruqvzxvijrkvvxi

# Executar migrações pendentes
supabase db push
```

---

## 4. Configuração das Redirect URLs no Supabase (Google OAuth)

Para o login com Google funcionar em produção, tens de adicionar os domínios à lista de Redirect URLs autorizadas:

1. Acede ao [painel Supabase](https://supabase.com/dashboard/project/csgxlruqvzxvijrkvvxi).
2. Vai a **Authentication** → **URL Configuration**.
3. Em **Redirect URLs**, adiciona:
   ```
   https://teu-dominio.pages.dev/**
   https://kusanga-kitadi.ao/**
   http://localhost:3000/**
   ```
4. Clica em **Save**.

> 💡 O `/**` (wildcard) é necessário para o TanStack Router lidar com os redirects OAuth.

---

## 5. Deploy no Cloudflare Pages (via GitHub — Recomendado)

### 5.1 Primeira Configuração

1. Acede ao [painel Cloudflare](https://dash.cloudflare.com) → **Workers & Pages** → **Create**.
2. Escolhe **Pages** → **Connect to Git**.
3. Autoriza o repositório `create-an-app` do GitHub.
4. Configuração do build:

   | Campo | Valor |
   |-------|-------|
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `.output/public` |
   | Root directory | `/` (raiz do repo) |
   | Node.js version | `20` |

5. Adiciona as variáveis de ambiente (passo 2.2).
6. Clica em **Save and Deploy**.

### 5.2 Deploy Contínuo (CD)

Após a configuração inicial, qualquer `git push` para `main` desencadeia automaticamente um novo deploy no Cloudflare.

---

## 6. Deploy no Cloudflare Workers (SSR Avançado)

O preset Nitro `cloudflare-module` gera um Worker SSR. Para deploy manual:

```bash
# Build de produção
npm run build

# Instalar Wrangler (se não estiver instalado)
npm install -g wrangler

# Autenticar
wrangler login

# Deploy do Worker
wrangler deploy
```

O ficheiro `wrangler.toml` (se necessário criar):

```toml
name = "kusanga-kitadi"
main = ".output/server/index.mjs"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = ".output/public"
```

---

## 7. Verificação Pós-Deploy

Após o deploy, verifica:

- [ ] Página inicial carrega com o mapa e a lista de ATM.
- [ ] Login com Google funciona (OAuth redirect correctamente configurado).
- [ ] Reportes comunitários são submetidos e exibidos em tempo real.
- [ ] PWA: o `manifest.json` é detectado (ícone de instalação no browser).
- [ ] Service Worker registado (abre DevTools → Application → Service Workers).
- [ ] 404 personalizado aparece ao aceder a uma rota inexistente.
- [ ] Painel de administração (`/` → secção Admin) acessível para conta admin.

---

## 8. Domínio Personalizado (Opcional)

Para configurar `kusanga-kitadi.ao`:

1. No painel Cloudflare Pages → **Custom domains** → **Set up a custom domain**.
2. Adiciona `kusanga-kitadi.ao` e `www.kusanga-kitadi.ao`.
3. Actualiza os DNS do teu registador de domínio (`.ao`) com os registos Cloudflare.
4. Aguarda propagação (até 48h).
5. Lembra-te de adicionar o novo domínio às Redirect URLs do Supabase (passo 4).

---

## 9. Monitorização e Logs

- **Logs do Worker:** Painel Cloudflare → Workers & Pages → teu projecto → **Logs**.
- **Erros Supabase:** Painel Supabase → **Logs** → **API** e **Database**.
- **Relatórios de Uso:** Painel Cloudflare → **Analytics**.

---

## 10. Lista de Verificação de Produção

```
[ ] Variáveis de ambiente configuradas no Cloudflare
[ ] Todas as migrações SQL executadas no Supabase remoto
[ ] Redirect URLs do OAuth configuradas (Supabase + Google Console)
[ ] Build de produção passa sem erros: npm run build
[ ] Todos os testes passam: npx vitest run
[ ] PWA manifest.json e Service Worker funcionais
[ ] Política de Privacidade acessível no rodapé
[ ] Termos de Uso acessíveis no rodapé
[ ] Domínio personalizado configurado (se aplicável)
[ ] SSL/TLS activo (Cloudflare gere automaticamente)
```

---

*Documento gerado para o projecto KUSANGA KITADI — Luanda, Angola.*
*"A força está na ligação. Saiba onde levantar."*
