# FN Dash Loja

Sistema de controle de loja e marketplace — dashboard financeiro, estoque, vendas,
despesas e relatórios, com integração multi-canal (Loja Física, Shopee, TikTok Shop).

Built with **Next.js 16 (App Router + Turbopack)**, **React 19**, **TypeScript**,
**Tailwind CSS v4**, **shadcn/ui (base-ui)** e **Supabase**.

---

## Sumário

- [Recursos](#recursos)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Rotas](#rotas)
- [API](#api)
- [Banco de dados (Supabase)](#banco-de-dados-supabase)
- [Testes](#testes)
- [Deploy](#deploy)
- [Design System](#design-system)

---

## Recursos

| Área | O que tem |
|---|---|
| **Dashboard** | KPIs, gráficos de receita/vendas, vendas recentes |
| **Marketplace** | Grid de produtos com busca, filtros, árvore de categorias, variações, upload de imagens, links Shopee/TikTok |
| **Vendas** | Registro por canal, visão dia/semana/mês, gráficos barras + pizza, calendário, filtros |
| **Despesas** | Categorias com ícone/cor, recorrência, controle de pago/pendente |
| **Relatórios** | Receita/custo/lucro, margem por produto, ranking top-5, breakdown por canal, export CSV |
| **Categorias & Tags** | Árvore hierárquica recursiva + tags coloridas (Supabase com fallback `localStorage`) |
| **Configurações** | Perfil + avatar, aparência (3 layouts), notificações, preferências, acessibilidade, backup export/import, sistema |
| **Admin** | Gestão de usuários (email/senha/cargo), estatísticas de banco, setup de tabelas, export JSON |
| **Multi-canal** | Exportação CSV pronta para Shopee e TikTok (ciente de variações) |
| **Notificações** | Push do navegador para estoque baixo, novas vendas e relatórios |
| **Temas** | Dark / light (tom quente), 3 estilos de layout, animações Framer Motion |

---

## Stack

- **Framework** — Next.js 16.3.4 (App Router, Turbopack)
- **UI** — React 19.2, TypeScript 5, Tailwind CSS v4, shadcn/ui (variante base-ui — *não usar `asChild`*)
- **Banco** — Supabase (PostgreSQL + Realtime + Storage + Auth)
- **Estado** — Context API (`AuthContext`, `DbContext`, `LayoutContext`, `ThemeProvider`)
- **Validação** — Zod 4
- **Charts** — Recharts
- **Animações** — Framer Motion
- **Testes** — Vitest 5 (unit/integration) + Playwright 1.62 (e2e/visual) + Faker
- **Deploy** — Vercel

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta no [Supabase](https://supabase.com)
- (opcional) [Vercel CLI](https://vercel.com/docs/cli) e [GitHub CLI](https://cli.github.com)

---

## Instalação

```bash
git clone https://github.com/vitorvinhal/fn-dash-loja.git
cd fn-dash-loja
npm install
cp .env.test.example .env.local   # e preencha os valores
npm run dev
```

Abra <http://localhost:3000>.

---

## Variáveis de ambiente

Copie `.env.test.example` para `.env.local` e preencha:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave *publishable/anon* do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service-role (**somente servidor** — usada pelas rotas de admin/setup) |
| `TEST_SUPABASE_URL` / `TEST_SUPABASE_KEY` | Projeto usado pelos testes de integração |
| `TEST_EMAIL` / `TEST_PASSWORD` | Credenciais usadas pelo setup de autenticação do Playwright |
| `NEXT_PUBLIC_BASE_URL` | Base URL para os testes de API (`http://localhost:3000`) |

> **Nunca** commite `.env.local` / `.env.test` — já estão no `.gitignore`.
> Apenas `.env.test.example` é versionado.

---

## Comandos

```bash
npm run dev                  # servidor de desenvolvimento
npm run build                # build de produção (incrementa a versão automaticamente)
npm start                    # servidor de produção
npm run lint                 # ESLint

npm test                     # unit + integration + e2e
npm run test:unit            # Vitest unitário (jsdom)
npm run test:integration     # Vitest integração (API real)
npm run test:e2e             # Playwright e2e (desktop/tablet/mobile)
npm run test:e2e:ui          # Playwright em modo UI
npm run test:visual          # testes visuais (diff de screenshot)
npm run test:visual:update   # atualiza os snapshots visuais
npm run test:contracts       # apenas os contratos de API (Zod)
```

> ⚠️ `npm run build` executa `scripts/bump-version.js`, que incrementa o patch em
> `src/lib/version.ts`. Não edite esse arquivo manualmente.

---

## Estrutura do projeto

```
├── public/                     # assets estáticos (favicon, ícones)
├── scripts/
│   └── bump-version.js         # incrementa APP_VERSION a cada build
├── src/
│   ├── app/                    # páginas (App Router)
│   │   ├── page.tsx            # dashboard (home)
│   │   ├── login/              # autenticação
│   │   ├── marketplace/        # produtos
│   │   ├── categorias/         # categorias & tags
│   │   ├── vendas/             # vendas
│   │   ├── despesas/           # despesas
│   │   ├── relatorios/         # relatórios
│   │   ├── configuracoes/      # configurações
│   │   ├── admin/              # painel admin (protegido por proxy + role)
│   │   ├── hero/               # landing
│   │   ├── estoque/            # alias → /marketplace
│   │   ├── error.tsx           # error boundary global
│   │   ├── not-found.tsx       # página 404
│   │   └── api/                # rotas REST (produtos, vendas, despesas, admin, setup)
│   ├── proxy.ts                # guard server-side de /admin (convenção do Next 16)
│   ├── components/
│   │   ├── dashboard/          # KPI cards, charts, tabelas
│   │   ├── layout/             # sidebar, top-bar, seletor de layout
│   │   ├── marketplace/        # cards, modais de produto/venda
│   │   ├── categorias/         # árvore de categorias + tags
│   │   ├── recursos-prontos/   # calendário, busca, toggles
│   │   ├── theme/              # provider + toggle de tema
│   │   └── ui/                 # primitivas shadcn/ui (17 componentes)
│   ├── lib/
│   │   ├── supabase.ts         # client (@supabase/ssr, sessão em cookie) + interfaces
│   │   ├── auth-context.tsx    # auth + sync de profile
│   │   ├── db-context.tsx      # products/sales/expenses + realtime
│   │   ├── layout-context.tsx  # temas de layout
│   │   ├── api-utils.ts        # auth, validação, respostas de erro
│   │   ├── schemas.ts          # schemas Zod
│   │   ├── errors.ts           # getErrorMessage (erros tipados)
│   │   ├── export-marketplace.ts # CSV Shopee/TikTok
│   │   ├── notifications.ts    # push do navegador
│   │   ├── performance.ts      # métricas web
│   │   └── version.ts          # versão (auto-incrementada)
│   └── data/
│       └── products.ts         # interfaces + helpers (calcUnitProfit, calcMargin, generateSKU)
├── tests/
│   ├── unit/                   # Vitest unitário
│   ├── integration/            # Vitest integração + contratos de API
│   ├── e2e/                    # Playwright e2e
│   ├── visual/                 # Playwright screenshots
│   ├── factories/              # factories com Faker
│   └── setup/                  # auth, limpeza de banco, helpers
├── supabase_*.sql              # DDL / migrações do banco
└── CHANGELOG.md                # histórico de versões
```

---

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Dashboard com KPIs, gráficos e vendas recentes |
| `/login` | Login e cadastro |
| `/marketplace` | Grade de produtos com busca e filtros (`?product=` deep-link) |
| `/categorias` | Árvore de categorias + tags |
| `/vendas` | Vendas por dia/semana/mês, calendário, gráficos |
| `/despesas` | Despesas por categoria com controle de pagamento |
| `/relatorios` | Relatórios de lucro/margem + export CSV |
| `/configuracoes` | Perfil, aparência, notificações, backup, sistema |
| `/admin` | Usuários, banco de dados, sistema (admin only) |
| `/hero` | Landing page |
| `/estoque` | Redirect permanente para `/marketplace` |

---

## API

Todas as rotas exigem `Authorization: Bearer <token>` e validam entrada/saída com **Zod**.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/products` | Lista paginada + filtros `search`, `category`, `channel`, `sort`, `order` |
| `POST` | `/api/products` | Cria produto (`CreateProductBodySchema`) |
| `GET` | `/api/products/[id]` | Produto único |
| `PUT` | `/api/products/[id]` | Atualização parcial (merge) |
| `DELETE` | `/api/products/[id]` | Remove (204) |
| `GET`/`POST` | `/api/sales` | Lista / cria vendas |
| `GET`/`POST` | `/api/expenses` | Lista / cria despesas |
| `POST` | `/api/admin/update-user` | Atualiza usuário (email, senha, cargo, avatar) |
| `GET`/`POST` | `/api/setup/tables` | Verifica/cria tabelas via RPC `exec_sql` |

Envelope de erro padronizado:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

---

## Banco de dados (Supabase)

**Tabelas:** `profiles`, `products`, `sales`, `expenses`, `channels`, `categories`,
`product_tags`, `product_tag_relations`

**Storage:** bucket `avatars` (público, fotos de perfil)

**Padrão de dados:** entidades principais guardam o objeto em coluna `data` (JSONB)
na forma `{ id, data, created_at, updated_at }`.

**Migrações SQL** (executar no SQL Editor, na ordem indicada pelo prefixo):

| Arquivo | Conteúdo |
|---|---|
| `supabase_setup.sql` | Setup inicial |
| `supabase_schema.sql` | Schema base |
| `supabase_categories.sql` | Categorias/tags |
| `supabase_unified.sql` / `supabase_unified_v2.sql` | Schema unificado |
| `supabase_fix_recursion.sql` | Corrige recursão em policies |
| `supabase_fix_profile_realtime.sql` | Habilita realtime em `profiles` |
| `supabase_security_hardening.sql` | **Requerido** — restringe RLS a usuários autenticados |

> **RLS:** a partir da `v3.0.7` foi provida a migração `supabase_security_hardening.sql`
> que bloqueia acesso anônimo (usuários autenticados da família continuam compartilhando
> os dados). **Aplicar no SQL Editor do Supabase.** Enquanto não for aplicada, o RLS
> permanece aberto nas tabelas.

---

## Testes

| Camada | Ferramenta | Comando | Cobertura |
|---|---|---|---|
| Unitário | Vitest (jsdom) | `npm run test:unit` | `calcUnitProfit`, `calcMargin`, `generateSKU`, constantes, shape de `Profile` |
| Integração | Vitest (node) | `npm run test:integration` | CRUD real contra a API + contratos Zod + limites de paginação |
| E2E | Playwright | `npm run test:e2e` | login, dashboard, marketplace, configurações (desktop/tablet/mobile) |
| Visual | Playwright | `npm run test:visual` | 16 snapshots de screenshot (diff ≤ 1%) |

O setup do Playwright sobe o `next dev` automaticamente e salva a sessão em
`tests/e2e/.auth/user.json`.

---

## Deploy

```bash
npm run build
npx vercel --prod --yes
```

- Build local **sempre** antes do deploy — a versão incrementa automaticamente
  via `scripts/bump-version.js`.
- Deploy direto pela CLI, sem `git push` para o Vercel.
- `src/lib/version.ts` é gerado — não editar à mão.

---

## Design System

**"Midnight Teal"** — tokens CSS declarados em `:root` (em `src/app/globals.css`).

| Token | Valor |
|---|---|
| Accent | `#00d4aa` / `#00b894` |
| Background dark | `#08090d` |
| Background light | `#e8e6e1` (tom quente) |
| Cards | `rounded-3xl`, `bg-card` |
| CTA | gradiente violet/indigo |

**Regras:**

- CSS vars são **hex**, não HSL → usar `var(--token)` direto.
- Opacidade via `color-mix(in srgb, var(--token) N%, transparent)`.
- **Nunca** usar `asChild` (variante base-ui do shadcn/ui).
- **Nunca** hardcodar cores — sempre tokens CSS.
- Sidebar fixa de 260px no desktop, bottom nav no mobile.

---

## Segurança

Estado atual **(v3.0.7)**:

1. ✅ **Rotas de admin protegidas**: `/api/admin/update-user` e `/api/setup/tables` exigem
   `requireAdmin` (Bearer token + role admin); a página de admin envia o token da sessão.
2. ✅ **Guard server-side**: `src/proxy.ts` redireciona acessos a `/admin` sem cookie de
   sessão para `/login` (defense-in-depth).
3. ✅ **Sessão em cookie** via `@supabase/ssr` (`fn-dash-auth-token`).
4. ✅ **RLS endurecido** pelas policies da migração `supabase_security_hardening.sql`
   (exige autenticação; gravação no próprio perfil ou por admin; storage de avatares
   com escrita autenticada).
5. ✅ **Config via env vars** — `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   definidas na Vercel e `.env.local`.
6. ⚠️ **Lint**: 0 erros (18 avisos restantes são só sugestões de desempenho `no-img-element`).

**Ação pendente — rotacionar chaves (importante):**

- As chaves **publishable** do Supabase e um token da Vercel circularam em um commit
  público do histórico. Gere novas:
  - Vercel: `vercel.com/account/tokens` → novo token; revogue o antigo.
  - Supabase: `Settings → API` → regenerar a chave `anon/publishable`; atualize
    `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel (produção/preview) e em `.env.local`.
- **Usuários existentes:** a sessão migrou de `localStorage` para cookie — é necessário
  fazer login novamente uma única vez após o deploy.

---

## Licença

Uso privado. Todos os direitos reservados.
