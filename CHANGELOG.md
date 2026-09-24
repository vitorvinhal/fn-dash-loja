# Changelog — FN Dash Loja

Todas as mudanças significativas deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [3.0.7] — 2026-09-24

### Adicionado
- **Endurecimento de segurança das rotas de admin**
  - `/api/admin/update-user` e `/api/setup/tables` agora exigem `requireAdmin` (Bearer token + role `admin`)
  - Página de admin envia `Authorization: Bearer` nas chamadas para essas rotas
- **Guard server-side de rota**: `src/proxy.ts` (nova convenção do Next 16, substitui `middleware`)
  protege `/admin` exigindo cookie de sessão — redireciona para `/login` quando ausente
- **Sessão em cookie**: cliente Supabase migrado para `@supabase/ssr` (`createBrowserClient`),
  cookie `fn-dash-auth-token` — permite o guard acima e é o padrão oficial
- **Config por env vars**: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  definidas na Vercel (produção + preview) e `.env.local` (local); valores antigos mantidos
  apenas como fallback com aviso de rotação
- **Migração de RLS** `supabase_security_hardening.sql`: policies de products/sales/expenses/
  channels/categories/tags/profiles/storage agora exigem usuário autenticado; gravação no
  próprio perfil ou admin; storage de avatares restrito (leitura pública, escrita autenticada,
  remoção só do próprio avatar)
- `src/app/error.tsx` (error boundary global) e `src/app/not-found.tsx` (404)
- Helper `src/lib/errors.ts` (`getErrorMessage`) para tipos de erro sem `any`

### Modificado
- **Lint zerado em erros**: 48 erros → 0. Corrigidos `no-explicit-any` (≈40), tipos de
  `ChartTooltip` (interface), `static-components` (EmptyChart movido para o módulo),
  `no-children-prop` (renomeado para `subCategories`), `set-state-in-effect`
  (lazy-init + hydration controlada), `no-require-imports` (script Node legítimo)
- **Warnings reduzidos**: 68 → 18 (restam apenas sugestões de desempenho `no-img-element`)
- **Código morto removido**: `inventory-table`, `category-nav`, `aether-dock`,
  `marque-toggle` (+ CSS correspondente em `globals.css`)
- **Importações e locais não usados removidos** em 15+ arquivos
- `ThemeProvider` sem `setState` em effect (lazy init de tema + aplicação de classes)
- Sidebar: `window.location.href` → `router.push`

### Corrigido
- `export type AuthResult` declarado dentro do componente `AuthProvider` (quebrava build)

### Notas Técnicas
- **Usuários precisam fazer login de novo** após o deploy: a sessão passou de `localStorage`
  para cookie. Reversível mantendo-se o padrão antigo caso prefira.
- **Aplicar SQL obrigatório no Supabase** (SQL Editor): `supabase_security_hardening.sql`.
  Sem ele, as tabelas continuam com RLS aberto.
- **Rotacionar** as chaves publicadas:
  - Vercel: criar novo token em vercel.com/account/tokens e revogar o exposto em `AGENTS.md` antigo
  - Supabase: a chave anon atual circular no repositório (histórico público) — regenerar no
    dashboard e atualizar `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel e em `.env.local`
- Testes unitários: 22/22 passando. Build de produção: OK.

---

## [3.0.0] — 2026-09-07

### Adicionado
- **Admin → Edição completa de usuário**: modal com campos para email, nome de usuário, foto de perfil, cargo e senha
- **Alteração de senha via admin**: API admin agora suporta alteração de senha diretamente (requer service role key)
- **Toggle mostrar/ocultar senha**: botão de olho nos campos de senha para melhor usabilidade
- **Remover foto de perfil**: botão para remover avatar existente
- **Validação em tempo real**: avisos de senha fraca e senhas não coincidem

### Modificado
- **Tema light reconfortante**: cores atualizadas para tons mais quentes e suaves (bege, areia, cinza quente)
  - Background: `#eef0f4` → `#e8e6e1`
  - Card: `#f7f8fb` → `#f0ede8`
  - Secondary: `#e2e5ec` → `#ddd9d2`
  - Border: `#d5d8e0` → `#c9c4bc`

### Técnico
- API `/api/admin/update-user` agora aceita campo `password` para alteração via admin
- Build v3.0.0 deployado com sucesso

---

## [2.1.30] — 2026-09-07

