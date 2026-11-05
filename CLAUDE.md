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

Site em produção: **https://simplicitude-ar.netlify.app** (o domínio próprio
`simplicitude.com.br` entra no go-live da 1ª versão pública)
Repositório: GitHub pessoal (rixargolo) + deploy via Netlify

---

## Produto e objetivo da v1

Plano completo (auditoria, decisões, lista priorizada, contrato de dados, pendências):
[`docs/plano-v1.md`](docs/plano-v1.md). Regras de portabilidade:
[`docs/adr/0001-portabilidade.md`](docs/adr/0001-portabilidade.md) — **ler antes de adicionar
qualquer dependência de plataforma** (Netlify/Supabase).

- **Objetivo:** ampliar os canais de venda. Em 6 meses o fluxo de venda deve ser totalmente
  automatizado (só o manuseio do produto é humano). Hoje a venda online é só por WhatsApp; o
  padrão é feira, ponto de distribuição e B2B presencial. **B2B fica fora do site na v1.**
- **Mote:** "Salvar o mundo comendo chocolate".
- **Personas, em ordem de prioridade:** (3) bem-estar/saúde ligado à meditação, (2) presente,
  (1) consumidor de guloseimas, (4) B2B.
- **Descoberta:** indicação, Instagram, pontos de venda físicos — assumir muito tráfego mobile
  vindo do Instagram.
- **Pagamento:** os meios (PIX, cartão etc.) são os que o Checkout InfinitePay oferece; o site
  não decide meio por faixa de valor.
- **Entrega:** rota regional (de carro), Bahia toda, Brasil via Correios/transportadora, mais
  retirada. Produção tem ociosidade; já há quem separe e envie.
- **Marco da 1ª versão pública:** loja completa com checkout InfinitePay no domínio próprio,
  com CNPJ/endereço no rodapé, privacidade, entrega/trocas e Open Graph. Escopo: Home, Loja,
  Meditação (o redesign de `/meditacao` fica para depois do go-live).
- **Decisões vigentes:** checkout como **convidado** (a decisão antiga de login obrigatório
  está superada); vitrine da home com título derivado do critério de ordem — `created_at` = "Novidades",
  `destaque_ordem` curado sem dado de venda = "Favoritos", só ordem real da dona ou histórico de
  pedidos = "Mais vendidos" (**nunca "Mais vendidos" ordenado por `created_at`**);
  frete por tabela de zonas por faixa de CEP (Melhor Envio depois); sem glossário e só o ADR
  0001 (as demais decisões entram aqui em uma linha).
