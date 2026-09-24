# FN Dash Loja — Futuras Melhorias

Lista de features a serem implementadas no sistema de controle de vendas.
Para adicionar uma nova feature, copiar o template no final do arquivo.

---

## 🛒 Vendas & PDV

- [ ] **Leitor de QR Code** — scan de QR Code do produto para busca rápida no estoque
- [ ] **PDV (Ponto de Venda)** — tela de caixa com seleção rápida de produtos, cálculo automático de troco
- [ ] **Conexão com maquininha de cartão** — integração com SDK de terminais (Stone, PagSeguro, Mercado Pago)
- [ ] **NFCe / SAT** — emissão de nota fiscal eletrônica direto do sistema
- [ ] **Vendas por mesa/comanda** — para lojas com atendimento presencial prolongado

## 📊 Financeiro

- [ ] **Fluxo de caixa diário** — abertura/fechamento de caixa com resumo de entradas e saídas
- [ ] **Conciliação bancária** — importar extratos e cruzar com vendas registradas
- [ ] **DRE simplificado** — Demonstração do Resultado do Exercício automatizada
- [ ] **Alertas de caixa baixo** — notificação quando o saldo disponível fica abaixo do mínimo
- [ ] **Margem por produto/canal** — dashboard de rentabilidade comparando Shopee vs TikTok vs Loja Física

## 📦 Estoque

- [ ] **Código de barras / QR Code** — gerar e imprimir etiquetas com código de barras
- [ ] **Contagem de estoque (inventário)** — modo de contagem física com divergência automática
- [ ] **Transferência entre estoques** — mover estoque da loja física para estoque Shopee/TikTok
- [ ] **Alerta de estoque baixo por canal** — configurar estoque mínimo separado por canal de venda
- [ ] **Fotos de produto com drag-and-drop** — upload múltiplo com reordenamento

## 🏪 Marketplace

- [ ] **Sync automático de estoque** — atualizar estoque na Shopee/TikTok automaticamente
- [ ] **Importação de pedidos Shopee/TikTok** — puxar pedidos automaticamente via API
- [ ] **Publicação em massa** — criar produtos e publicar em todos os canais de uma vez
- [ ] **Preço dinâmico por canal** — preço diferente para Shopee vs TikTok vs Loja Física
- [ ] **Rastreamento de envios** — status de entrega integrado com Correios/transportadoras

## 👥 CRM & Clientes

- [ ] **Cadastro de clientes** — nome, CPF, telefone, histórico de compras
- [ ] **Programa de fidelidade** — pontos por compra, resgate de prêmios
- [ ] **WhatsApp integration** — enviar confirmação de pedido e rastreio via WhatsApp
- [ ] **Avaliação pós-venda** — solicitar review automático após entrega

## 📱 Mobile & Acessibilidade

- [ ] **PWA completo** — funcionar offline, instalar na tela inicial
- [ ] **App mobile dedicado** — React Native para iOS/Android com leitor de QR Code
- [x] **Modo escuro/claro** — alternância com temas distintos por layout
- [ ] **Multi-idioma** — português, inglês, espanhol
- [x] **Sistema de layouts** — 3 layouts distintos (Moderno, Compacto, Clássico) com paleta de cores própria, miniatura animada e transições suaves
- [x] **Variação preto/branco por layout** — cada layout tem paleta dark e light própria (não genérica)

## 🔧 Integrações

- [ ] **Nota fiscal eletrônica (NF-e/NFCe)** — emissão direta pelo sistema
- [ ] **Integração com correios** — cálculo de frete automático
- [ ] **Integração com transportadoras** — J&T, Kangu, Melhor Envio
- [ ] **Google Analytics / Meta Pixel** — rastreamento de conversões
- [ ] **Webhook de pedidos** — receber notificações de novos pedidos em tempo real

## 📈 Analytics & BI

- [x] **Dashboard de vendas em tempo real** — gráfico atualizado a cada 5 segundos
- [ ] **Previsão de demanda** — IA para prever quais produtos venderão mais
- [ ] **Comparativo de canais** — qual canal gera mais lucro líquido
- [ ] **Relatório de absorption rate** — quanto tempo cada produto leva para vender
- [ ] **Exportação para Excel/PDF** — relatórios formatados para impressão

## 🎯 Marketing

- [ ] **Cupons de desconto** — criar cupons por valor, porcentagem ou frete grátis
- [ ] **Campanhas promocionais** — agendar promoções com data de início e fim
- [ ] **Upsell/cross-sell** — sugerir produtos complementares na página de produto
- [ ] **Email marketing** — disparar emails para clientes que não compram há X dias

## 🎨 Design & UX

- [x] **Categorias com subcategorias** — menu lateral com árvore de categorias expansível
- [ ] **Temas personalizáveis** — permitir ao usuário escolher cores de destaque
- [x] **Animações de transição** — transições suaves entre layouts com Framer Motion spring
- [ ] **Modo foco** — esconder elementos não essenciais para concentração
- [ ] **Exportação de dados** — permitir exportar dados do sistema em CSV/JSON
- [ ] **Onboarding animado** — tutorial interativo com spots de destaque e parallax
- [ ] **Video hero na home** — vídeo loop com blend mode no dashboard
- [ ] **Micro-interações em cards** — hover glow dinâmico, counter animation nos KPIs
- [ ] **Page transitions** — transições com slide + fade entre rotas via Framer Motion
- [ ] **Skeleton shimmer** — loading states com gradiente animado por layout
- [ ] **Command palette** — Cmd+K para busca rápida com animação de abertura
- [ ] **Notificações toast animadas** — slide-in com spring easing, dismiss automático

---

## Template para novas features

```markdown
- [ ] **Nome da Feature** — descrição curta do que faz
```
