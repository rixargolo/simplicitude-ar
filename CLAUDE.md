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
qualquer dependência de plataforma** (Netlify/Supabase). Multilíngue PT/EN (**só decisão, nada
implementado**): [`docs/adr/0002-multilingue.md`](docs/adr/0002-multilingue.md) — **ler antes de mexer em rotas
públicas, `proxy.js`, textos fixos ou no schema de conteúdo** (produtos, categorias, coleções, tags, áudio).

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
- **Marco da 1ª versão pública (rota mudada em 2026-11-05):** loja no domínio próprio com o botão
  **Comprar levando ao WhatsApp**, CNPJ/endereço no rodapé, privacidade, entrega/trocas e Open
  Graph. O **checkout InfinitePay (bloco C, A0, A8–A10) fica para depois do go-live**. Escopo: Home,
  Loja, Meditação (o redesign de `/meditacao` fica para depois do go-live).
- **Backlog X:** ajustes vindos do feedback da dona da fábrica, em fatias pequenas (X1, X2…), na seção
  "Backlog X" de [`docs/plano-v1.md`](docs/plano-v1.md). **X1 (várias fotos por produto), X2 (paleta verde
  padrão, sem seletor) e X3 (tipografia da marca Fraunces + Assistant + Amsterdam One, escala `--tam-*`
  menor) e o A7 (produto: galeria + Comprar → WhatsApp) estão no código. **X8 (slug fixo do produto + redirect 308 do
  antigo) está no código e o SQL `supabase/migrations/20261106120000_produtos_slug.sql` **já foi aplicado
  (2026-11-06)**.** **X4 (controle do slider sem Pausar/Continuar, pílula translúcida) está no código.**
  **X5 (home com Meditação, seção placeholder e Quem somos; ver `/`) está no código; falta texto e foto da seção nova
  e confirmar com a dona o título "Meditação".** **X6 (Novidades permanente, curadoria em `/admin/novidades`) está no
  código e o SQL `supabase/migrations/20261106130000_produtos_novidade_ordem.sql` **já foi aplicado (2026-11-06)**
  (a home cai nos mais recentes enquanto a curadoria estiver vazia).** **X7 (categorias com imagem: foto no admin + desfoque que esmaece no hover) e X10 (sem chips de categoria na vitrine Novidades) estão no código e o SQL `supabase/migrations/20261106140000_categorias_imagem.sql` **já foi aplicado (2026-11-06)**.** **X11 (análise e organização do Storage: buckets por tipo, policies em SQL, limites, órfãos, público/privado) só está registrado no plano, sem implementação.** **X9 (página 404 da marca, `app/not-found.js`) está no código; texto provisório, confirmar com a dona.** **X12 (coleções dentro de categorias, produto ↔ coleção M:N, gestão em `/admin/colecoes`, par de tradução EN de categorias e coleções) está no código e concluído/testado; o SQL `20261106150000_x12_colecoes.sql` **foi aplicado (2026-11-06)**.** **X13 (campos do produto: descrição curta, descrição longa com quebras de linha, ingredientes, tags com CRUD em `/admin/tags` e tradução EN de produto e tag) está no código e concluído/testado; o SQL `20261107120000_x13_campos_produto.sql` **foi aplicado (2026-11-07)**.** **X14 (nova `/loja`: topo só de texto, filtro por categoria e coleção, carrosséis de uma linha por categoria e coleção; sem SQL) está no código, build e testes verdes; falta o dono conferir no navegador.** **Ideias registradas, nada implementado:** **X15** (destaque ou landing de Presentes/Natal), **X16** (busca no site todo, no cabeçalho) e **X17** (política de troca e devolução, dentro do A11); detalhes no plano. Próximo: mostrar o preview à dona.
- **Decisões vigentes:** checkout como **convidado** (a decisão antiga de login obrigatório
  está superada); vitrine da home com título derivado do critério de ordem — `novidade_ordem` (curadoria da dona,
  reserva `created_at`) = "Novidades",
  `destaque_ordem` curado sem dado de venda = "Favoritos", só ordem real da dona ou histórico de
  pedidos = "Mais vendidos" (**nunca "Mais vendidos" ordenado por `created_at`**);
  frete por tabela de zonas por faixa de CEP (Melhor Envio depois); sem glossário e só os ADRs
  0001 e 0002 (as demais decisões entram aqui em uma linha). **Multilíngue (ADR 0002, proposto, pós-go-live,
  nada no código):** PT é a base nas colunas atuais e EN vai em tabelas `*_traducoes` (fallback para o PT em
  `lib/i18n.js`); PT sem prefixo e EN em `/en/...` (`app/[lang]/`, hreflang, `noindex` na página EN sem
  tradução); slugs e caminhos não se traduzem (**pergunta em aberto no ADR: traduzir slugs em `/en`? rever antes do I2**); idioma por cookie `idioma` (só a escolha explícita grava) e
  `Accept-Language` + país no `proxy.js`, sem cabeçalho = PT; áudio EN em `produto_traducoes.audio_url`;
  fatias I1–I4 no plano. **I1 já feito para categorias e coleções no X12** (tabelas, `lib/i18n.js`, seção
  `TraducaoEn` no admin); **produto e tag no X13** (`produto_traducoes`, `tag_traducoes`; ficou sem `atributos` e sem
  `audio_url`, que é o I3). Faltam só as rotas `/en` (I2).
