# FN Dash Loja

Instruções completas de projeto em [`AGENTS.md`](./AGENTS.md) — leia antes de
qualquer alteração no sistema.

## Resumo

- **Stack:** Next.js 16 (App Router + Turbopack) · React 19 · TypeScript ·
  Tailwind v4 · shadcn/ui (variante base-ui) · Supabase · Recharts ·
  Framer Motion
- **Deploy:** `npm run build` (incrementa versão via `scripts/bump-version.js`)
  → `npx vercel --prod --yes`
- **Regras:** não usar `asChild` · não hardcodar cores (usar tokens CSS) ·
  nunca commitar segredos/chaves · testar build antes de deploy ·
  atualizar `CHANGELOG.md`

## Layout

- `src/app/` — páginas (dashboard, login, marketplace, vendas, despesas,
  relatorios, configuracoes, admin, hero) + rotas `src/app/api/`
- `src/components/` — `dashboard`, `layout`, `marketplace`, `categorias`,
  `recursos-prontos`, `theme`, `ui` (shadcn)
- `src/lib/` — `supabase.ts`, `auth-context`, `db-context`, `layout-context`,
  `api-utils`, `schemas` (Zod), `errors`, `export-marketplace`,
  `notifications`, `performance`
- `tests/` — Vitest (unit/integração) + Playwright (e2e/visual)

## Segurança (endurecido em v3.1.0)

- Middleware protege `/admin` (cookie de sessão)
- Rotas `/api/admin/*` e `/api/setup/*` exigem `requireAdmin`
- Migração `supabase_security_hardening.sql` restringe RLS a usuários
  autenticados — **aplicar no SQL Editor do Supabase**
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` definidos na
  Vercel (produção/preview) e em `.env.local` (local) — chaves atuais ainda
  são as publicadas; **rotacionar no dashboard do Supabase**