### Modificado
- **CategoryManager simplificado**: removido wizard de configuração de banco de dados — categorias e tags agora funcionam automaticamente via localStorage quando tabelas Supabase não existem
- Botão "Nova Categoria" sempre habilitado, sem necessidade de verificar tabelas
- Badge "Salvo localmente" aparece quando categorias usam armazenamento local
- Removidos imports desnecessários (Database, RefreshCw, Copy, ExternalLink, AlertTriangle, SETUP_SQL)

---

## [2.1.29] — 2026-09-07

### Removido
- Seção "Aparência" redundante nas Configurações (tema já é acessível pelo botão no TopBar)

### Corrigido
- **Toggle de tema**: ícone agora alterna corretamente entre sol e lua ao clicar
- **Responsividade mobile**: sidebar não empurra conteúdo mais; `margin-left` removido em telas < 768px
- **AetherDock**: navegação inferior mobile agora funciona corretamente

### Modificado
- **Backup local aprimorado**: exportação agora inclui profiles e channels além de products, sales, expenses, categories e tags
- Seção de dados renomeada para "Backup & Dados" com botão mais destacado
- Descrição detalhada do que é incluído no backup

---

## [2.1.28] — 2026-09-07

### Adicionado
- **Setup Wizard de Categorias**: detecta tabelas ausentes e mostra guia passo-a-passo com botão "Copiar SQL" e link direto pro SQL Editor do Supabase
- **API `/api/setup/tables`**: verifica status das tabelas e tenta criar automaticamente
- **Botões de Segurança funcionais**: modal para alterar senha (via Supabase Auth) e modal de sessões ativas
- **Admin → Ações Rápidas**: limpar cache, recarregar dados, exportar backup
- **Admin → Configuração do Banco**: seção para criar tabelas automaticamente
- Tags agora mostram erro amigável quando tabela não existe

### Modificado
- **Tema dark/light sincronizado**: ThemeProvider e LayoutProvider agora usam a mesma chave localStorage
- **db-context mais resilente**: categorias e tags são carregadas com try-catch separado, não quebram o app
- Realtime subscriptions para categorias/tags envolvidas em try-catch

### Removido
- Seletor de cor na edição de categorias (árvore)
- Cor do dot removido da visualização de categorias

---

## [2.1.27] — 2026-09-07

### Adicionado
- **Admin → Configuração do Banco**: seção para criar tabelas automaticamente (categories, product_tags, product_tag_relations)
- **API `/api/setup/tables`**: rota para criar tabelas faltantes no Supabase
- **Botão "Copiar SQL"**: facilita executar o SQL manualmente no Supabase SQL Editor

### Corrigido
- **Categorias não criavam**: tabela `categories` não existia no Supabase; agora o admin mostra aviso claro com botão para criar
- **Mensagem de erro melhorada**: ao tentar criar categorias sem a tabela, mostra instrução para ir ao Admin → Sistema
- **Campo de busca**: borda reduzida no marketplace

### Removido
- Seletor de cor na criação de categorias (mantido apenas ícone)

---

## [2.1.26] — 2026-09-07

### Adicionado
- **Configurações expandida**: 7 seções navegáveis (Perfil, Aparência, Notificações, Segurança, Acessibilidade, Dados, Sistema)
- **Segurança**: gerenciamento de senha, sessões ativas, 2FA (em breve)
- **Acessibilidade**: seletor de tamanho de fonte (12-16px), toggle reduzir movimento, alto contraste
- **Dados**: exportação completa em JSON (produtos, vendas, despesas, categorias, tags), limpeza de cache local
- **Sistema**: ícones em cada card de info, link para documentação
- Navegação rápida por seções com botões-bubble no topo