- **Fluxo de trabalho da v1:** o redesign mora na branch `v1` (preview no Netlify, `noindex`);
  `main` segue sendo o site atual até o go-live. Mockups de UI ficam atrás de
  `NEXT_PUBLIC_MOCKUPS` e nunca vão para o domínio real. **A1 (infra de preview) está concluído**
  (branch `v1`, ver [Env / deploy / scripts](#env--deploy--scripts)): branch deploy da `v1`
  ativo e envs configuradas no Netlify (`NEXT_PUBLIC_MOCKUPS=1` só nos contextos
  branch-deploy/deploy-preview), verificado em produção e na `v1`. **A2 (tokens + Header/Footer)
  está no código. A3 (hero da home em carrossel) está no código, com as 4 fotos reais ligadas
  (ver `HeroCarrossel`). A5 (categorias na home) está no código, sem fotos (ver `GradeCategorias`). A6 (`/loja` com filtro por categoria) está no código (ver `CardProduto`).** Mockups existentes: só `/bem-fazer` e `/assinaturas` ("Em breve"); os de
  carrinho/checkout vêm depois — ver a lista priorizada no plano.
- **Ordem do front:** A1 (preview) → A2 (tokens, header/footer) → A3/A4/A5 (home) → A6/A7 (loja,
  produto, só leitura) → mostrar o preview à dona; só depois o contrato de dados (A0) e
  carrinho/checkout/pedido (A8–A10). Na 1ª rodada o produto não tem botão de compra.

---

## Paleta e tipografia oficiais

**Paleta oficial da marca:** Bege Background `#f6f3ea`, Azul Simplicitude `#272a5c`, Verde
Musgo `#27401e`. Em `app/globals.css` vira **tokens por papel** (não por cor), para o seletor de
presets do preview (`SeletorPaleta`, ver abaixo) trocar a paleta inteira só por variáveis CSS:
`--cor-fundo` (bege), `--cor-texto` (azul), `--cor-destaque` (verde: nomes de produto, item ativo
do menu, foco), `--cor-botao`/`--cor-botao-texto`, `--cor-rodape`/`--cor-rodape-texto`, mais
`--raio-botao` (pílula). Derivados via `color-mix` (seguem o preset sozinhos): `--cor-texto-suave`,
`--cor-superficie`, `--cor-borda`. **Código novo usa só esses papéis.**

> ⚠️ **Aliases temporários:** `--bg`, `--green`, `--green-nav`, `--brown`, `--caramel`,
> `--border`, `--cream`, `--cream-name` seguem existindo em `globals.css` só como aliases dos
> papéis (as páginas ainda não refeitas já pegam a paleta nova); `--gold` é o único hex antigo
> (só o admin usa). Cada item do plano (A4–A7, A12) troca pelos papéis nos arquivos que
> reescreve; o bloco some quando ninguém usar. Hex soltos remanescentes: admin e os scrims
> pretos de `/quem-somos` e de `/meditacao` (e do `app/home.module.css`, hoje sem uso, ver `/`). O hero da home (A3) já
> usa só papéis.

**Tipografia:** provisória, centralizada em tokens (`--font-display` Cinzel, `--font-body` EB
Garamond, `--font-accent` Cormorant Garamond, definidos em `globals.css` sobre as variáveis do
`next/font/local` em `app/layout.js`, arquivos em `app/fonts/`). Nenhum CSS cita as famílias
direto: trocar pela oficial é mexer só em `globals.css`, `app/layout.js` e `app/fonts/`. Dancing Script foi removida.

**Contato vigente:** WhatsApp **(73) 9 2002-6708**; e-mail `viva@simplicitude.com.br`
(inalterado); Instagram `@simplicitude.co`. O `Footer` já usa esses dados. **CNPJ/razão
social:** pendentes com a dona — o rodapé mostra "Razão social e CNPJ a confirmar" só com
`NEXT_PUBLIC_MOCKUPS=1`; em produção a linha some até o dado chegar (check do D2).

---

## Infra: DNS e e-mail

- Domínio registrado no registro.br, mas **DNS e e-mail principal estão na GoDaddy
  (temporária)** — nameservers `ns41/42.domaincontrol.com`, MX/SPF `secureserver.net`, DMARC
  `p=reject`. A intenção é sair da GoDaddy depois do go-live, **como mudança separada**.
- **Não alterar MX, SPF, `_dmarc` nem mudar os nameservers** como parte do go-live: só `A @` e
  `www` mudam. Detalhes e rollback em `docs/plano-v1.md` (B5).
- E-mail transacional (Resend) sairá pelo subdomínio `send.simplicitude.com.br`.

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
- `/` (home) — hero em carrossel (`HeroCarrossel`, 4 slides: Loja, Bem-estar, Quem somos, Presentes, todos com
  foto real; slide sem foto vira placeholder no preview e é omitido em produção) e, logo abaixo, a vitrine de produtos
  em duas colunas (título derivado do critério de ordem — hoje "Novidades" —, chips de
  categoria e carrossel de cards), via `VitrineProdutos`; logo abaixo, a seção de categorias
  (`GradeCategorias`, cartões tipográficos sem foto com dados reais), que substituiu o teaser antigo de meditação
- Estoque: `produtos.estoque` é mantido pela trigger `calcular_estoque_movimentacao` a
  partir de `INSERT`s em `estoque_movimentacoes`; admin registra `reposicao`/`ajuste` em
  `/admin/estoque`; loja pública mostra selo "Esgotado" e desabilita "Comprar" quando
  `estoque = 0`
- **Schema completo do banco já existe** para suportar clientes, endereços, pedidos e
  pagamentos (`clientes`, `enderecos`, `pedidos`, `pedido_itens`, `pagamentos`) — ver
  [Modelo de dados](#modelo-de-dados-tabelas-do-projeto) abaixo. Nenhuma dessas 5 tabelas
  tem código/tela usando ainda; foram desenhadas e criadas com RLS antecipando o
  checkout, não é trabalho a refazer

**Pendente / não implementado ainda** (ordem e dependências em
[`docs/plano-v1.md`](docs/plano-v1.md), seção 3):
- Conteúdo de `/bem-fazer` e `/assinaturas` (hoje mockups "Em breve" só no preview) e confirmar
  com a dona o rótulo "Bem-estar" para `/meditacao`
- Checkout real — botão "Comprar" em `/loja/[slug]` é inerte; integração InfinitePay não
  existe (quando existir, é quem vai gerar as movimentações `venda`/`cancelamento` em
  `estoque_movimentacoes` e os registros em `pagamentos`)
- Checkout de **convidado**: exige migration (`pedidos.cliente_id` nullable, campos
  `comprador_*`, `token_acesso`). Cadastro/login de cliente fica para depois da v1; as
  tabelas `clientes`/`enderecos` seguem prontas, sem tela
- Schema/migrations **não estão versionados no repo** (só existem no painel do Supabase) e
  não há ambiente de staging — itens B-1/B-2 do plano
- **Fotos do hero:** as 4 de `public/home/hero_slide_{1..4}.webp` já estão ligadas aos slides
  (ordem 1→4 = Loja, Bem-estar, Quem somos, Presentes). Se a dona trocar alguma, **receita de
  otimização**: WebP `quality: 85` (`effort: 6`, `smartSubsample: true`) com `sharp` (já está em
  `node_modules`, vem do Next; comando avulso, sem script no repo), **mesmas dimensões** (16:9,
  mín. 1920×1080, ideal 2400×1350, sem upscale), PSNR ≥ ~38 dB contra o original (a foto 3, com céu,
  precisou de q90). Os PNGs originais ficam em `_DOCS/originais-hero/` (fora do git). Mantém o
  check do D2: todo slide do hero com foto real
- **Foto de categoria:** `categorias` não tem `imagem_url`. A coluna (+ upload no `CategoriaForm`) pertence ao grupo da migration C2 do plano; `GradeCategorias` já renderiza a foto quando o campo vier, falta incluí-lo no `select` de `getCategoriasComProdutos()`. A foto em si depende da dona
- Testes: só Vitest (`npm test`, pasta `tests/`, cobre a infra de preview, o menu/mockups, as paletas (inclusive o contraste dos cartões de categoria), o carrossel do hero, o critério/título da vitrine, `getCategoriasComProdutos` e `filtrarPorCategoria`). Sem lint nem CI
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
   **Situação (verificada em 2026-11-04):** o cadastro público do Supabase Auth está
   **desligado** (`disable_signup: true`) — religá-lo no painel reabre a falha. O checkout de
   convidado da v1 não precisa de cadastro; `is_admin()` + policies é obrigatório **antes de
   contas de cliente e antes de criar um 3º usuário no Auth** (esse 3º usuário viraria admin
   pleno). Um vigia no GitHub Actions deve avisar se o cadastro for religado (plano, B7).
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
- **`/`** (`app/page.js`) — Home: `HeroCarrossel` (array `SLIDES` no próprio arquivo, filtrado
  por `slidesVisiveis()`; sem slide com foto o hero não renderiza), `VitrineProdutos`,
  e `GradeCategorias` (a meditação é coberta pelo slide do hero e pelo menu "Bem-estar"; Quem
  Somos pelo slide do hero e pelo menu). O teaser duotone "Da floresta à fábrica" foi **removido
  da home em 2026-11-05, só visualmente**: `app/home.module.css` (`.duotone*`) segue no repo,
  sem nenhum import, para ser reaproveitado se a seção voltar
- **`/quem-somos`** — institucional
- **`/meditacao`** — hero (faixa de imagem + duotone + listras diagonais + título, no
  padrão de `/quem-somos`) e bloco de introdução da Coleção Inspirar, seguidos da lista de
  produtos com `tem_meditacao=true` via `ApresentacaoProduto` + `MeditacaoPlayer`
- **`/loja`** — `h1` (nome da categoria ativa ou "Loja") + frase, chips de categoria ("Todas" + só categorias com ≥1 produto ativo, `getCategoriasComProdutos()`; rolam na horizontal no celular, quebram linha a partir de 900px) e grade de `CardProduto` (2 colunas no celular). Filtro por `?categoria=slug`, no servidor (`searchParams`, links `<Link>`, funciona sem JS). **Slug desconhecido, vazio ou repetido = "Todas"** (`filtrarPorCategoria`), nunca página vazia. Zero produtos ativos → frase de estado vazio com link para `/quem-somos`. A página é dinâmica (`ƒ`) por causa do `searchParams`
- **`/loja/[slug]`** — detalhe do produto (slug calculado em memória, não é coluna do
  banco)
- **`/bem-fazer`**, **`/assinaturas`** — mockups "Em breve" (`EmBreve`); só existem com
  `NEXT_PUBLIC_MOCKUPS=1` (`exigirMockups()` → 404 em produção, e saem do menu)
- `/contato` foi **removida** (contato vive no rodapé)

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
- **`Header`** (`'use client'`) — menu LOJA, BEM-ESTAR, BEM-FAZER, QUEM SOMOS, ASSINATURAS
  (vindo de `itensMenu()`, `lib/navegacao.js`); logo leva à home (sem item "Início"); item ativo
  via `usePathname()` + `aria-current`; sem linha divisória; abaixo de 960px vira botão de texto
  "Menu"/"Fechar". **`Footer`** — campo `--cor-rodape` com logo, lema, contatos (WhatsApp via
  `wa.me`), links do mesmo `itensMenu()` e linha legal (CNPJ só no preview).
- **`EmBreve`** — página mockup "Em breve" com botão pílula para `/loja`
- **`SeletorPaleta`** (`'use client'`) — barra fina no topo com select de paleta, só com
  `NEXT_PUBLIC_MOCKUPS=1`. Troca as variáveis no `<html>`, grava no `localStorage` e atualiza
  `?paleta=` na URL (`replaceState`) para o link já levar a versão. A comparação com a env é
  **literal** dentro do componente de propósito: é o que faz o Next descartar o seletor e os
  presets do bundle de produção. Só funciona porque `next.config.mjs` fixa `env.NEXT_PUBLIC_MOCKUPS`
  (`''` se ausente): sem a env definida o Next não inlina e o código vaza para o bundle (verificado;
  chamar `mockupsLigados()` também não bastava). Conferir com `grep -rF rodapeTexto .next/static` num build sem a flag
- **`LogoAnimado`** (`'use client'`) — usado dentro do `<Link href="/">` do `Header` no
  lugar do `<Image>` direto da wordmark. Na **1ª carga da Home (`/`) em cada sessão do
  navegador**, toca uma animação de "escrita à mão" (traçado sequencial via
  `stroke-dasharray`/`stroke-dashoffset`, com timing portado 1:1 de um protótipo HTML de
  referência — `MIN_DURATION=220`, `SPEED=40`) sobre um `<svg>` inline com os traços da
  wordmark (`viewBox="0 0 172.18108 31.367828"`, paths na ordem de desenho do arquivo de
  referência `simplicitude-logo-traco.svg` — esse SVG **não** foi movido para `public/`,
  os paths estão embutidos no componente); ao terminar, faz crossfade para a wordmark estática, que é a base já
  renderizada por baixo o tempo todo. **A base é um `<span role="img" aria-label="Simplicitude">`
  com `mask` do `/marca/logo-simplicitude-677w.png` + `background: currentColor`** (o PNG tem
  alpha), e os traços do SVG usam `stroke="currentColor"`: a logo acompanha `--cor-texto` e os
  presets de paleta. O `Footer` usa a mesma máscara. Decide
  se anima checando, nessa ordem, `pathname !== '/'`,
  `matchMedia('(prefers-reduced-motion: reduce)')` e a chave de
  **`sessionStorage`** `simplicitude:logoAnimada` (**primeiro uso de `sessionStorage` no
  projeto** — em revisitas na mesma aba, ou em qualquer página fora da Home, mostra
  direto a logo estática, sem tocar o traçado de novo). O `Header` segue dono do `<Link>`
  (cujo `onClick` fecha o menu mobile); `LogoAnimado` só cuida do conteúdo visual da logo.
  **Anti-flash pré-hidratação:** como o `useLayoutEffect` só age depois que o JS hidrata,
  ele sozinho não evita que o PNG estático (já presente no HTML vindo do servidor) pinte
  por um instante antes do traçado começar — perceptível principalmente em desktop, onde
  o 1º paint é mais rápido que o download/hidratação do JS. Por isso há um `<script>`
  inline síncrono em `app/layout.js` (primeiro filho de `<body>`, antes de
  `<SiteChrome>`), que roda durante o parse do HTML e replica as mesmas condições do
  componente (rota `/`, mesma chave de `sessionStorage`, `prefers-reduced-motion`); se
  vai animar, adiciona a classe `logo-animar` em `document.documentElement`. Uma regra
  global em `app/globals.css` (`html.logo-animar [data-logo-base] { opacity: 0; }`) usa
  essa classe para esconder a wordmark (marcada com o atributo `data-logo-base`) já no 1º
  paint. Assim que `LogoAnimado` hidrata, remove a classe no mesmo `useLayoutEffect` de
  decisão (antes de decidir se anima) — dali em diante quem controla a opacidade do PNG é
  o React (fases `drawing`/`settling`/`idle`), não mais a classe global. Script e
  componente precisam permanecer com as mesmas condições/chave — mudou um, muda o outro.
  **Replay por clique:** na Home, clicar na logo refaz o traçado (`onClick` no `<span>`
  raiz; estado `ciclo` nas deps do efeito de desenho reinicia a animação mesmo no meio
  dela; ignora a chave de `sessionStorage`, mas respeita `prefers-reduced-motion`). Fora
  da Home o clique só navega para `/` via o `<Link>` do `Header`.
- **`ApresentacaoProduto`** — bloco de apresentação de produto (galeria de fotos, rótulo
  de categoria via `rotuloCategoria()`, nome, atributos, descrição); usado em
  `/loja/[slug]` e `/meditacao`
- **`HeroCarrossel`** (`'use client'`) — hero da home. Props `slides` (`{ id, rotulo, titulo,
  texto, cta: { rotulo, href }, imagem?: { src, alt, posicao? } }`; `posicao` = `object-position`
  para enquadrar a foto quando a tela larga corta o 16:9 em cima e embaixo — slide 3 com
  `'50% 0%'` para não cortar as cabeças; slide 1 com `'50% 70%'` (cabeça no topo e cacau na base:
  mostra o rosto com os óculos e o cacau inteiro; em notebook bem baixo o rosto corta na boca)) e `layout` (padrão `sobreposto`: foto em
  largura total, cartão **translúcido** (70% de `--cor-fundo` + blur, cantos de 24px; no celular
  volta a sólido, fora da foto) no canto inferior esquerdo — o teste de paletas lê esse 70% do
  CSS e exige 4,5:1 do texto com foto preta ou branca por trás —, controles numa pílula sólida
  escura (`--cor-rodape`/`--cor-rodape-texto`, para não se emendar ao cartão claro) **dentro da
  foto**, embaixo — centralizada só a partir de 1440px; abaixo disso, no canto direito, para não
  encostar no cartão (corte a rever se mudar o nº de slides ou o tamanho do cartão); no celular, foto em cima, cartão embaixo e controles
  abaixo, no fluxo). **O markup é o mesmo para todo layout**; o que muda
  fica no mapa `LAYOUTS` do componente (`sizes` da imagem e `especFoto`, a **constante única** do
  texto de especificação da foto) e em blocos `.<layout> …` do CSS — um 2º layout (ex.: tela
  dividida) é uma entrada nova no mapa + um bloco de CSS. Rolagem automática de 6 s, pausa por
  hover, foco de teclado (`:focus-visible`), toque e botão Pausar/Continuar; sem rolagem com
  `prefers-reduced-motion` (e o botão some). Só o slide 0 usa `preload` na imagem; título do 1º
  slide é `h1`, os demais `h2`. Cartão e botão só usam papéis (`--cor-fundo`/`--cor-texto`/
  `--cor-botao*`: pares já testados em `tests/paletas.test.js`).
- **`FotoPendente`** — placeholder reutilizável de espaço de foto (prop `especificacao`; preenche o
  pai posicionado; fundo `--cor-destaque` com texto `--cor-fundo`, para contrastar com o cartão
  claro do hero; par já testado a 4,5:1 por preset). Usado pelo hero quando o slide não tem `imagem`; quem
  usa decide não renderizá-lo em produção.
- **`VitrineProdutos`** (`'use client'`) — vitrine da home em duas colunas. Props `titulo`,
  `produtos`, `categorias`. Esquerda: `h2` "{titulo} *da floresta*", chips (`categorias.slug` →
  `/loja?categoria=slug`) e botão "Ver toda a loja". Direita:
  carrossel scroll-snap que vai até a borda da tela (próximo card cortado), setas no desktop e
  toque no celular (≤900px a intro vira cabeçalho). Cada card é um `CardProduto`
  (`className={styles.slide}` só dimensiona no trilho). Só papéis `--cor-*`.
- **`CardProduto`** (server-safe, sem `'use client'`) — card de produto compartilhado por `VitrineProdutos` e
  `/loja`. Props `produto`, `sizes`, `className` (no `<Link>`), `Titulo` (`h3` padrão; a loja passa `h2`). Imagem em
  proporção fixa 4:5 com `object-fit: contain` sobre `--cor-superficie` (fotos quadradas e em retrato ficam
  uniformes, sem corte), selo "Esgotado" (`estoque === 0`), categoria (**sempre**, ignora
  `mostrar_categoria_no_titulo`), nome, `descricao` em 2 linhas (`line-clamp`; vira `descricao_curta` no C2) e preço.
  Link para `/loja/[slug]`. Só papéis `--cor-*`
  Usado em `app/page.js` logo abaixo do hero, alimentado por `getVitrine()` e
  `getCategoriasComProdutos()`
- **`GradeCategorias`** (server component) — seção "Escolha por categoria" da home, abaixo da
  vitrine. Prop `categorias` (`{ nome, slug, descricao, total, imagem_url? }`; vazio → não renderiza).
  Um cartão por categoria no estilo do cartão do hero (claro, cantos de 24px, sem borda/sombra):
  nome em `--font-accent` itálico moderado (`--cor-texto`), `descricao` em 2 linhas (`line-clamp`),
  "N produtos" e pílula discreta "Ver produtos →" (`--cor-botao`); o `Link` está no `h3` com
  `::after` cobrindo o cartão (foco por `:has(.link:focus-visible)`). Celular primeiro: 1 coluna;
  ≥640px 2; ≥1100px 4. O tom de fundo varia por posição (`--cartao-fundo` = `color-mix` de
  `--cor-texto`/`--cor-destaque` sobre `--cor-fundo`, 4 tons); **`tests/paletas.test.js` lê essas
  misturas do CSS e exige 4,5:1 de `--cor-texto` sobre cada tom em todo preset** — tom novo precisa
  usar papéis-base de `lib/paletas.js`. Só aparece categoria com ≥1 produto ativo (join
  `produtos!inner` em `getCategoriasComProdutos()`). `imagem_url` opcional vira faixa 16:9 no topo do
  cartão (hoje nunca vem; ver pendência de foto de categoria/C2)
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

### Navegação — `lib/navegacao.js`

Fonte única do menu (Header e Footer): array com `href`, `rotulo` e `status` (`real` ou
`mockup`). `itensMenu()` filtra: `mockup` só com `NEXT_PUBLIC_MOCKUPS=1`. `exigirMockups()`
(`notFound()` sem a flag) vai no topo de toda página mockup. Item novo = uma linha no array.

### Carrossel do hero — `lib/carrossel.js`

`reducer(estado, acao)` puro (`{ indice, total, pausado, interagindo }`; ações `avancar`, `voltar`,
`ir`, `tick`, `alternarPausa`, `interagir`): só `tick` respeita `pausado` (botão/toque) e
`interagindo` (hover/foco); navegar à mão sempre funciona. `slidesVisiveis(slides)` devolve todos
com `NEXT_PUBLIC_MOCKUPS=1` e, sem a flag, só os que têm `imagem`. Cobertos em
`tests/carrossel.test.js`.

### Paletas do preview — `lib/paletas.js`

`PALETAS` (azul = padrão da dona; verde, monocromático; mix1 e mix2, inversos entre si): um preset por entrada, com os 7 papéis-base
(fundo, texto, destaque, botão, botaoTexto, rodapé, rodapeTexto); preset novo = uma entrada.
Regra: nunca azul sobre verde (1,17:1), texto de botão/rodapé sempre bege; `tests/paletas.test.js`
exige 4,5:1 de todo preset. `variaveis(chave)` mapeia preset → variáveis CSS; `scriptPaleta()`
devolve o script inline do `<body>` (`app/layout.js`) que aplica a paleta no `<html>` antes da
1ª pintura — prioridade `?paleta=` → `localStorage` (`simplicitude:paleta`) → padrão, inválido
cai no padrão — e é `null` sem `NEXT_PUBLIC_MOCKUPS=1` (então `?paleta` é ignorado em produção).

### Storefront — `lib/produtos.js`

- `getProdutos()` — `select('*, categorias(nome, slug)')` onde `ativo=true`
- `filtrarPorCategoria(produtos, categorias, slug)` — `{ ativa, produtos }`; `slug` que não esteja em
  `categorias` (desconhecido, vazio, array) → `ativa: null` e todos os produtos ("Todas"). Usada em `/loja`
- `getVitrine(criterio = CRITERIO_VITRINE, limite = 8)` — `{ titulo, produtos }`: produtos
  ativos ordenados pela coluna do critério e o título que deriva dele. Critérios em
  **`lib/vitrine.js`** (`novidades`/`created_at`, `favoritos` e `maisVendidos`/`destaque_ordem`,
  esses dois só a partir do C2); `CRITERIO_VITRINE` = Novidades. Consulta e título saem da mesma
  entrada para não divergirem; "Mais vendidos" nunca com `created_at` (`tests/vitrine.test.js`)
- `getCategoriasComProdutos()` — `[{ nome, slug, descricao, total }]` das categorias com ao menos
  um produto ativo (join `produtos!inner`; `total` = nº de produtos ativos); alimenta os chips da
  vitrine e `GradeCategorias`
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
  `UPDATE` da aplicação), `created_at` (usado por `getVitrine()` para ordenar a
  vitrine da home, critério "Novidades")
- **`categorias`** — `id`, `nome`, `slug`, `descricao` — tipo do produto, usado como
  rótulo de exibição (ex.: "Chocolate", "Combo"). Sem `imagem_url` ainda (planejada no C2)
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
   `lib/supabase/middleware.js`. **Com `NEXT_PUBLIC_MOCKUPS=1` (preview) responde 404 a
   `/admin/*` e `/login` antes de qualquer outra coisa**
2. Guard defensivo em `app/admin/layout.js` (re-checa `getUser()` no server, redireciona
   se não autenticado)

Não há service-role key no projeto — a segurança dos dados depende inteiramente de
**Row Level Security (RLS)** configurada no Supabase. Isso muda quando o checkout for
implementado — ver pendência de segurança #3.

---

## Convenções

- CSS Modules (`*.module.css`) co-locados, classes em camelCase
- Cores: **só tokens de papel** (`--cor-*`, ver [Paleta](#paleta-e-tipografia-oficiais)); hex
  solto em componente novo é proibido. Fontes: só `--font-display/body/accent`. Os nomes
  antigos (`--bg`, `--green`…) são aliases a eliminar, não a usar.
- Fontes **hospedadas no projeto** (`next/font/local` em `app/layout.js`, arquivos WOFF2
  variáveis latin em `app/fonts/`, licença OFL em `app/fonts/LEIA-ME.md`): Cinzel, EB Garamond e
  Cormorant Garamond. **Não voltar a `next/font/google`:** em 2026-11-05 o build do Netlify quebrou
  ao baixar a EB Garamond do Google (`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`,
  "queries have exactly one entry"), sem reproduzir localmente; o build agora não depende de rede
  externa. Variáveis `--font-cinzel`, `--font-eb-garamond`, `--font-cormorant`, só consumidas por
  `globals.css`
- Menu e mockups: ver `lib/navegacao.js`; mockup = `status: 'mockup'` + `exigirMockups()`
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
- Envs próprias de preview (ADR 0001, nunca `CONTEXT`/`URL` do Netlify), ambas opcionais:
  `NEXT_PUBLIC_MOCKUPS=1` (só nos contextos branch-deploy/deploy-preview; liga mockups e o 404
  de `/admin`/`/login` no `proxy.js`) e `SITE_INDEXAVEL=1` (só produção, no go-live; remove o
  `noindex`). **O build aborta se as duas estiverem juntas** (trava em `next.config.mjs`).
  Sem `SITE_INDEXAVEL=1` toda rota sai com `X-Robots-Tag: noindex, nofollow`.
- `next.config.mjs` — `images.remotePatterns` liberando o host do Storage do Supabase;
  `poweredByHeader: false`; headers de segurança em todas as rotas (CSP com
  `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`,
  `nosniff`) — a CSP libera só o Storage do Supabase e precisará liberar a InfinitePay quando
  o checkout existir
- `.mcp.json` (Playwright + Context7 MCP) existe só localmente, **não está versionado**
- `_DOCS/` (auditorias de segurança e de design, assets de marca) está no `.gitignore`
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