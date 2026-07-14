# Simplicitude — E-commerce

## ⚠️ Este arquivo é a fonte de verdade do projeto

**Antes de qualquer tarefa**, leia este arquivo — ele descreve fielmente o estado atual
do projeto, para que não seja necessário reler toda a codebase para obter contexto.

**Sempre que fizer uma mudança relevante**, atualize este arquivo na mesma tarefa, antes
de concluir. Conta como relevante: nova rota/página, novo componente, nova função em
`lib/`, mudança no modelo de dados (tabela/coluna do Supabase, mesmo que só no schema e
ainda sem código usando), nova dependência, mudança de convenção, uma pendência de
segurança sendo resolvida, ou um item saindo de "pendente" para "pronto". Isso vale tanto
para tabelas já consumidas pelo código quanto para tabelas criadas no banco mas ainda sem
uso — o schema como um todo precisa estar sempre refletido aqui, não só a parte já
implementada. Mantê-lo fiel é parte de concluir a tarefa, não um extra opcional.

---

## O projeto

E-commerce da **Simplicitude**, marca brasileira de chocolate artesanal com filosofia
"Da Floresta à Fábrica". O site reúne a loja online (conectada ao Supabase), conteúdo
institucional, área administrativa própria e a experiência de meditação guiada da
coleção **Inspirar** (chocolates com meditações em áudio narradas por Bruna Santos).

