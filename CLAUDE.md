# Simplicitude — E-commerce

## ⚠️ Este arquivo é a fonte de verdade do projeto

**Antes de qualquer tarefa**, leia este arquivo — ele descreve fielmente o estado atual
do projeto, para que não seja necessário reler toda a codebase para obter contexto.

**Sempre que fizer uma mudança relevante**, atualize este arquivo na mesma tarefa, antes
de concluir. Conta como relevante: nova rota/página, novo componente, nova função em
`lib/`, mudança no modelo de dados (tabela/coluna do Supabase), nova dependência, mudança
de convenção, ou um item saindo de "pendente" para "pronto". Mantê-lo fiel é parte de
concluir a tarefa, não um extra opcional.

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
- `/` (home) — parcialmente pronta; a vitrine de produtos ainda é um placeholder
- Estoque: `produtos.estoque` é mantido pela trigger `calcular_estoque_movimentacao` a
  partir de `INSERT`s em `estoque_movimentacoes`; admin registra `reposicao`/`ajuste` em
  `/admin/estoque`; loja pública mostra selo "Esgotado" e desabilita "Comprar" quando
  `estoque = 0`

**Pendente / não implementado ainda:**
- `/contato` — placeholder "em construção"
- Vitrine de produtos na home
- Checkout real — botão "Comprar" em `/loja/[slug]` é inerte; integração InfinitePay não
  existe (quando existir, é quem vai gerar as movimentações `venda`/`cancelamento` em
  `estoque_movimentacoes`)
- Admin de pedidos
- **Admin CRUD de coleções** — a tabela `colecoes` existe e é lida (dropdown no formulário
  de produto), mas não há tela de gestão para criá-las/editá-las

---

## Rotas (`app/`)

Públicas (envolvidas por `Header`/`Footer` via `SiteChrome`):
- **`/`** (`app/page.js`) — Home
- **`/quem-somos`** — institucional
- **`/meditacao`** — lista produtos com `tem_meditacao=true` via `ApresentacaoProduto` +
  `MeditacaoPlayer`
- **`/loja`** — grade de produtos ativos
- **`/loja/[slug]`** — detalhe do produto (slug calculado em memória, não é coluna do
  banco)
- **`/contato`** — placeholder

Auth / admin (chrome oculto por `SiteChrome`):
- **`/login`** — formulário email/senha (`signInWithPassword`)
- **`/admin`** — dashboard, links para produtos, categorias e estoque
- **`/admin/produtos`**, **`/admin/produtos/novo`**, **`/admin/produtos/[id]/editar`** —
  CRUD de produtos (toggle ativo/inativo, upload de imagem)
- **`/admin/categorias`**, **`/admin/categorias/nova`**,
  **`/admin/categorias/[id]/editar`** — CRUD de categorias
- **`/admin/estoque`** — lista produtos com estoque atual, link para registrar
  movimentação por produto
- **`/admin/estoque/nova`** — formulário de movimentação (`MovimentacaoForm`), aceita
  `?produto={id}` para pré-selecionar; só permite tipos `reposicao` e `ajuste` (insere em
  `estoque_movimentacoes`, nunca escreve em `produtos.estoque` diretamente — isso é
  responsabilidade da trigger do banco)
- **`/admin/estoque/historico`** — histórico de movimentações, mais recente primeiro

---

## Componentes (`app/components/`)

Cada um com `*.module.css` co-locado.

- **`SiteChrome`** (`'use client'`) — esconde Header/Footer em `/login` e `/admin/*` via
  `usePathname()`; usado em `app/layout.js` envolvendo `{children}`
- **`Header`**, **`Footer`** — navegação e rodapé do site público
- **`ApresentacaoProduto`** — bloco de apresentação de produto (galeria de fotos, rótulo
  de categoria via `rotuloCategoria()`, nome, atributos, descrição); usado em
  `/loja/[slug]` e `/meditacao`
- **`MeditacaoPlayer`** (`'use client'`) — player de áudio da meditação guiada
- **`LogoutButton`** (`'use client'`) — `signOut()` + redirect para `/login`, usado no
  layout admin

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

### Modelo de dados (tabelas usadas pelo código)

- **`produtos`** — `id`, `nome`, `descricao`, `atributos`, `peso_gramas`,
  `preco_centavos` (inteiro, centavos), `colecao_id` (FK, nullable), `categoria_id` (FK,
  nullable), `mostrar_categoria_no_titulo` (bool), `tem_meditacao` (bool), `audio_url`,
  `ativo` (bool), `imagem_url`, `estoque` (nullable — mantido pela trigger, nunca por
  `UPDATE` da aplicação)
- **`categorias`** — `id`, `nome`, `slug`, `descricao` — tipo do produto, usado como
  rótulo de exibição (ex.: "Chocolate", "Combo")
- **`colecoes`** — `id`, `nome` — linha de marketing/produto (ex.: "Coleção Inspirar");
  **conceito diferente de categoria** (ver acima)
- **`estoque_movimentacoes`** — `id`, `produto_id` (FK), `tipo` (constraint: `venda`,
  `reposicao`, `ajuste`, `cancelamento` — hoje o admin só cria `reposicao`/`ajuste`;
  `venda`/`cancelamento` são reservados para o checkout), `quantidade` (inteiro, pode ser
  negativo em `ajuste`), `observacao` (nullable), `estoque_resultante`, `created_at`. A
  trigger `calcular_estoque_movimentacao` calcula `estoque_resultante`, atualiza
  `produtos.estoque` e **bloqueia com erro** se o resultado ficar negativo — a aplicação
  só faz `INSERT` nessa tabela, nunca `UPDATE` em `produtos.estoque`
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
**Row Level Security (RLS)** configurada no Supabase.

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
- **Sem server actions / API routes** para as operações de admin — escrita direto nas
  tabelas via client browser autenticado, protegida por RLS

---

## Env / deploy / scripts

- Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver
  `.env.local.example`)
- `next.config.mjs` — `images.remotePatterns` liberando o host do Storage do Supabase
- `netlify.toml` — build `next build` + `@netlify/plugin-nextjs`
- `scripts/migrar-imagens-produtos.mjs` — migração one-off e idempotente de imagens no
  Storage para a estrutura `{id}/principal.{ext}`; usa `SUPABASE_ADMIN_EMAIL` /
  `SUPABASE_ADMIN_PASSWORD`

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
- Não deixar este arquivo desatualizado após uma mudança relevante