### Modificado
- **Layouts completamente redesenhados**:
  - **Moderno**: mantido (glassmorphism + violeta)
  - **Compacto → Neon**: tema cyberpunk com brilho neon (#00ffc8), bordas com glow, scrollbars customizadas, efeito de luz nas bordas
  - **Clássico → Luxo**: tema premium dourado (#d9a03c), gradientes sutis, bordas douradas, scrollbar âmbar
- Cada layout agora tem visual, sidebar, cards e ambient completamente distintos
- Thumbnail do layout atualizado com paletas de cores novas

### Corrigido
- **Botão "Criar Categoria" agora exibe erros**: quando a inserção falha (ex: tabela não existe, constraint UNIQUE), a mensagem de erro aparece em vermelho ao lado do botão
- `addCategory` retorna `{ data, error }` em vez de `null` para melhor tratamento

---

## [2.1.21] — 2026-09-06

### Adicionado
- **Sistema de layouts**: 3 estilos distintos (Moderno, Compacto, Clássico) com miniatura de preview na página de configurações
- `LayoutProvider` para gerenciar estilos de layout e modo de cor (escuro/claro)
- `LayoutThumbnail` com preview visual de cada layout
- `LayoutSelector` com seleção de layout e modo de cor
- CSS variables específicas para cada layout (`--sidebar-width`, `--card-radius`, `--button-radius`, etc.)

### Modificado
- **Sidebar**: categorias agora aparecem inline com árvore expansível (sem link separado para `/categorias`)
- `layout.tsx`: adicionado `LayoutProvider` no provider tree
- `configuracoes/page.tsx`: adicionado `LayoutSelector` na seção de aparência
- `FUTURAS_MELHORIAS.md`: atualizado com features implementadas e novas ideias

### Corrigido
- **BUG CRÍTICO**: Informações de perfil (foto, nome, notificações) não eram persistidas corretamente
- **BUG CRÍTICO**: Mudanças de cargo no admin não eram persistidas (revertiam ao valor anterior)
- `updateProfile` agora usa optimistic update com reverte em caso de erro (sem race condition)
- `ensureProfile` não sobrescreve role existente (exceto para admin forçado)
- `onAuthStateChange` não recarrega profile se já existe para o mesmo usuário

### Notas Técnicas
- Layouts usam CSS variables aplicadas via JavaScript no `document.documentElement`
- Cada layout define: largura da sidebar, raio de bordas, espaçamento, tamanho de fonte
- Modo de cor alterna variáveis CSS para temas escuro/claro
- Dados de layout salvos em `localStorage` (`fn_dash_layout`, `fn_dash_color_mode`)

---

## [2.1.19] — 2026-09-06

### Adicionado
- **Sistema de Categorias/Subcategorias hierárquicas**: tabela `categories` com auto-referência (`parent_id`), CRUD completo na página `/categorias`
- **Sistema de Tags**: tabela `tags` para labels livres (Promoção, Novo, Baixo Estoque), CRUD na mesma página
- Página `/categorias` com tree view recursiva, formulário de nova categoria com ícone e cores
- TagManager com seletor de cores e CRUD inline
- Sidebar com link "Categorias" (ícone FolderTree)
- Product Form: seletor de categoria hierárquica + seletor de tags multi-select
- Product Card: badge de categoria com ícone + chips de tags coloridas
- Product Detail: exibição e edição de categoria + tags
- Marketplace Grid: filtros dinâmicos por categoria e tag do banco
- Relatórios: gráfico de categorias usa nomes com ícones do banco

### Modificado
- `product-form-modal.tsx` — categoria agora usa `categoryId` do banco (hierárquica), suporta tags
- `product-card.tsx` — exibe categoria com ícone + tags como chips
- `product-detail-modal.tsx` — categoria hierárquica + tags na visualização/edição
- `marketplace-grid.tsx` — filtros dinâmicos de categorias e tags do banco
- `relatorios/page.tsx` — dados de categoria com ícones do banco
- `sidebar.tsx` — item "Categorias" na navegação
- `db-context.tsx` — state de categories/tags, CRUD, realtime subscriptions
- `supabase.ts` — interfaces Category e Tag

### Notas Técnicas
- SQL para criar tabelas: execute `supabase_categories.sql` no Supabase SQL Editor
- Categorias usam auto-referência (`parent_id`) para hierarquia Arbitrariamente profunda
- Tags são labels livres (não hierárquicas) associadas via `tags: string[]` no produto
- `product.category` (string) mantido para retrocompatibilidade, `product.categoryId` é o novo campo

---

## [2.1.17] — 2026-09-06

### Corrigido
- **BUG CRÍTICO**: Tabela `profiles` não estava na publicação de realtime do Supabase — avatar, username e notifications não sincronizavam entre dispositivos
- Race condition no `updateProfile` — agora lê profile fresco do banco antes de mesclar dados
- Adicionada verificação pós-escrita (read-after-write) para confirmar que dados foram salvos
- Channel de realtime agora usa `userId` no nome para evitar conflitos entre abas

### Adicionado
- Função `refreshProfile()` no AuthContext para forçar reload do profile do banco
- Botão "Forçar Reload do Profile" na página de Configurações
- Logs detalhados em todas as operações de profile (auth-context + configuracoes)
- SQL de correção `supabase_fix_profile_realtime.sql` — rodr uma vez no Supabase

### Notas Técnicas
- O SQL de correção precisa ser executado no SQL Editor do Supabase
- Após executar o SQL, faça logout e login novamente para forçar reload do profile
- Os logs aparecem no console do navegador com prefixo `[AUTH]` e `[CONFIG]`

---

## [2.1.3] — 2026-09-02

### Adicionado
- Sistema de versão automática — incrementa a cada build via `scripts/bump-version.js`
- Campo `notifications` (jsonb) na tabela `profiles` para sincronizar preferências entre dispositivos
- Auto-save em todas as configurações (username, avatar, notificações)
- Realtime na tabela `profiles` para sync instantânea entre dispositivos

### Corrigido
- Foto de perfil agora sincroniza entre dispositivos (upload para Supabase Storage)
- Notificações agora persistem no banco de dados (não mais só no localStorage)
- Role `admin` forçado para `vitorvinhal90@gmail.com` ao fazer login
- Favicon trocado de Vercel triangle para ícone FN customizado

### Removido
- `favicon.ico` da Vercel que sobrescrevia o ícone customizado
- Dados iniciais (INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_EXPENSES) — tudo vazio

---

## [2.0.0] — 2026-09-02

### Adicionado
- Marketplace completo com cards de produto, formulário com toggle de variações
- Sistema de variações por produto (tamanho, cor, estoque, preço, custo, comissão, frete, SKU, foto)
- 12 cores predefinidas no seletor de cores (substituiu color picker nativo)
- Upload de foto por variação no formulário de produto
- Página de vendas com lookup de perfil do Supabase
- Página de relatórios com top produtos baseado em vendas reais
- Página de despesas com CRUD completo
- Dashboard com KPIs calculados a partir de vendas reais
- Charts (Recharts) com empty states amigáveis
- Sync indicator na top bar (ponto verde pulsante)
- Auth system com Supabase Auth + profile sync
- Realtime subscriptions para products, sales, expenses
- Background seed para dados iniciais (removido depois)
- Design system "Midnight Teal" completo
- CSS variables (hex, não HSL) com opacidade via color-mix
- `--radius: 0.75rem` no theme
- Tema dark/light com persistência no localStorage
- Admin panel com gestão de usuários
- Hero page com Spline 3D
- Página de estoque com tabela de inventário
- Favicon customizado FN (SVG)

### Modificado
- shadcn/ui usa `@base-ui/react` (sem `asChild`)
- Todas as interfaces expandidas (Product, Sale, Expense, ProductVariation)
- ProductVariation com campos extras: amount, cost, commissionPct, shipping, sku, colorHex, image
- `calcMargin` assinatura expandida para suportar parâmetros opcionais
- RLS policies completamente abertas (FOR ALL USING true)
- DbProvider: estado inicial vazio, sem seed automático
- AuthProvider: profile sempre busca do Supabase, não localStorage

### Corrigido
- CSS variables trocadas de HSL para hex em todo o projeto
- Opacidade usando `color-mix(in srgb, ...)` em vez de `hsl(var(...) / N%)`
- `asChild` removido de SheetTrigger e DropdownMenuTrigger
- Erro de build Supabase (DNS não resolvia) — migrado para novo projeto

---

## [1.0.0] — 2026-09-01

### Adicionado
- Setup inicial do projeto Next.js
- Design system base
- Supabase client configurado
- Estrutura de pastas definida

---

## Notas Técnicas

### Supabase Storage — Avatars
- Bucket: `avatars` (público)
- Path: `avatars/{userId}.{ext}`
- RLS: upload para autenticados, leitura pública
- SQL para criar bucket:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
```

### Supabase — Profiles Notifications
- Campo: `notifications` (jsonb)
- Default: `{"estoque": true, "vendas": true, "relatorios": false}`
- SQL para adicionar:
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb;
```

### Versão Automática
- Script: `scripts/bump-version.js`
- Incrementa patch version a cada build
- Formato: `MAJOR.MINOR.PATCH`
- Data atualizada automaticamente