A experiência original de realidade aumentada em Three.js/WebXR foi **arquivada** (ver
[Experiência AR (arquivada)](#experiência-ar-arquivada) no fim deste arquivo) — os
componentes `ApresentacaoProduto` e `MeditacaoPlayer` do site atual são ports do visual
dessa tela.

Site em produção: **https://simplicitude-ar.netlify.app**
Repositório: GitHub pessoal (rixargolo) + deploy via Netlify

---

## Stack

- **Next.js 16** (App Router, **JavaScript puro — sem TypeScript**), **React 19**
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — banco de dados e Storage de
  imagens, já integrado (loja, admin e auth)
- Alias de import `@/*` → raiz do projeto (`jsconfig.json`)
- Deploy via **Netlify** (`@netlify/plugin-nextjs`, `netlify.toml`)
- Pagamento via **InfinitePay** (Checkout Integrado) — **ainda não implementado**
- A sub-experiência AR/meditação (Three.js r128 via CDN clássico, HTML estático) está
  **arquivada** e fora do build ativo — ver seção dedicada no fim deste arquivo

---

## Estado atual

**Pronto e funcionando:**
- `/quem-somos`, `/meditacao`, `/loja`, `/loja/[slug]` — conteúdo real, dados via Supabase
- `/login` + área `/admin` completa (auth, CRUD de produtos, CRUD de categorias, gestão de
  estoque)
- Loja conectada ao Supabase (produtos reais, imagens via Storage, preços, coleções,
  categorias)
- `/` (home) — vitrine de produtos (carrossel com os mais recentemente cadastrados) logo
  abaixo do hero, via `VitrineProdutos`
- Estoque: `produtos.estoque` é mantido pela trigger `calcular_estoque_movimentacao` a
  partir de `INSERT`s em `estoque_movimentacoes`; admin registra `reposicao`/`ajuste` em
  `/admin/estoque`; loja pública mostra selo "Esgotado" e desabilita "Comprar" quando
  `estoque = 0`
- **Schema completo do banco já existe** para suportar clientes, endereços, pedidos e
  pagamentos (`clientes`, `enderecos`, `pedidos`, `pedido_itens`, `pagamentos`) — ver
  [Modelo de dados](#modelo-de-dados-tabelas-do-projeto) abaixo. Nenhuma dessas 5 tabelas
  tem código/tela usando ainda; foram desenhadas e criadas com RLS antecipando o
  checkout, não é trabalho a refazer

**Pendente / não implementado ainda:**
- `/contato` — placeholder "em construção"
- Checkout real — botão "Comprar" em `/loja/[slug]` é inerte; integração InfinitePay não
  existe (quando existir, é quem vai gerar as movimentações `venda`/`cancelamento` em
  `estoque_movimentacoes` e os registros em `pagamentos`)
- Cadastro/login de cliente (front) — tabelas prontas, sem tela ainda; login obrigatório
  para comprar é a decisão vigente (não definitiva)
- Admin de pedidos
- **Admin CRUD de coleções** — a tabela `colecoes` existe e é lida (dropdown no formulário
  de produto), mas não há tela de gestão para criá-las/editá-las

---

## ⚠️ Pendências de segurança (ler antes de mexer em auth, clientes ou pedidos)

1. **Falta distinção admin/cliente.** Hoje qualquer usuário `authenticated` no Supabase
   Auth é tratado como admin pelas policies de RLS (em `clientes`, `enderecos`, `pedidos`,
   `produtos`, `categorias`, `colecoes`). Isso é seguro *apenas* porque só existem 2
   usuários (donos do projeto). **Antes de abrir cadastro público de clientes**, é
   obrigatório criar um mecanismo de distinção (ex.: coluna `is_admin` em `clientes` ou
   tabela separada) e reescrever as policies de SELECT/UPDATE que hoje usam `to
   authenticated using (true)` para checar esse campo — senão qualquer cliente cadastrado
   passa a enxergar dados (endereços, pedidos) de outros clientes.
2. **Falta policy de INSERT admin em `pedidos`.** Hoje só existe policy de INSERT para o
   próprio cliente (`auth.uid() = cliente_id`), pensada para o checkout. Criação manual de
   pedido pelo admin (ex.: venda por WhatsApp) ainda não tem policy — avaliar quando esse
   fluxo for necessário.
3. **`pagamentos` e movimentação `venda` de `estoque_movimentacoes` não têm INSERT para
   cliente** (proposital — dados sensíveis/auditáveis). Isso **quebra a convenção atual**
   do projeto de "sem server actions/API routes, tudo via client browser autenticado" (ver
   [Convenções](#convenções)): quando o checkout for implementado, a criação desses dois
   registros vai precisar de uma function/rota server-side com a **service role key**
   (que não existe no projeto hoje e não deve nunca ir para o browser). Planejar essa
   rota faz parte do trabalho de implementar o checkout, não é um detalhe a decidir depois.
4. **"Leaked password protection" (HaveIBeenPwned) desabilitada** — requer plano pago do
   Supabase, indisponível no plano atual. Não é bloqueante, só fica pendente até upgrade.

---

## Rotas (`app/`)

Públicas (envolvidas por `Header`/`Footer` via `SiteChrome`):
- **`/`** (`app/page.js`) — Home
- **`/quem-somos`** — institucional
- **`/meditacao`** — hero (faixa de imagem + duotone + listras diagonais + título, no
  padrão de `/quem-somos`) e bloco de introdução da Coleção Inspirar, seguidos da lista de
  produtos com `tem_meditacao=true` via `ApresentacaoProduto` + `MeditacaoPlayer`
- **`/loja`** — grade de produtos ativos
- **`/loja/[slug]`** — detalhe do produto (slug calculado em memória, não é coluna do
  banco)
- **`/contato`** — placeholder

Auth / admin (chrome oculto por `SiteChrome`):
- **`/login`** — formulário email/senha (`signInWithPassword`)
- **`/admin`** — dashboard: saudação de boas-vindas + atalhos para as ações mais comuns
  (novo produto, nova categoria, registrar movimentação). Os links de navegação entre
  seções não ficam mais aqui — moraram para a sidebar persistente (ver abaixo)
- **`/admin/produtos`**, **`/admin/produtos/novo`**, **`/admin/produtos/[id]/editar`** —
  CRUD de produtos (toggle ativo/inativo, upload de imagem); `novo` e `[id]/editar` têm
  link "← Produtos" acima do formulário, voltando para a listagem
- **`/admin/categorias`**, **`/admin/categorias/nova`**,
  **`/admin/categorias/[id]/editar`** — CRUD de categorias; `nova` e `[id]/editar` têm
  link "← Categorias" acima do formulário
- **`/admin/estoque`** — lista produtos com estoque atual, link para registrar
  movimentação por produto
- **`/admin/estoque/nova`** — formulário de movimentação (`MovimentacaoForm`), aceita
  `?produto={id}` para pré-selecionar; só permite tipos `reposicao` e `ajuste` (insere em
  `estoque_movimentacoes`, nunca escreve em `produtos.estoque` diretamente — isso é
  responsabilidade da trigger do banco); tem link "← Estoque" acima do formulário
- **`/admin/estoque/historico`** — histórico de movimentações, mais recente primeiro (já
  tinha link "Voltar" para `/admin/estoque`, mantido como estava)

**Navegação persistente do admin:** `app/admin/layout.js` renderiza um shell de duas
colunas (`app/admin/admin.module.css` → `.shell`) com a sidebar (`app/admin/AdminNav.js`,
`'use client'`) à esquerda e o conteúdo da página à direita (`.content`). `AdminNav` lê a
rota atual via `usePathname()` (primeiro uso desse padrão fora de `SiteChrome`) para
destacar a seção ativa (array `SECOES` — acrescentar uma seção futura, ex. Pedidos ou
Coleções, é só adicionar um item nesse array) e renderiza o `LogoutButton` no rodapé da
sidebar. Em telas `≤640px` a sidebar vira uma barra superior horizontal. Toda a navegação
entre seções (Início/Produtos/Categorias/Estoque) e o logout ficam ali, visíveis em todas
as páginas de `/admin/*` — antes só havia um header estático com marca + logout, sem links
de seção.

---

## Componentes (`app/components/`)

Cada um com `*.module.css` co-locado.

- **`SiteChrome`** (`'use client'`) — esconde Header/Footer em `/login` e `/admin/*` via
  `usePathname()`; usado em `app/layout.js` envolvendo `{children}`
- **`Header`**, **`Footer`** — navegação e rodapé do site público
- **`ApresentacaoProduto`** — bloco de apresentação de produto (galeria de fotos, rótulo
  de categoria via `rotuloCategoria()`, nome, atributos, descrição); usado em
  `/loja/[slug]` e `/meditacao`
- **`VitrineProdutos`** (`'use client'`) — carrossel (scroll-snap horizontal, com setas)
  dos produtos ativos mais recentemente cadastrados (imagem, nome, preço), cada um
  linkando para `/loja/[slug]`, mais link "Ver todos" para `/loja`; usado em `app/page.js`
  logo abaixo do hero, alimentado por `getProdutosRecentes()`
- **`MeditacaoPlayer`** (`'use client'`) — player de áudio da meditação guiada
- **`LogoutButton`** (`'use client'`) — `signOut()` + redirect para `/login`, usado dentro
  de `AdminNav` (`app/admin/AdminNav.js`, ver seção de Rotas — não faz parte de
  `app/components/`, mas segue o mesmo padrão de client component com CSS module)

---

## Camada de dados / Supabase

### Três clients — usar o certo para cada caso

- **`lib/supabase.js`** — client anônimo (`supabase-js` puro), sessão em `localStorage`.
  Só para **leituras públicas** do storefront (segurança via RLS).
- **`lib/supabase/client.js`** — `createBrowserClient` (`@supabase/ssr`), sessão em
  **cookies**. Para client components autenticados (login, forms do admin, toggle,
  logout) — todas as escritas do admin passam por aqui, direto nas tabelas (sem server
  actions, sem API routes).
- **`lib/supabase/server.js`** — `createServerClient` (`@supabase/ssr`, cookies via
  `next/headers`). Para leituras em server components (loja pública via `lib/produtos.js`
  não usa este; admin usa este via `lib/admin/*`).
- **`lib/supabase/middleware.js`** (`updateSession`) — usado pelo `proxy.js`.

### Storefront — `lib/produtos.js`

- `getProdutos()` — `select('*, categorias(nome)')` onde `ativo=true`
- `getProdutosRecentes(limite = 8)` — igual a `getProdutos()`, mas ordenado por
  `created_at desc` e limitado; usado pela vitrine da home (`VitrineProdutos`)
- `rotuloCategoria(produto)` — retorna o nome da categoria só quando
  `mostrar_categoria_no_titulo=true` **e** há `categoria_id` vinculado; senão `null` (sem
  fallback fixo)
- `slugify(nome)`, `getProdutoBySlug(slug)` — não há coluna `slug` em `produtos`; o match
  é feito em memória sobre `getProdutos()`

### Admin — `lib/admin/produtos.js`, `lib/admin/categorias.js`, `lib/admin/estoque.js`

- `getAllProdutos()`, `getProdutoById(id)`, `getColecoes()`, `getCategorias()`
- `getAllCategorias()`, `getCategoriaById(id)`
- `getProdutosComEstoque()` — `{ produtos, colecoes }`, todos os produtos (ativos e
  inativos) com estoque atual + coleções para exibir o nome
- `getMovimentacoes()` — histórico de `estoque_movimentacoes` (`select('*,
  produtos(nome)')`), mais recente primeiro, limitado a 200 linhas
- Todas usam o client server (`lib/supabase/server.js`), então enxergam também produtos
  inativos
- A escrita de movimentações (`INSERT` em `estoque_movimentacoes`) é feita direto no
  client component `MovimentacaoForm` (`app/admin/estoque/MovimentacaoForm.js`), seguindo
  o mesmo padrão de `ProdutoForm`/`CategoriaForm` — nunca em `lib/admin/estoque.js`

### Modelo de dados (tabelas do projeto)

**Em uso pelo código:**

- **`produtos`** — `id`, `nome`, `descricao`, `atributos`, `peso_gramas`,
  `preco_centavos` (inteiro, centavos), `colecao_id` (FK, nullable), `categoria_id` (FK,
  nullable), `mostrar_categoria_no_titulo` (bool), `tem_meditacao` (bool), `audio_url`,
  `ativo` (bool), `imagem_url`, `estoque` (nullable — mantido pela trigger, nunca por
  `UPDATE` da aplicação), `created_at` (usado por `getProdutosRecentes()` para ordenar a
  vitrine da home pelos mais recentemente cadastrados)
- **`categorias`** — `id`, `nome`, `slug`, `descricao` — tipo do produto, usado como
  rótulo de exibição (ex.: "Chocolate", "Combo")
- **`colecoes`** — `id`, `nome`, `slug`, `descricao` — linha de marketing/produto (ex.:
  "Coleção Inspirar"); **conceito diferente de categoria** (ver acima)
- **`estoque_movimentacoes`** — `id`, `produto_id` (FK), `tipo` (constraint: `venda`,
  `reposicao`, `ajuste`, `cancelamento` — hoje o admin só cria `reposicao`/`ajuste`;
  `venda`/`cancelamento` são reservados para o checkout), `quantidade` (inteiro, pode ser
  negativo em `ajuste`), `pedido_id` (FK, nullable — preenchido quando `tipo` for `venda`
  ou `cancelamento`), `observacao` (nullable), `estoque_resultante`, `created_at`. A
  trigger `calcular_estoque_movimentacao` calcula `estoque_resultante`, atualiza
  `produtos.estoque` e **bloqueia com erro** se o resultado ficar negativo (usa `for
  update` na linha do produto para evitar condição de corrida) — a aplicação só faz
  `INSERT` nessa tabela, nunca `UPDATE` em `produtos.estoque`

**Criadas no banco, com RLS, ainda sem código/tela usando (schema pronto para o
checkout):**

- **`clientes`** — `id` (mesmo `id` de `auth.users`, FK), `nome`, `telefone`, `cpf`,
  `created_at`, `updated_at`. Email não duplica aqui — vem de `auth.users` via join.
  Cliente só vê/edita a própria linha; ver pendência de segurança #1.
- **`enderecos`** — `id`, `cliente_id` (FK), `apelido`, `cep`, `rua`, `numero`,
  `complemento`, `bairro`, `cidade`, `estado`, `padrao` (bool), `created_at`. Cliente pode
  ter múltiplos endereços salvos.
- **`pedidos`** — `id`, `cliente_id` (FK, not null), `endereco_id` (FK, nullable — null se
  retirada), `status` (`pendente`/`pago`/`preparando`/`enviado`/`entregue`/`cancelado`),
  `metodo_entrega` (`transportadora`/`retirada`), `valor_produtos_centavos`,
  `valor_frete_centavos`, `valor_total_centavos`, `codigo_rastreio`, `observacoes`, e
  campos `entrega_*` (rua, numero, complemento, bairro, cidade, estado, cep) que são um
  **snapshot** do endereço copiado de `enderecos` no momento da compra — não são
  atualizados retroativamente se o cliente editar o endereço original depois.
  `endereco_id` fica só como referência/rastreabilidade. Edição do endereço de um pedido
  já feito é feita direto nos campos `entrega_*` daquele pedido (decisão: só admin pode
  fazer isso, e só antes do status virar `preparando`/`enviado`, quando essa tela for
  construída — não implementado ainda).
- **`pedido_itens`** — `id`, `pedido_id` (FK), `produto_id` (FK), `nome_produto` e
  `preco_unitario_centavos` (**snapshot** do produto no momento da compra — não refletem
  edições futuras do produto), `quantidade`, `subtotal_centavos`.
- **`pagamentos`** — `id`, `pedido_id` (FK), `gateway` (texto livre, agnóstico — ex.:
  `infinitepay`), `status` (`pendente`/`aprovado`/`recusado`/`estornado`/`expirado`),
  `valor_centavos`, `referencia_externa_id`, `link_pagamento_url`, `metodo` (opcional:
  pix/cartao/boleto), `pago_em`, `created_at`, `updated_at`. Um `pedido_id` pode ter mais
  de uma linha ao longo do tempo (link expirado, nova tentativa) — não há coluna "ativo",
  a linha vigente é a mais recente por `created_at`. Ver pendência de segurança #3 sobre
  como isso deve ser escrito quando o checkout existir.

- **Storage**: bucket `produtos`, caminho `{produto_id}/principal.{ext}`, URL pública com
  cache-buster `?v={timestamp}`

---

## Auth

Login em `app/login/page.js` (`signInWithPassword`, sessão em cookies) → redirect
`/admin`. Proteção em **duas camadas**:
1. Middleware **`proxy.js`** (padrão Next 16 — renomeado de `middleware.js`, exporta
   `proxy()`), `matcher: ['/admin/:path*', '/login']`, delega a
   `lib/supabase/middleware.js`
2. Guard defensivo em `app/admin/layout.js` (re-checa `getUser()` no server, redireciona
   se não autenticado)

Não há service-role key no projeto — a segurança dos dados depende inteiramente de
**Row Level Security (RLS)** configurada no Supabase. Isso muda quando o checkout for
implementado — ver pendência de segurança #3.

---

## Convenções

- CSS Modules (`*.module.css`) co-locados, classes em camelCase
- Tokens de marca em `app/globals.css`: `--bg #faf9f8`, `--green #133429`,
  `--green-nav #1e3706`, `--brown #6b513f`, `--caramel #a17a5e`, `--cream #F5EDD8`,
  `--border #e5ddd4`, `--gold #D4A843`
- Fontes via `next/font/google` em `app/layout.js`: `--font-cinzel`,
  `--font-eb-garamond`, `--font-cormorant`, `--font-dancing`
- Preços sempre em **centavos** (inteiro) no banco; formatação BRL na exibição
- Selo "Esgotado" (`estoque === 0` em `/loja` e `/loja/[slug]`, desabilita "Comprar") usa
  comparação estrita — `estoque` é nullable e `null` significa "não controlado", não deve
  virar "Esgotado"
- **Sem TypeScript** — projeto é JavaScript puro
- **Sem server actions / API routes** para as operações de admin atuais — escrita direto
  nas tabelas via client browser autenticado, protegida por RLS. **Exceção já prevista:**
  quando o checkout for implementado, criação de registros em `pagamentos` e
  movimentações `venda` em `estoque_movimentacoes` vai exigir uma rota server-side com
  service role — ver pendência de segurança #3.
- **Teste visual é o usuário quem faz.** Depois de uma mudança de UI, rodar apenas
  verificação automatizada (`npm run build`, lint, testes) — não abrir navegador, não
  tirar screenshot, não subir servidor dev só para inspecionar visualmente. O usuário
  confere o resultado no navegador dele.

---

## Env / deploy / scripts

- Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver
  `.env.local.example`)
- `next.config.mjs` — `images.remotePatterns` liberando o host do Storage do Supabase
- `netlify.toml` — build `next build` + `@netlify/plugin-nextjs`
- `scripts/migrar-imagens-produtos.mjs` — migração one-off e idempotente de imagens no
  Storage para a estrutura `{id}/principal.{ext}`; usa `SUPABASE_ADMIN_EMAIL` /
  `SUPABASE_ADMIN_PASSWORD`
- `scripts/vincular-audio-meditacao.mjs` — script one-off e idempotente que vincula os
  áudios de meditação guiada (bucket `meditacao`) aos produtos Esperança/Serenidade,
  preenchendo `audio_url` (já rodado); mesmo padrão de autenticação admin do script acima

---

## Experiência AR (arquivada)

Sub-experiência de realidade aumentada/meditação do chocolate **Alegria** (Three.js r128
via CDN clássico + WebXR), que era o projeto original antes da transformação em
e-commerce. Arquivada em 2026-07-09, não é mais servida pelo site (pode retornar via app
nativo). Os componentes `ApresentacaoProduto` e `MeditacaoPlayer` do site atual são ports
do visual dessa tela de boas-vindas.

**Caminho:** `__ARCHIVE/experiencias/alegria-ar/` (pasta ignorada pelo git — arquivos
existem localmente, não são versionados nem publicados)

**Documentação técnica completa** (stack, arquitetura WebXR, partículas, texto 3D, fases
do áudio, princípios do projeto): ver
`__ARCHIVE/experiencias/alegria-ar/DOCS.md`.

---

## O que NÃO fazer

- Não implementar checkout, conteúdo novo ou mudança de escopo sem instruções explícitas
- Não alterar o conteúdo da sub-experiência AR arquivada em
  `__ARCHIVE/experiencias/alegria-ar/` — preservar intacta caso seja retomada
- Não usar TypeScript — o projeto é JavaScript puro
- Não deixar este arquivo desatualizado após uma mudança relevante — inclusive mudanças
  de schema que ainda não têm código consumindo (ver nota no topo do arquivo)