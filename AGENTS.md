# FN Dash Loja — Instruções do Projeto

Sempre que o usuário pedir para criar, adicionar, corrigir ou expandir
qualquer parte do sistema FN Dash Loja, leia este arquivo primeiro.

## Stack

- **Framework**: Next.js 16.3.4 (App Router, Turbopack)
- **UI**: React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-ui)
- **Banco**: Supabase (PostgreSQL + Realtime + Storage)
- **Deploy**: Vercel (via CLI, token configurado)
- **Charts**: Recharts
- **Animações**: Framer Motion

## Comandos Importantes

```bash
# Build local (incrementa versão automaticamente)
npm run build

# Deploy em produção
# O token NUNCA vai no código — defina via variável de ambiente:
#   $env:VERCEL_TOKEN = "<seu-token>"   (PowerShell)
#   export VERCEL_TOKEN="<seu-token>"    (bash)
npx vercel --prod --token $env:VERCEL_TOKEN --yes
# Alternativa: já logado com `npx vercel login`, basta `npx vercel --prod --yes`

# Dev local
npm run dev
```

## Regras de Deploy

1. **SEMPRE** fazer build antes de deploy (`npm run build`)
2. **A versão incrementa automaticamente** a cada build via `scripts/bump-version.js`
3. Não editar `src/lib/version.ts` manualmente — o script cuida disso
4. Deploy direto via CLI, não precisa de git push

## Supabase

- **URL**: `https://rezvmfcbsossxwynlnce.supabase.co`
- **Anon Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (env var; definida na Vercel e `.env.local`. Fallback hardcoded existe mas deve ser rotacionado — chave circular em commit público)
- **Sessão**: cookie `fn-dash-auth-token` via `@supabase/ssr` (guard server-side em `src/proxy.ts`)
- **Tabelas**: `profiles`, `products`, `sales`, `expenses`, `channels`
- **Storage bucket**: `avatars` (público, para fotos de perfil)
- **RLS**: aplicado via `supabase_security_hardening.sql` — dados exigem usuário autenticado (dados compartilhados entre a família); aplicar no SQL Editor antes de confiar em produção
- **Profiles**: salva avatar, notifications, role no banco

## Convenções

- Design system "Midnight Teal" — tokens CSS em `:root`
- Accent: `#00d4aa` / `#00b894`
- Backgrounds: dark `#08090d`, light `#f5f6fa`
- CSS vars são hex, NÃO HSL — usar `var(--X)` direto
- Opacidade via `color-mix(in srgb, var(--X) N%, transparent)`
- Todas as configs do usuário ficam no banco (avatar, notifications, role)
- Avatar: upload para Supabase Storage, URL salva no profile
- Notificações: campo jsonb no profile, auto-save ao toggle

## Layout do Código

```
src/
├── app/                    # Pages (App Router)
│   ├── page.tsx            # Dashboard (home)
│   ├── login/page.tsx      # Login
│   ├── marketplace/        # Marketplace
│   ├── vendas/             # Vendas
│   ├── relatorios/         # Relatórios
│   ├── despesas/           # Despesas
│   ├── configuracoes/      # Configurações (perfil, notificações)
│   ├── estoque/            # Estoque
│   ├── admin/              # Admin
│   └── hero/               # Hero page
├── components/
│   ├── dashboard/          # KPI cards, charts, tables
│   ├── layout/             # Sidebar, top-bar
│   ├── marketplace/        # Product cards, modals, forms
│   ├── ui/                 # shadcn/ui components
│   └── recursos-prontos/   # Calendar, toggles
├── lib/
│   ├── supabase.ts         # Client Supabase + interfaces
│   ├── auth-context.tsx    # Auth + profile sync
│   ├── db-context.tsx      # Products/sales/expenses + realtime
│   └── version.ts          # Versão (auto-incrementada)
├── data/
│   └── products.ts         # Interfaces + helpers
scripts/
└── bump-version.js         # Auto-increment versão no build
```

## Profile Interface

```typescript
interface Profile {
  id: string;
  email: string;
  role: "admin" | "family";
  username: string | null;
  avatar: string | null;          // URL do Supabase Storage
  notifications: {
    estoque: boolean;
    vendas: boolean;
    relatorios: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}
```

## Auth

- Login via Supabase Auth (email/senha)
- Profile carrega do Supabase com realtime sync
- `vitorvinhal90@gmail.com` força role `admin` automaticamente
- Avatar salvo no Storage bucket `avatars`, URL no profile
- Notificações salvas no campo jsonb do profile

## Design

- Sidebar fixa 260px no desktop, bottom nav no mobile
- Cards: `rounded-3xl`, backgrounds `bg-card`
- Modais: padding generoso, animações de entrada
- Cores: violet/indigo gradient para CTAs
- Charts: tooltips customizados, animações suaves

## IMPORTANTE

- NUNCA usar `asChild` no shadcn/ui (base-ui variant)
- NUNCA hardcodar cores — usar tokens CSS
- SEMPRE testar build antes de deploy
- SEMPRE atualizar CHANGELOG.md com as mudanças
- Formulários usam auto-save (sem botão Salvar exceto onde necessário)
- Ler CHANGELOG.md no início de cada sessão para entender o estado atual

## Change Log

- Sempre documentar mudanças em `CHANGELOG.md`
- Formato: `[versão] — data` com seções Adicionado/Modificado/Corrigido/Removido
- A versão incrementa automaticamente — não precisa controlar manualmente
- Incluir SQL necessário para mudanças de banco na seção "Notas Técnicas"