- **Fluxo de trabalho da v1:** o redesign mora na branch `v1` (preview no Netlify, `noindex`);
  `main` segue sendo o site atual até o go-live. Mockups de UI ficam atrás de
  `NEXT_PUBLIC_MOCKUPS` e nunca vão para o domínio real. **A1 (infra de preview) está concluído**
  (branch `v1`, ver [Env / deploy / scripts](#env--deploy--scripts)): branch deploy da `v1`
  ativo e envs configuradas no Netlify (`NEXT_PUBLIC_MOCKUPS=1` só nos contextos
  branch-deploy/deploy-preview), verificado em produção e na `v1`. **A2 (tokens + Header/Footer)
  está no código. A3 (hero da home em carrossel) está no código, com as 4 fotos reais ligadas
  (ver `HeroCarrossel`). A5 (categorias na home) está no código, sem fotos (ver `GradeCategorias`). A6 (`/loja` com filtro por categoria) está no código (ver `CardProduto`).** Mockups existentes: só `/bem-fazer` e `/assinaturas` ("Em breve"); os de
  carrinho/checkout vêm depois — ver a lista priorizada no plano.
- **Ordem do front:** A1 (preview) → A2 (tokens, header/footer) → A3/A4/A5 (home) → A6 → **X1 (fotos)** →
  **X2 (paleta verde)** → **X3 (tipografia)** → A7 (produto, Comprar → WhatsApp) → **X8 (slug)** → **X4 → X5 → X6 → X7 → X10 → X9 (404)** →
  mostrar o preview à dona → A11 → go-live (D); o contrato de dados
  (A0) e carrinho/checkout/pedido (A8–A10, bloco C) ficam para depois do go-live.

---

## Paleta e tipografia oficiais

**Paleta oficial da marca:** Bege Background `#f6f3ea`, Azul Simplicitude `#272a5c`, Verde
Musgo `#27401e`. **Paleta de uso (X2, 2026-11-05): a VERDE** — bege de fundo, verde em texto,
destaque, botão e rodapé. O azul (cor padrão da paleta da marca) **não é usado por enquanto** e
fica documentado, com todos os valores, em [`docs/paleta-azul.md`](docs/paleta-azul.md). Não há
seletor de paleta nem troca em tempo de execução: os valores moram direto nos **tokens por papel**
(não por cor) de `app/globals.css`: `--cor-fundo` (bege), `--cor-texto` (verde), `--cor-destaque`
(verde: nomes de produto, item ativo do menu, foco), `--cor-botao`/`--cor-botao-texto`,
`--cor-rodape`/`--cor-rodape-texto`, mais `--raio-botao` (pílula). Derivados via `color-mix`
(seguem `--cor-texto` sozinhos): `--cor-texto-suave`, `--cor-superficie`, `--cor-borda`. **Código
novo usa só esses papéis.** Regra de contraste: **nunca azul sobre verde (1,17:1)**; texto de
botão/rodapé sempre bege. `tests/paletas.test.js` lê os tokens do próprio `globals.css` e exige
4,5:1 em texto/fundo, texto/superfície, destaque/fundo, botão, rodapé e texto suave/fundo.
**Exceção conhecida:** `--cor-texto-suave` sobre `--cor-superficie` dá 4,22:1 na verde (só o selo do
admin); decisão de manter o 72% do suave. O
`.emBreve` e o "áudio guiado" do `MeditacaoPlayer` (antes ~2:1 por causa de `opacity`) agora usam
`--cor-texto-suave` sem `opacity`; `tests/paletas.test.js` falha se esse CSS voltar a ter `opacity`.

> ⚠️ **Aliases temporários:** `--bg`, `--green`, `--green-nav`, `--brown`, `--caramel`,
> `--border`, `--cream`, `--cream-name` seguem existindo em `globals.css` só como aliases dos
> papéis (as páginas ainda não refeitas já pegam a paleta nova); `--gold` é o único hex antigo
> (só o admin usa). Cada item do plano (A4–A7, A12) troca pelos papéis nos arquivos que
> reescreve; o bloco some quando ninguém usar. Hex soltos remanescentes: admin e os scrims
> pretos de `/quem-somos` e de `/meditacao`. O hero da home (A3) e o bloco de marca (X5, `app/home.module.css`) já
> usam só papéis.

**Tipografia da marca (X3, 2026-11-06):** três famílias por papel, em tokens de `app/globals.css` sobre as
variáveis do `next/font/local` de `app/layout.js` (arquivos WOFF2 latin em `app/fonts/`, receita de geração e
licenças em `app/fonts/LEIA-ME.md`). Nenhum CSS cita as famílias direto.
- **`--font-display` = Fraunces** (variável, `SOFT=0`, `WONK=0`, `wght` 300–700, `opsz` 9–72; normal + itálico):
  títulos, nomes de produto e o itálico de leitura (lead da meditação, `emphasis`, nome de categoria). **Caixa
  normal**, sem `uppercase` nem tracking largo; peso 500 nos títulos.
- **`--font-body` = Assistant** (400 e 600 estáticas, sem itálico): texto, botões, chips, menu, preços, rótulos.
  Rótulos pequenos seguem em caixa alta, tracking ≤ 0.12em. Itálico em texto de Assistant = usar Fraunces itálico.
- **`--font-accent` = Amsterdam One** (só 400, sem Slant e sem itálico; fallback Fraunces): **no projeto, mas
  SEM USO por enquanto** (decisão de 2026-11-06; o dono vai indicar pontualmente onde entra). Fica o arquivo
  `app/fonts/amsterdam-one-latin.woff2`, carregada em `app/layout.js` com `preload: false` (só baixa se algum CSS
  usar), o token `--font-accent` e `--tam-destaque`. Quando entrar: **somente destaque curto em tamanho grande**,
  nunca texto de leitura, nomes, preços nem rótulos; ela não tem itálico, então em `<em>` usar `font-style: normal`.
  `tests/paletas.test.js` falha se algum CSS usar `--font-accent`: ao autorizar um uso, atualizar a lista do teste
  e registrar o lugar aqui. O pacote recebido **não trouxe licença**: uso por orientação da dona/criador do
  projeto (registrado no LEIA-ME das fontes; confirmar se a marca for publicada mais amplamente).
- **Mote do rodapé** ("Da Floresta à Fábrica", ao lado da logo): Fraunces itálico em `--tam-texto` (16px).
  "da floresta" na vitrine e "Em breve" também são Fraunces itálico.
- **Escala por papel** (`--tam-*` em `globals.css`, menor que a anterior; **código novo usa só esses, nunca
  px/rem soltos**): `rotulo` 0.75rem, `pequeno` 0.875rem, `texto` 1rem, `chamada` 1.06–1.19rem, `nome-card`
  1.0625rem, `subtitulo` 1.25–1.5rem, `titulo-secao` 1.5–2.125rem, `titulo-pagina` 1.75–2.75rem,
  `nome-produto` 1.875–2.75rem, `destaque` 1.75–2.5rem. Ficam fora da escala só placeholders de letra grande
  (`CardProduto`, `GaleriaProduto`) e ícones de seta.
- Zips originais em `docs/Fontes da marca/` (fora do git). Grandeurs e Simplicity não são usadas.

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
  em duas colunas (título derivado do critério de ordem — hoje "Novidades" —, botão "Ver toda a loja"
  e carrossel de cards; sem chips de categoria, X10), via `VitrineProdutos`; logo abaixo, a seção de categorias
  (`GradeCategorias`, cartões com dados reais; foto opcional por categoria, X7), que substituiu o teaser antigo de meditação
- Estoque: `produtos.estoque` é mantido pela trigger `calcular_estoque_movimentacao` a
  partir de `INSERT`s em `estoque_movimentacoes`; admin registra `reposicao`/`ajuste` em
  `/admin/estoque`; loja pública mostra selo "Esgotado" quando
  `estoque = 0` (e a página do produto troca "Comprar" por "Consultar no WhatsApp")
- **Schema completo do banco já existe** para suportar clientes, endereços, pedidos e
  pagamentos (`clientes`, `enderecos`, `pedidos`, `pedido_itens`, `pagamentos`) — ver
  [Modelo de dados](#modelo-de-dados-tabelas-do-projeto) abaixo. Nenhuma dessas 5 tabelas
  tem código/tela usando ainda; foram desenhadas e criadas com RLS antecipando o
  checkout, não é trabalho a refazer

**Pendente / não implementado ainda** (ordem e dependências em
[`docs/plano-v1.md`](docs/plano-v1.md), seção 3):
- Conteúdo de `/bem-fazer` e `/assinaturas` (hoje mockups "Em breve" só no preview) e confirmar
  com a dona o rótulo "Bem-estar" para `/meditacao`
- Checkout real — hoje "Comprar" em `/loja/[slug]` abre o WhatsApp (A7, temporário); integração InfinitePay não
  existe (quando existir, é quem vai gerar as movimentações `venda`/`cancelamento` em
  `estoque_movimentacoes` e os registros em `pagamentos`)
- Checkout de **convidado**: exige migration (`pedidos.cliente_id` nullable, campos
  `comprador_*`, `token_acesso`). Cadastro/login de cliente fica para depois da v1; as
  tabelas `clientes`/`enderecos` seguem prontas, sem tela
- Baseline do schema (`supabase db pull`, B-1b) **ainda não existe**: o resto do schema só está no
  painel do Supabase; no repo há só as mudanças desde o A6b, em `supabase/migrations/` (B-1a). Sem
  ambiente de staging — B-2 do plano
- **Home sem caixa e sem borda na foto:** a dona quer as seções da home sem caixa demarcada e sem bordas na foto (ajuste
  futuro, **ainda não feito**; registrado em `docs/plano-v1.md`, pendências)
- **Fotos do hero:** as 4 de `public/home/hero_slide_{1..4}.webp` já estão ligadas aos slides
  (ordem 1→4 = Loja, Bem-estar, Quem somos, Presentes). Se a dona trocar alguma, **receita de
  otimização**: WebP `quality: 85` (`effort: 6`, `smartSubsample: true`) com `sharp` (já está em
  `node_modules`, vem do Next; comando avulso, sem script no repo), **mesmas dimensões** (16:9,
  mín. 1920×1080, ideal 2400×1350, sem upscale), PSNR ≥ ~38 dB contra o original (a foto 3, com céu,
  precisou de q90). Os PNGs originais ficam em `_DOCS/originais-hero/` (fora do git). Mantém o
  check do D2: todo slide do hero com foto real
- **X1 (várias fotos):** SQL aplicado em produção em 2026-11-05 (`supabase/migrations/20261105181330_produto_imagens.sql`). **Rodar de novo no D2** o script de reconciliação `supabase/scripts/x1_reconciliar_produto_imagens.sql` (a `main` só grava em `produtos`). A galeria em `/loja/[slug]` já usa `produto_imagens` (A7)
- **Foto de categoria (X7):** código pronto (upload no `CategoriaForm`, `getCategoriasComProdutos()` e `GradeCategorias`); o SQL `20261106140000_categorias_imagem.sql` já foi aplicado (2026-11-06); falta a dona enviar as fotos (cada categoria sem foto segue com o cartão de sempre). O mesmo SQL cria o bucket próprio `categorias` com as policies (ver Storage)
- Testes: só Vitest (`npm test`, pasta `tests/`, cobre a infra de preview, o menu/mockups, o contraste da paleta verde lido de `globals.css` (inclusive hero e cartões de categoria), a tipografia (sem `opacity` no `MeditacaoPlayer`, Amsterdam sem uso até autorização), o carrossel do hero, o critério/título da vitrine, `getCategoriasComProdutos`, `montarLoja`, `lib/foco.js`, `lib/fotos.js`, `lib/whatsapp.js`, `lib/i18n.js` e os slugs do X8: `slugValido`, `getProdutoBySlug`, `getSlugAtual`). Sem lint nem CI
- Admin de pedidos
- **Coleções (X12):** gestão no admin pronta (`/admin/colecoes`); uso público só na `/loja` (X14: `?colecao=slug`
  e carrossel por coleção; sem página própria de coleção) e excluir coleção (de propósito, fora do X12)
- **X12 (taxonomia + par EN de categorias e coleções):** concluído e testado; SQL
  `supabase/migrations/20261106150000_x12_colecoes.sql` **aplicado em 2026-11-06**
- **X13 (campos do produto):** concluído e testado; SQL `supabase/migrations/20261107120000_x13_campos_produto.sql`
  **aplicado em 2026-11-07**. `produtos.atributos` não é migrado nem editado na `v1` (a `main` ainda o usa); a descrição
  curta começa vazia (a dona precisa preenchê-la: `/meditacao` mostra só ela). Uso público de tag (link, filtro, tags no
  card e em `/meditacao`) e `/en` ficam fora

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
  `GradeCategorias` e o **bloco de marca (X5, sem componente próprio: markup em `app/page.js`, estilo em
  `app/home.module.css`)**, na ordem Meditação → seção nova → Quem somos. **Três cartões divididos iguais**
  (`--cor-superficie`, raio 24px, mesmas margens das categorias, texto sempre fora da foto, sem texto sobre
  foto nem degradê), ≥768px em 2 colunas: (1) **Meditação**, texto e pílula "Acesse a meditação guiada" (texto do
  git, `8a10f58^`) à esquerda, foto `/meditacao/hero.png` à direita; (2) **seção nova**, texto à esquerda e
  `FotoPendente` à direita (escolha: é a ordem em que ela já se lê no celular, texto e depois foto; título e
  texto provisórios), **renderizada só com `mockupsLigados()`** (em produção some até haver conteúdo: o bloco fica
  com Meditação e Quem somos, que alternam); (3) **Quem somos**, foto menor (`cabruca.jpg`, natural, coluna 2fr/3fr)
  à esquerda, frase em `h2` itálico e pílula "Conheça nossa história" à direita. Zigue-zague só no desktop (`order`
  no `.fotoDireita`); no celular tudo empilha na ordem do markup (foto em cima, exceto a seção nova)
- **`/quem-somos`** — institucional
- **`/meditacao`** (`revalidate = 60`, como a home: sem isso a edição no admin só valeria no próximo build) — hero (faixa de imagem + duotone + listras diagonais + título, no
  padrão de `/quem-somos`) e bloco de introdução da Coleção Inspirar, seguidos da lista de
  produtos com `tem_meditacao=true` via `ApresentacaoProduto resumido` + `MeditacaoPlayer` (**só a descrição curta**:
  sem descrição longa nem ingredientes)
- **`/loja`** (X14; markup em `app/loja/page.js`, sem componente próprio além de `CarrosselProdutos`) — **topo só de texto** (2026-11-07: sem foto,
  sem cartão, sem caixa nem borda, direto sobre `--cor-fundo`; curto, para o 1º carrossel aparecer perto da dobra em 375×667):
  rótulo pequeno (só com coleção ativa: nome da categoria dela), `h1` (coleção ativa, categoria ativa ou "Loja") e frase
  (`descricao` ou a frase padrão). Celular: empilhado; ≥900px, título à esquerda e frase à direita, alinhada à base. A foto de
  categoria (`imagem_url`) **não é mais usada na `/loja`** (segue na `GradeCategorias` da home). **Filtro** (links, sem JS): 1ª fileira "Todas" + categorias com ≥1 produto ativo
  (`getCategoriasComProdutos()`; rola na horizontal no celular, quebra linha a partir de 900px); 2ª fileira só com categoria
  ativa que tenha coleção com produto: "Tudo em {categoria}" + as coleções dela (chip só de contorno). **URLs:** `?categoria=slug`
  (os links antigos seguem valendo) e `?colecao=slug` (a coleção já implica a categoria dela; **coleção válida vence categoria**).
  **Slug desconhecido, vazio ou repetido = "Todas"**, coleção sem produto ativo conta como desconhecida: nunca página vazia.
  **Conteúdo** (tudo em `montarLoja`, `lib/produtos.js`): em "Todas" e na categoria, **carrosséis de uma linha** (`CarrosselProdutos`)
  — por seção de categoria (`h2` + descrição + "Ver tudo", separador de 1px `--cor-borda` entre seções; as categorias ficam em ordem
  alfabética), um carrossel por coleção dela (`h3` + "Ver coleção") e, no fim, "Mais {categoria}" **só se sobrar produto**; categoria sem
  coleção tem um carrossel só, sem título de lista. Dentro de uma categoria só entram produtos **daquela** categoria (um produto aparece
  em uma só seção; ex.: o Chocobook, de Presentes, está na coleção Inspirar, de Chocolates, e só aparece em Presentes), e produto sem
  categoria vai para uma seção final "Outros" (só em "Todas"). Resultado com **uma lista só** (categoria com um carrossel, ou
  coleção filtrada, que mostra **todos** os produtos da coleção) vira a **grade** de `CardProduto` (2 colunas no celular). Níveis de
  título: `h1` → `h2` (categoria, só em "Todas") → `h3`/`h2` (lista) → nome do card. Zero produtos ativos → frase de estado vazio com
  link para `/quem-somos`. A página é dinâmica (`ƒ`) por causa do `searchParams`. **Fora:** `/en`, filtro por tag, busca, página própria de
  coleção, ordem manual de categorias, foto própria de coleção
- **`/loja/[slug]`** — detalhe do produto (X13: texto na ordem categoria, nome, descrição curta, tags, preço/Comprar, descrição longa e ingredientes, ver `ApresentacaoProduto`; X8: o slug é a coluna `produtos.slug`, fixa; slug antigo que
  consta em `produto_slugs` responde **308** para o atual via `permanentRedirect`, senão 404). Dinâmica (`ƒ`: lê `headers()` para o endereço absoluto). `h1` = nome; galeria
  (`getFotosDoProduto` → `ApresentacaoProduto` → `GaleriaProduto`); peso, preço, descrição; **Comprar =
  link do WhatsApp com mensagem pronta** (`BotaoComprar`, nova aba, sem carrinho/quantidade). Sem estoque
  (`estoque === 0`): selo "Esgotado" e o mesmo botão com o rótulo "Consultar no WhatsApp" (não perde a
  venda; sem ramo novo). `tem_meditacao` mostra só o selo-link para `/meditacao` (sem player aqui).
  `generateMetadata`: `title`, `description` e `openGraph` com título e foto principal; o resto do
  compartilhamento (imagem 1200x630, `metadataBase`) é o A11
- **`/bem-fazer`**, **`/assinaturas`** — mockups "Em breve" (`EmBreve`); só existem com
  `NEXT_PUBLIC_MOCKUPS=1` (`exigirMockups()` → 404 em produção, e saem do menu)
- `/contato` foi **removida** (contato vive no rodapé)
- **404 da marca (X9)** — `app/not-found.js` + `not-found.module.css`: cobre rota inexistente, `notFound()` de
  `/loja/[slug]` e `exigirMockups()` em produção; dentro do layout raiz (Header/Footer via `SiteChrome`), uma coluna
  no molde do `EmBreve`, botão "Ver a loja" e link "Voltar para o início". **Texto provisório, confirmar com a dona.**
  Em `/admin/*` o chrome some e `/admin`/`/login` no preview seguem com 404 vazio do `proxy.js` (de propósito)

Auth / admin (chrome oculto por `SiteChrome`):
- **`/login`** — formulário email/senha (`signInWithPassword`)
- **`/admin`** — dashboard: saudação de boas-vindas + atalhos para as ações mais comuns
  (novo produto, nova categoria, registrar movimentação). Os links de navegação entre
  seções não ficam mais aqui — moraram para a sidebar persistente (ver abaixo)
- **`/admin/produtos`**, **`/admin/produtos/novo`**, **`/admin/produtos/[id]/editar`** —
  CRUD de produtos (toggle ativo/inativo, upload de imagem); **coleções (X12): checkboxes agrupados por categoria**
  (produto em várias; a 1ª marcada na ordem do admin vira `produtos.colecao_id`; `salvarColecoes` roda **depois** do
  update de `produtos` e deixa em `produto_colecoes` exatamente as marcadas; a lista mostra todas); `novo` e `[id]/editar` têm
  link "← Produtos" acima do formulário, voltando para a listagem. **Campo "Endereço na loja" (X8)** no
  `ProdutoForm`: sugerido do nome só na criação (até ser editado à mão), nunca acompanha o nome na edição;
  normalizado com `slugify` ao sair do campo, validado com `slugValido`, mostra `{origem}/loja/{slug}`, e na
  edição avisa que mudar afeta links compartilhados (o antigo redireciona, mas não é reaproveitável). Unicidade
  é do banco: erro `23505` vira "já é (ou já foi) de outro produto". **X13:** "Atributos" saiu do formulário (e do
  payload: a `v1` nunca grava `atributos`); entram "Descrição curta" (≤120, contador), "Descrição longa", "Ingredientes",
  checkboxes de **Tags** e a seção `TraducaoEn` (nome, curta, longa, ingredientes → `produto_traducoes`; fica **logo depois do
  campo Ingredientes**, antes de Peso/Preço, para não parecer escondida abaixo das fotos). `salvarVinculos`
  (coleções e tags) roda depois do update de `produtos`; a lista ganha a coluna "EN"
- **`/admin/categorias`**, **`/admin/categorias/nova`**,
  **`/admin/categorias/[id]/editar`** — CRUD de categorias; `nova` e `[id]/editar` têm
  link "← Categorias" acima do formulário. O `CategoriaForm` tem campo "Foto (opcional)" (X7: upload para `{id}/{uuid}.{ext}` no bucket `categorias`, `SeletorFoco` com prévia 16:9, "Remover foto"; só toca nas colunas de foto se há foto antes ou agora). O campo de slug do `CategoriaForm` ganhou normalização, validação
  de formato, endereço resultante e aviso ao mudar na edição (X8); `23505` → "já existe uma categoria com esse
  endereço". X12: seção `TraducaoEn` ("English (opcional)") e coluna "EN" (✓ / —) na lista
- **`/admin/colecoes`**, **`/admin/colecoes/nova`**, **`/admin/colecoes/[id]/editar`** (X12) — coleção pertence a uma
  categoria. A lista (`OrdemColecoes`, `'use client'`) agrupa por categoria, com Subir/Descer, Editar, selo "EN ✓" e
  "Salvar ordem" (grava `colecoes.ordem` = posição no grupo, só onde mudou; mesmo padrão de `CuradoriaNovidades`, reusa
  `novidades.module.css`). `ColecaoForm`: nome, slug (`slugify`/`slugValido`; `23505` → "já existe uma coleção com esse
  endereço"), categoria (obrigatória), descrição e `TraducaoEn`; coleção nova entra com `ordem` null (fim do grupo).
  Sem excluir
- **`/admin/tags`**, **`/admin/tags/nova`**, **`/admin/tags/[id]/editar`** (X13) — CRUD de tags (`TagForm`: nome, slug com
  `slugify`/`slugValido`, `23505` → "já existe uma tag com esse endereço", `TraducaoEn` só com o nome). Na edição há **Excluir**
  (`window.confirm`; o cascade tira a tag dos produtos e da tradução) — o único "excluir" do admin. Lista com selo "EN ✓"
- **`/admin/estoque`** — lista produtos com estoque atual, link para registrar
  movimentação por produto
- **`/admin/estoque/nova`** — formulário de movimentação (`MovimentacaoForm`), aceita
  `?produto={id}` para pré-selecionar; só permite tipos `reposicao` e `ajuste` (insere em
  `estoque_movimentacoes`, nunca escreve em `produtos.estoque` diretamente — isso é
  responsabilidade da trigger do banco); tem link "← Estoque" acima do formulário
- **`/admin/estoque/historico`** — histórico de movimentações, mais recente primeiro (já
  tinha link "Voltar" para `/admin/estoque`, mantido como estava)
- **`/admin/novidades`** (X6) — curadoria da vitrine Novidades da home: `CuradoriaNovidades` (`'use client'`) lista
  os escolhidos em ordem (Subir/Descer/Remover por botão, reusando `mover()` de `lib/fotos.js`), `<select>` +
  Adicionar com os produtos ativos fora da lista, limite `MAX_VITRINE` (8). Salvar faz `update novidade_ordem`
  (posição `i+1`, `null` nos removidos) só nas linhas que mudaram, direto via client autenticado. Produto escolhido
  que ficou inativo continua na lista com aviso e não aparece na home. Lista vazia: a home mostra os 8 mais recentes

**Navegação persistente do admin:** `app/admin/layout.js` renderiza um shell de duas
colunas (`app/admin/admin.module.css` → `.shell`) com a sidebar (`app/admin/AdminNav.js`,
`'use client'`) à esquerda e o conteúdo da página à direita (`.content`). `AdminNav` lê a
rota atual via `usePathname()` (primeiro uso desse padrão fora de `SiteChrome`) para
destacar a seção ativa (array `SECOES` — acrescentar uma seção futura, ex. Pedidos ou
Coleções, é só adicionar um item nesse array) e renderiza o `LogoutButton` no rodapé da
sidebar. Em telas `≤640px` a sidebar vira uma barra superior horizontal. Toda a navegação
entre seções (Início/Produtos/Categorias/Coleções/Tags/Novidades/Estoque) e o logout ficam ali, visíveis em todas
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
  `linkWhatsApp()` de `lib/whatsapp.js`), links do mesmo `itensMenu()` e linha legal (CNPJ só no preview).
- **`EmBreve`** — página mockup "Em breve" com botão pílula para `/loja`
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
  alpha), e os traços do SVG usam `stroke="currentColor"`: a logo acompanha `--cor-texto`.
  O `Footer` usa a mesma máscara. Decide
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
- **`ApresentacaoProduto`** (server) — bloco de apresentação de produto (`GaleriaProduto`, rótulo
  de categoria via `rotuloCategoria()`, nome, **descrição curta** em Fraunces itálico, **tags** como chips (`produto.tags`,
  só vem de `getProdutoBySlug`), `children`, **descrição longa** (`white-space: pre-line`) e **ingredientes** (`dl`); a
  ordem põe preço/Comprar (ou o player, em `/meditacao`) antes do texto longo; `atributos` não aparece mais, X13); usado em
  `/loja/[slug]` e `/meditacao`. Props `produto`, `resumido` (padrão `false`; `/meditacao` o liga: omite descrição longa e
  ingredientes, fica só a curta), `fotos` (opcional, de `getFotosDoProduto`; sem ela cai na
  cópia da principal em `produtos.imagem_*` via `fotosDoProduto`, caso de `/meditacao`), `Titulo` (`h2`
  padrão; a página do produto passa `h1`)
- **`GaleriaProduto`** (`'use client'`) — foto principal no quadro do card (`--proporcao-produto`, `cover`,
  `estiloFoto` de cada foto: foco e zoom) e, com 2+ fotos, miniaturas em `<button>` (`aria-label` "Ver foto N
  de M", `aria-current`, foco visível; Tab + Enter/Espaço; fileira rolável no celular, quebra linha ≥700px).
  Sem foto: inicial do nome. Sem setas de teclado, deslize nem lightbox (de propósito)
- **`BotaoComprar`** (server) — **único** lugar que monta o link de compra: `<a>` pílula para
  `linkCompra(nome, url)`, `target="_blank"`, `rel="noopener noreferrer"`. **Ponto de extensão do clique:** para
  registrar no futuro, virar `'use client'` com `onClick` + `navigator.sendBeacon` para uma rota do servidor;
  o link continua direto ao `wa.me` (sem redirecionamento, por causa do navegador interno do Instagram)
- **`HeroCarrossel`** (`'use client'`) — hero da home. Props `slides` (`{ id, rotulo, titulo,
  texto, cta: { rotulo, href }, imagem?: { src, alt, posicao? } }`; `posicao` = `object-position`
  para enquadrar a foto quando a tela larga corta o 16:9 em cima e embaixo — slide 3 com
  `'50% 0%'` para não cortar as cabeças; slide 1 com `'50% 70%'` (cabeça no topo e cacau na base:
  mostra o rosto com os óculos e o cacau inteiro; em notebook bem baixo o rosto corta na boca)) e `layout` (padrão `sobreposto`: foto em
  largura total, cartão **translúcido** (70% de `--cor-fundo` + blur, cantos de 24px; no celular
  volta a sólido, fora da foto) no canto inferior esquerdo — o teste de paletas lê esse 70% do
  CSS e exige 4,5:1 do texto com foto preta ou branca por trás —, controles (só setas e pontos, **sem
  botão Pausar/Continuar**) numa pílula translúcida (30% de `--cor-fundo` + blur, mais leve que o
  cartão; setas e pontos em `--cor-texto`) **dentro da foto**, embaixo — o contraste dela depende da
  foto por trás e **não tem teste** (conferir a olho ao trocar foto; se fraco, subir o 30%) — centralizada só a partir de 1440px; abaixo disso, no canto direito, para não
  encostar no cartão (corte a rever se mudar o nº de slides ou o tamanho do cartão); no celular, foto em cima, cartão embaixo e controles
  abaixo, no fluxo). **O markup é o mesmo para todo layout**; o que muda
  fica no mapa `LAYOUTS` do componente (`sizes` da imagem e `especFoto`, a **constante única** do
  texto de especificação da foto) e em blocos `.<layout> …` do CSS — um 2º layout (ex.: tela
  dividida) é uma entrada nova no mapa + um bloco de CSS. Rolagem automática de 6 s, pausa por
  hover, foco de teclado (`:focus-visible`) e toque (o toque pausa até recarregar: não há botão
  para continuar); sem rolagem com `prefers-reduced-motion`. Só o slide 0 usa `preload` na imagem; título do 1º
  slide é `h1`, os demais `h2`. Cartão e botão só usam papéis (`--cor-fundo`/`--cor-texto`/
  `--cor-botao*`: pares já testados em `tests/paletas.test.js`).
- **`FotoPendente`** — placeholder reutilizável de espaço de foto (prop `especificacao`; preenche o
  pai posicionado; fundo `--cor-destaque` com texto `--cor-fundo`, para contrastar com o cartão
  claro do hero; par já testado a 4,5:1). Usado pelo hero quando o slide não tem `imagem`; quem
  usa decide não renderizá-lo em produção.
- **`CarrosselProdutos`** (`'use client'`, X14; extraído da `VitrineProdutos`) — trilho scroll-snap de `CardProduto` que vai até a borda
  direita da tela (próximo card cortado), setas no desktop e toque no celular (≤900px, `--card` 70vw, sem setas). Props `produtos`,
  `rotulo` (entra no `aria-label` das setas: "{rotulo}: produtos anteriores/seguintes", para distinguir vários na página), `sizes`,
  `Titulo` (nível do nome no card, padrão `h3`) e `className` (raiz). `--card` e o respiro à esquerda (`--pad-esq`, padrão 24px) saem
  do próprio CSS; a vitrine zera o respiro. **Não tem título nem link**: quem usa põe o cabeçalho. Usado por `VitrineProdutos` e `/loja`
- **`VitrineProdutos`** (server, sem `'use client'`; o trilho é o `CarrosselProdutos`) — vitrine da home em duas colunas. Props `titulo`,
  `produtos`. Esquerda: `h2` "{titulo} *da floresta*" e botão "Ver toda a loja" (os chips de categoria
  saíram no X10: eram redundantes com a `GradeCategorias` logo abaixo). Direita: o `CarrosselProdutos`
  (≤900px a intro vira cabeçalho). Só papéis `--cor-*`.
- **`CardProduto`** (server-safe, sem `'use client'`) — card de produto compartilhado por `VitrineProdutos` e
  `/loja`. Props `produto`, `sizes`, `className` (no `<Link>`), `Titulo` (`h3` padrão; a loja passa `h2`). Foto em
  quadro de proporção fixa (`--proporcao-produto` em `globals.css`, 0.8 = 4:5; é o único lugar da proporção, a
  seta da vitrine também a usa) preenchido com `object-fit: cover` e enquadrado por
  `style={estiloFoto(produto.imagem_foco_x, produto.imagem_foco_y, produto.imagem_zoom)}` (ponto de foco + zoom por
  produto; sem ajuste = centro e 100%). A página de produto (A7) usa o mesmo `estiloFoto`. Selo "Esgotado" (`estoque === 0`), categoria (**sempre**, ignora
  `mostrar_categoria_no_titulo`), nome, `descricao_curta || descricao` em 2 linhas (`line-clamp`, X13) e preço.
  Link para `/loja/[slug]`. Só papéis `--cor-*`
  Usado em `app/page.js` logo abaixo do hero, alimentado por `getVitrine()` e
  `getCategoriasComProdutos()`
- **`GradeCategorias`** (server component) — seção "Escolha por categoria" da home, abaixo da
  vitrine. Prop `categorias` (`{ nome, slug, descricao, total, imagem_url?, imagem_foco_x?, imagem_foco_y?, imagem_zoom? }`; vazio → não renderiza).
  Um cartão por categoria no estilo do cartão do hero (claro, cantos de 24px, sem borda/sombra):
  nome em `--font-accent` itálico moderado (`--cor-texto`), `descricao` em 2 linhas (`line-clamp`),
  pílula discreta "Ver produtos →" (`--cor-botao`) à direita (sem contagem de produtos: removida a pedido da dona; `total` segue na
  prop, sem uso no cartão); o `Link` está no `h3` com
  `::after` cobrindo o cartão (foco por `:has(.link:focus-visible)`). Celular primeiro: 1 coluna;
  ≥640px 2; ≥1100px 4. O tom de fundo varia por posição (`--cartao-fundo` = `color-mix` de
  `--cor-texto`/`--cor-destaque` sobre `--cor-fundo`, 4 tons); **`tests/paletas.test.js` lê essas
  misturas do CSS e exige 4,5:1 de `--cor-texto` sobre cada tom** — tom novo precisa
  usar papéis-base de `app/globals.css`. Só aparece categoria com ≥1 produto ativo (join
  `produtos!inner` em `getCategoriasComProdutos()`). `imagem_url` opcional (X7) vira faixa 16:9 no topo do
  cartão, enquadrada por `estiloFoto(foco_x, foco_y, zoom)`; o texto fica sempre abaixo da foto (o teste de
  contraste não muda). **Desfoque:** `.foto::after` com `backdrop-filter: blur(8px)` que vai a `opacity: 0` no
  hover do cartão e no foco de teclado do link; só dentro de `@media (hover: hover)`, então **no celular a foto fica
  sempre nítida** (o toque já navega, não há "por cima"). Foto decorativa (`alt=""`)
- **`MeditacaoPlayer`** (`'use client'`) — player de áudio da meditação guiada
- **`TraducaoEn`** (`'use client'`, mora em `app/admin/TraducaoEn.js`, não em `components/`) — seção recolhível "English
  (opcional)" dos formulários de categoria, coleção, produto e tag; aberta só se já há tradução. A prop `campos`
  (`[{ chave, rotulo, multilinha?, maxLength? }]`, padrão nome + descrição) define os campos; `valores` tem uma chave por
  campo. Exporta também `traducaoEnInicial(linhas, campos)` e `salvarTraducao(supabase, tabela, fk, id, valores, existia)`
  (grava as colunas = chaves de `valores`; upsert, apaga ou nada,
  conforme `acaoTraducao` de `lib/i18n.js`; erro com `exibir`). O formulário dono guarda o estado
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
`ir`, `tick`, `alternarPausa`, `interagir`): só `tick` respeita `pausado` (toque) e
`interagindo` (hover/foco); navegar à mão sempre funciona. `slidesVisiveis(slides)` devolve todos
com `NEXT_PUBLIC_MOCKUPS=1` e, sem a flag, só os que têm `imagem`. Cobertos em
`tests/carrossel.test.js`.

### Storefront — `lib/produtos.js`

- `getProdutos()` — `select('*, categorias(nome, slug)')` onde `ativo=true`
- `montarLoja(produtos, categorias, colecoes, { categoria, colecao })` (X14, puro; **substituiu `filtrarPorCategoria`**) —
  `{ categoria, colecao, colecoesDaCategoria, secoes, grade }`. `secoes` = `[{ categoria|null, listas: [{ colecao|null, produtos }] }]`;
  `grade` = produtos (ou `[]`) quando há no máximo uma lista ou uma coleção ativa, senão `null`. Regras (slug inválido = "Todas",
  coleção vence categoria, produto só na própria categoria, "resto" só se sobrar produto) descritas na rota `/loja`. Coberto em
  `tests/loja.test.js`
- `getColecoesPublicas()` (X14) — `[{ id, nome, slug, descricao, ordem, categoria_id }]` por `ordem` (null por último) e nome; a `/loja`
  passa o resultado a `montarLoja`, que descarta as sem produto ativo. `getProdutos()` embute também `produto_colecoes(colecao_id)`
- `getVitrine(criterio = CRITERIO_VITRINE, limite = MAX_VITRINE)` — `{ titulo, produtos }`: produtos
  ativos ordenados pela coluna do critério e o título que deriva dele. Critérios em
  **`lib/vitrine.js`** (`novidades`/`novidade_ordem` = curadoria do X6, `recentes`/`created_at` = reserva,
  `favoritos` e `maisVendidos`/`destaque_ordem`, esses dois só a partir do C2); `CRITERIO_VITRINE` = `novidades`,
  `MAX_VITRINE` = 8 (teto da vitrine e do admin). Coluna curada: só produtos com valor, asc, desempate `created_at`
  desc; **curadoria vazia (nada marcado, marcados inativos, ou coluna inexistente `42703`) cai em `recentes`**, ainda
  "Novidades". Consulta e título saem da mesma entrada para não divergirem; "Mais vendidos" nunca com `created_at`
  (`tests/vitrine.test.js`). A home tem `revalidate = 60` (senão a curadoria só valeria no próximo build)
- `getCategoriasComProdutos()` — `[{ id, nome, slug, descricao, imagem_url, imagem_foco_x, imagem_foco_y,
  imagem_zoom, total }]` das categorias com ao menos um produto ativo (join `produtos!inner`; `total` = nº de
  produtos ativos); alimenta os chips da `/loja` e `GradeCategorias`. Coluna da foto inexistente (`42703`, ex.: SQL
  do X7 não aplicado em outro banco) → refaz a consulta sem as colunas de foto, nunca quebra
- `rotuloCategoria(produto)` — retorna o nome da categoria só quando
  `mostrar_categoria_no_titulo=true` **e** há `categoria_id` vinculado; senão `null` (sem
  fallback fixo)
- `getProdutoBySlug(slug)` embute também `tags(nome)` (N:N por `produto_tags`, ordenadas por nome, X13)
- `slugify(nome)` (só para **sugerir** slug nos formulários do admin e normalizar a digitação; não resolve
  mais rota), `slugValido(slug)` (regex + ≤ 80, a mesma regra do `check` no banco), `getProdutoBySlug(slug)`
  (`produtos.slug`, ativos) e `getSlugAtual(slugAntigo)` (`produto_slugs` → slug atual do produto ativo, ou
  `null`). `CardProduto` linka por `produto.slug`. Cobertos em `tests/slug.test.js`

### WhatsApp — `lib/whatsapp.js`

**Único lugar do número** (`WHATSAPP_NUMERO` `5573920026708`, `WHATSAPP_EXIBICAO`): `linkWhatsApp(texto?)` (`wa.me`,
com `?text=` codificado quando há texto) e `linkCompra(nome, url)` (mensagem "Olá! Tenho interesse em: {nome}" +
endereço da página; sem artigo porque os nomes variam de gênero). Usados por `BotaoComprar` e `Footer`. Coberto em
`tests/whatsapp.test.js`.

### Foco da foto — `lib/foco.js`

`normalizarFoco(v)` (inteiro 0–100; nulo/vazio/NaN/texto → 50, fora da faixa é limitado), `normalizarZoom(v)`
(inteiro 100–200; inválido → 100), `focoParaCss(x, y)` (`"30% 70%"`) e **`estiloFoto(x, y, zoom)`**, a porta única
do enquadramento das fotos de produto: devolve `object-position` e, com zoom > 100, `transform: scale(z)` com
`transform-origin` no próprio ponto de foco (o ponto fica parado e o resto se aproxima; nunca sobra vazio, o quadro
corta com `overflow: hidden`). Rotação foi descartada de propósito (cantos vazios; endireitar a foto antes do
upload). No admin, o `SeletorFoco` (`app/admin/produtos/SeletorFoco.js`, dentro do `ProdutoForm`) edita foco e zoom:
clique/arrasto na foto (ponteiro, funciona com o dedo), três deslizantes (Horizontal, Vertical, Zoom; teclado),
"Centralizar" (só a posição) e prévia no quadro do card; foto nova volta ao centro e 100%. Cobertos em
`tests/foco.test.js`.

### Fotos do produto (X1) — `lib/fotos.js`

**Produtos de teste (2026-11-07, temporários):** `supabase/scripts/teste_inserir_produtos.sql` cria 22 produtos (slug
`teste-*`, tags `teste-*`) cobrindo Chocolates, Presentes, Empório e Dia-a-Dia e as coleções Inspirar e Bombons (alguns
em duas coleções, vários sem coleção, um esgotado, um com estoque `null`); `teste_remover_produtos.sql` os apaga (só por
SQL, o admin tentaria apagar do Storage). Fotos WebP 4:5 em `public/teste/` (geradas à mão, fora do Storage): o
`caminho` de `produto_imagens` e `produtos.imagem_url` apontam para `/teste/...`, e `fotosDoProduto` devolve caminho com
`/` como URL direta. **v1 e `main` leem o mesmo banco: a produção mostra esses produtos (sem foto) até a remoção.**
Remover no D2 (item no plano): rodar o SQL de remoção e apagar `public/teste/`.

Várias fotos por produto na tabela `produto_imagens`; a primeira por `ordem` é a principal. Funções puras
(testadas em `tests/fotos.test.js`): `ordenarFotos`, `fotosDoProduto(produto, linhas, urlDe)` (sem linhas cai em
`produtos.imagem_url`, então produto nunca fica sem foto), `mover`, `tornarPrincipal`, `validarArquivos`
(limites `MAX_FOTOS = 8`, `TAMANHO_MAX` 5 MB, `TIPOS_ACEITOS` JPEG/PNG/WebP; o bucket impõe o mesmo) e
`caminhoDaUrl`. **`getFotosDoProduto(produto)`** (`lib/produtos.js`) entrega `[{ caminho, url, alt, foco_x, foco_y,
zoom }]` para a galeria do A7 (`GaleriaProduto` usa `estiloFoto(foco_x, foco_y, zoom)`). **`produtos.imagem_url` /
`imagem_foco_x/y` / `imagem_zoom` continuam como CÓPIA da principal**, regravada pelo `ProdutoForm` a cada
salvar: o card da home/loja, `/meditacao`, a lista do admin e a branch `main` (que só conhece essas colunas)
seguem funcionando sem mudança. No admin, `FotosProduto` (`app/admin/produtos/`) lista as fotos com botões
Subir/Descer/Tornar principal/Ajustar/Excluir (teclado e celular, sem arrastar) e reusa o `SeletorFoco` por
foto; `salvarFotos()` (no `ProdutoForm`) envia para `{produto_id}/{uuid}.{ext}`, grava as linhas, atualiza a cópia e só
então apaga do Storage as excluídas.

### Traduções — `lib/i18n.js` (X12, ADR 0002)

`traduzir(registro, traducao, idioma)` — fallback para o PT (pt, sem tradução ou sem registro devolve o registro;
senão sobrepõe só os campos de texto preenchidos, ignorando `idioma` e `*_id`) e `acaoTraducao(valores, existia)`
(`'gravar' | 'apagar' | 'nada'`, usada por `salvarTraducao`). **Nada público chama `traduzir` ainda** (sem rotas `/en`).
Cobertos em `tests/i18n.test.js`.

### Admin — `lib/admin/produtos.js`, `lib/admin/categorias.js`, `lib/admin/colecoes.js`, `lib/admin/estoque.js`

- `getAllProdutos()` (com `produto_colecoes(colecao_id)`), `getProdutoById(id)` (com `produto_imagens(*)` e
  `produto_colecoes(colecao_id)`), `getCategorias()`
- `lib/admin/colecoes.js` (X12): `getColecoes()` (`*, categorias(nome), colecao_traducoes(idioma)`, por `ordem` com
  null por último e nome — **saiu de `lib/admin/produtos.js`**) e `getColecaoById(id)` (com `colecao_traducoes(*)`)
- `lib/admin/tags.js` (X13): `getTags()` (`*, tag_traducoes(idioma)`, por nome) e `getTagById(id)` (com `tag_traducoes(*)`).
  `getAllProdutos()` embute também `produto_traducoes(idioma)` e `getProdutoById()` embute `produto_tags(tag_id)` e `produto_traducoes(*)`
- `getAllCategorias()` (com `categoria_traducoes(idioma)`), `getCategoriaById(id)` (com `categoria_traducoes(*)`)
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
  `preco_centavos` (inteiro, centavos), `colecao_id` (FK, nullable; **cópia da 1ª coleção**, X12:
  as coleções do produto estão em `produto_colecoes`), `categoria_id` (FK,
  nullable), `mostrar_categoria_no_titulo` (bool), `tem_meditacao` (bool), `audio_url`,
  `ativo` (bool), `imagem_url`, `imagem_foco_x`/`imagem_foco_y` (smallint not null, 0–100, default 50, `check`;
  ponto de foco da foto), `imagem_zoom` (smallint not null, 100–200, default 100, `check`) — migrations em
  `supabase/migrations/` (`..._produtos_foco_imagem.sql`, `..._produtos_zoom_imagem.sql`), ver `lib/foco.js` —, `estoque` (nullable — mantido pela trigger, nunca por
  `UPDATE` da aplicação), `created_at` (usado por `getVitrine()` para ordenar a
  vitrine da home, critério reserva de "Novidades"), **`novidade_ordem`** (X6; migration
  `supabase/migrations/20261106130000_produtos_novidade_ordem.sql`, **aplicada em 2026-11-06**: smallint nullable,
  `check > 0`, sem default nem `unique`; posição na vitrine Novidades, 1 = primeiro, null = fora; segura para a `main`,
  que a ignora), **`slug`** (X8; migration `supabase/migrations/20261106120000_produtos_slug.sql`,
  **aplicada em 2026-11-06**: text not null, `unique`, `check` `^[a-z0-9]+(-[a-z0-9]+)*$` e ≤ 80; gerado uma vez e **não
  muda com o nome**; trigger `before insert` preenche com `public.slugify(nome)` se vier vazio — cobre o admin da `main`)
  **X13** (migration `supabase/migrations/20261107120000_x13_campos_produto.sql`, **aplicada em 2026-11-07**): `descricao_curta`
  (text nullable, `check char_length <= 120`) e `ingredientes` (text nullable), seguras para a `main`. **`atributos` segue na
  tabela só para a `main`**: a `v1` não o exibe nem o grava; `descricao` é a descrição longa (sem renomear)
- **`tags`**, **`produto_tags`**, **`tag_traducoes`**, **`produto_traducoes`** (X13, mesma migration; ADR 0002, opção B) —
  `tags`: `id`, `nome`, `slug` (`unique` + `check` de formato), `created_at`; `anon` lê tudo, `authenticated` escreve.
  `produto_tags`: M:N produto ↔ tag, PK `(produto_id, tag_id)`, cascade, RLS no padrão de `produto_colecoes`. `tag_traducoes`
  `(tag_id, idioma, nome)`. `produto_traducoes` `(produto_id, idioma, nome, descricao_curta ≤120, descricao, ingredientes)`:
  `anon` lê só de produto ativo. `idioma` só `'en'`; campo vazio cai no PT (`lib/i18n.js`). Sem `atributos` nem `audio_url`
  (esse é o I3). Editadas pela seção `TraducaoEn` do admin; nada público usa a tradução ainda
- **`produto_slugs`** (X8, mesma migration) — `slug` (PK, mesmo `check`), `produto_id` (FK `produtos`, `on delete
  cascade`), `created_at`: todo slug que um produto já teve, inclusive o atual. Preenchida só pela trigger `after
  insert or update of slug` em `produtos` (`security definer`), que recusa com `23505` um slug de outro produto;
  é o que faz o link antigo redirecionar e impede reaproveitá-lo. RLS: `anon` lê só de produto ativo, `authenticated`
  lê tudo, **sem escrita direta**. Função auxiliar `public.slugify(text)` (usa a extensão `unaccent`, mesma regra do JS)
- **`produto_imagens`** (X1; migration `supabase/migrations/20261105181330_produto_imagens.sql`) — `id` (uuid), `produto_id` (FK
  `produtos`, `on delete cascade`), `caminho` (no bucket `produtos`, `unique (produto_id, caminho)`), `ordem`
  (menor = antes; a primeira é a principal), `foco_x`/`foco_y` (0–100, default 50), `zoom` (100–200, default
  100), `alt` (opcional), `created_at`. RLS: leitura pública (`anon`) só de produto ativo; escrita para
  `authenticated` (mesmo modelo das demais, ver pendência de segurança #1). `produtos.imagem_*` é a cópia da principal
- **`categorias`** — `id`, `nome`, `slug`, `descricao` — tipo do produto, usado como
  rótulo de exibição (ex.: "Chocolate", "Combo"). **X7** (migration `supabase/migrations/20261106140000_categorias_imagem.sql`,
  **aplicada em 2026-11-06**): `imagem_url` (text nullable), `imagem_foco_x`/`imagem_foco_y` (smallint not null, 0–100, default 50) e
  `imagem_zoom` (smallint not null, 100–200, default 100), todas seguras para a `main`; editadas no `CategoriaForm`
  com o `SeletorFoco` (prévia 16:9). X8: o slug não
  acompanha o nome; a mesma migration acrescenta índice `unique` e `check` de formato (`not valid`, vale só para
  gravações novas). Sem histórico/redirect de slug de categoria (link antigo cai em "Todas", nunca 404)
- **`colecoes`** — `id`, `nome`, `slug`, `descricao` — linha de marketing/produto (ex.:
  "Coleção Inspirar"); **conceito diferente de categoria**, mas **pertence a uma categoria**. **X12** (migration
  `supabase/migrations/20261106150000_x12_colecoes.sql`, **aplicada em 2026-11-06**): `categoria_id` (FK `categorias`,
  `on delete restrict`, not null; backfill = Chocolates), `ordem` (smallint nullable, `check > 0`; posição dentro da
  categoria, null = fim), slug `unique` + `check` de formato (`not valid`), slug da Inspirar `cole-o-inspirar` →
  `inspirar`, seed "Bombons" (`bombons`, Chocolates, ordem 2) e policy `"colecoes admin"` (escrita `authenticated`;
  a migration não liga nem desliga RLS: estado atual não versionado, B-1b). O slug da coleção é usado em link público só na `/loja` (`?colecao=slug`, X14)
- **`produto_colecoes`** (X12, mesma migration) — M:N produto ↔ coleção: `produto_id`, `colecao_id` (FKs, `on delete
  cascade`), `created_at`, PK `(produto_id, colecao_id)`. RLS no padrão de `produto_imagens` (anon lê só de produto ativo,
  `authenticated` tudo). **`produtos.colecao_id` segue como CÓPIA da 1ª coleção** (a `main` só conhece essa coluna);
  os triggers `produtos_sincronizar_colecao_ins/_upd` (`sincronizar_colecao_principal()`) refletem em `produto_colecoes`
  a troca/remoção feita pelo admin da `main` (tira o par antigo, põe o novo; as outras coleções ficam). Sem coluna
  `ordem` (o ADR a previa; nada a usa, acrescentar depois é aditivo). Backfill dos pares a partir de `colecao_id`
- **`categoria_traducoes`**, **`colecao_traducoes`** (X12, mesma migration; ADR 0002, opção B) — `categoria_id`/
  `colecao_id` (FK, `on delete cascade`), `idioma` (`check in ('en')`), `nome`, `descricao` (nullable), PK
  `(entidade_id, idioma)`. RLS: `anon` lê tudo (as entidades já são públicas), `authenticated` escreve. Campo vazio cai
  no PT (`lib/i18n.js`). Editadas pela seção `TraducaoEn` do admin
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

- **Storage**: bucket `produtos` (limite de 5 MB e só JPEG/PNG/WebP, definido no SQL do X1), caminho
  `{produto_id}/{uuid}.{ext}` nas fotos novas (nome único, sem cache-buster); fotos antigas ficam em
  `{produto_id}/principal.{ext}` (com `?v=` em `imagem_url`). Fotos de categoria (X7): bucket **próprio `categorias`**
  (público, 5 MB, JPEG/PNG/WebP, criado com a policy `authenticated` de escrita no SQL de
  `20261106140000_categorias_imagem.sql`, aplicado em 2026-11-06), caminho `{categoria_id}/{uuid}.{ext}`. URL pública

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
  solto em componente novo é proibido. Fontes: só `--font-display/body/accent` (a accent só em
  destaque curto e grande). Tamanhos de texto: só `--tam-*`. Os nomes antigos (`--bg`, `--green`…)
  são aliases a eliminar, não a usar.
- Fontes **hospedadas no projeto** (`next/font/local` em `app/layout.js`, WOFF2 latin em
  `app/fonts/`, licenças e receita em `app/fonts/LEIA-ME.md`): Fraunces, Assistant e Amsterdam One.
  **Não voltar a `next/font/google`:** em 2026-11-05 o build do Netlify quebrou
  ao baixar a EB Garamond do Google (`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`,
  "queries have exactly one entry"), sem reproduzir localmente; o build agora não depende de rede
  externa. Variáveis `--font-fraunces`, `--font-assistant`, `--font-amsterdam`, só consumidas por
  `globals.css`
- Menu e mockups: ver `lib/navegacao.js`; mockup = `status: 'mockup'` + `exigirMockups()`
- Preços sempre em **centavos** (inteiro) no banco; formatação BRL na exibição
- Selo "Esgotado" (`estoque === 0` em `/loja` e `/loja/[slug]`; na página do produto o botão vira "Consultar no
  WhatsApp") usa
  comparação estrita — `estoque` é nullable e `null` significa "não controlado", não deve
  virar "Esgotado"
- **Sem TypeScript** — projeto é JavaScript puro
- **Mudança de banco = arquivo novo em `supabase/migrations/`** (`AAAAMMDDHHMMSS_descricao.sql`, com
  cabeçalho "o que faz, fatia, já aplicado em produção em <data>", reexecutável). **Nunca editar um
  arquivo já aplicado**; o Code entrega o SQL nesse formato junto com a fatia. SQL de dados que se
  repete (ex.: reconciliação do X1 no D2) vai em `supabase/scripts/`, não é migration. Regras em
  `supabase/migrations/README.md`
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
  `poweredByHeader: false`; `env.NEXT_PUBLIC_MOCKUPS` **fixado** (`''` se ausente, coberto em
  `tests/paletas.test.js`): sem isso o Next não inlina a env no client e o código de mockup não é
  descartado do bundle de produção; headers de segurança em todas as rotas (CSP com
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

## Deploy

Regras permanentes, a seguir quando o dono pedir:

- **"deploy pra v1":** commitar o que estiver pendente (mensagem descritiva, em português) e dar push na branch `v1`.
- **"deploy pra main":** commitar o que estiver pendente, dar push na `v1`, fazer o merge da `v1` na `main` e dar
  push na `main`. **Nunca apagar a `v1`**; voltar para a `v1` depois do merge.
- **Nos dois casos:**
  - rodar `npm test` e `npm run build` antes; se falharem, parar e avisar o dono;
  - nunca usar force push;
  - se houver migration nova em `supabase/migrations/` que o dono possa não ter aplicado, avisar e esperar a
    confirmação dele antes do push.

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