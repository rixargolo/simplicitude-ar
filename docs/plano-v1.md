# Simplicitude v1 — Auditoria, decisões e lista priorizada

Data: 2026-11-04 · Status: plano aprovado. **Feitos: A1 (concluído e verificado) e A2 (no código).**
Decisão de portabilidade: [ADR 0001](adr/0001-portabilidade.md).

**Legenda:** 🔒 bloqueia o go-live · 🧩 depende de terceiros (dona, você ou fornecedor).

**Marco da 1ª versão pública:** loja completa com checkout InfinitePay no domínio próprio
(`simplicitude.com.br`), com CNPJ/endereço no rodapé, privacidade, entrega e trocas e Open Graph.
Os meios de pagamento são os que o Checkout InfinitePay oferece.

---

## 1. Auditoria do repositório

### 1.1 Pronto e reaproveitável
| Item | Onde | Por que serve na v1 |
|---|---|---|
| Admin completo (auth, CRUD produtos/categorias, estoque, histórico, sidebar) | `app/admin/**`, `lib/admin/*` | Base do back-office; ganha "Pedidos" e depois "Frete" |
| Estoque por movimentação + trigger `calcular_estoque_movimentacao` (`for update`, bloqueia negativo) | banco + `MovimentacaoForm.js` | Já é o mecanismo certo para a baixa automática na venda |
| Schema `clientes`, `enderecos`, `pedidos`, `pedido_itens`, `pagamentos` (com snapshots) | banco | Bom; precisa de ajuste para convidado (4.1) |
| Auth em 2 camadas (`proxy.js` + guard em `app/admin/layout.js`, `getUser()`) | `lib/supabase/middleware.js` | Correto, manter |
| Headers de segurança + CSP | `next.config.mjs` | Já existe; ajustar ao integrar a InfinitePay |
| `LogoAnimado` + script anti-flash | `app/components/`, `app/layout.js` | O escopo pede manter |
| `VitrineProdutos` (carrossel scroll-snap) | `app/components/` | Base do "Mais vendidos" |
| `MeditacaoPlayer`, `ApresentacaoProduto` | `app/components/` | Reaproveitar a lógica |
| `slugify`, `rotuloCategoria`, `getProdutos` | `lib/produtos.js` | Reaproveitar |
| Upload de imagem `{id}/principal.{ext}` com cache-buster | `ProdutoForm.js` | Manter |

### 1.2 Código morto / a remover
- `public/produtos/{alegria,esperanca,serenidade}.jpg` e `public/marca/logo-simplicitude-452w.png`:
  sem nenhuma referência (as imagens vêm do Storage).
- Ramo `produto.imagens` em `ApresentacaoProduto.js`: não existe coluna `imagens`, então a galeria
  nunca renderiza.
- `getProdutosRecentes()`: substituído por `getVitrine()` (A4), que deriva o título do critério.
- Home atual (partículas `mulberry32`, glow, teaser duotone, título em inglês).
- `app/contato/page.js`: placeholder quebrado que está no menu.
- Tokens `--green-nav`, `--cream-name`, `--gold`, `--caramel`, `--cream` e ~55 cores hex soltas
  em 15 CSS.
- `scripts/migrar-imagens-produtos.mjs`, `scripts/vincular-audio-meditacao.mjs`: one-off já
  rodados.
- `README.md` ("simplicitude-ar"): desatualizado.
- `formatBRL` duplicado 3× (`loja/page.js`, `loja/[slug]/page.js`, `VitrineProdutos.js`).

### 1.3 Conflitos com o novo escopo
1. **"Comprar" inerte** e a decisão vigente de login obrigatório, que conflita com o tráfego
   mobile do Instagram e com a persona "presente".
2. **`pedidos.cliente_id NOT NULL`**: impede checkout de convidado sem migration.
3. **Convenção "sem API routes"**: o checkout precisa de rota server-side com service role
   (pendência #3 do CLAUDE.md).
4. ~~**Menu** tem Quem Somos e Contato; a v1 é Início/Loja/Meditação.~~ **Resolvido no A2:** menu Loja/Bem-estar/Bem-fazer/Quem somos/Assinaturas (os dois últimos de mockup, só no preview); `/contato` removida.
5. ~~**Telefone do rodapé** é o antigo `(73) 99140-8689`.~~ **Resolvido no A2.**
6. ~~**Slug calculado do nome**: renomear um produto quebra links já postados no Instagram.~~ **Resolvido no X8:** `produtos.slug` fixo + redirect 308 do antigo.
7. **Estoque compartilhado com feiras/B2B**: sem lançar as vendas presenciais, o estoque online
   vende o que não existe.
8. **Domínio e e-mail**: o site roda em `simplicitude-ar.netlify.app`; DNS e e-mail principal
   estão na GoDaddy (temporária) e o registro é no registro.br.

### 1.4 Lacunas de engenharia
- **Sem migrations no repo**: schema, RLS e trigger só existem no painel do Supabase.
- **Sem ambiente de teste**: qualquer teste de RLS ou checkout bateria em produção.
- **Sem lint ou CI**; testes só com Vitest desde o A1 (`npm test`).
- **Achados abertos da auditoria de segurança** (`_DOCS/AUDITORIA_SEGURANCA.md`, local): M2
  (sem validação server-side, upload sem MIME/tamanho, sem `CHECK`) e pendências #1–#4.
- **Achados abertos da avaliação de design** (`_DOCS/avaliacao-design-2026-10-20.md`, local):
  nome do produto com contraste 1,4:1, páginas descentralizadas, hero sem CTA, 4 famílias
  tipográficas. O redesign resolve a maioria.
- `.mcp.json` (Playwright + Context7) existe só localmente.
- **Cadastro público do Supabase confirmado desligado** (`disable_signup: true`, 2026-11-04).

---

## 2. Decisões técnicas

### 2.1 Checkout: convidado
**Recomendação: convidado.** Nome, e-mail, telefone e CPF ficam no pedido; o acompanhamento é por
link com token aleatório enviado por e-mail.
- **A favor:** tráfego mobile do Instagram e compra de presente; criar conta derruba a conversão.
  Não exige abrir cadastro público, então a v1 não depende de RLS de cliente.
- **Contra:** sem histórico nem endereços salvos para recompra. Precisa de migration
  (`pedidos.cliente_id` nullable + `comprador_*` + `token_acesso`). `clientes`/`enderecos` ficam
  para contas opcionais depois da v1.

### 2.2 "Mais vendidos" sem histórico
Coluna `destaque_ordem` (int, nullable) em `produtos`, preenchida no admin com o que de fato mais
vende hoje, segundo a dona. Com ~3 meses de pedidos pagos, trocar por uma view com a soma de
`pedido_itens.quantidade` dos últimos 90 dias, mantendo o manual como desempate.
- **Trade-off:** "mais vendidos" é uma afirmação ao consumidor. O título segue a regra de nomes
  do bloco A: `created_at` → "Novidades"; curadoria sem dado de venda → "Favoritos"; só com a
  ordem real da dona (ou histórico) → "Mais vendidos". **A ordem por `created_at` nunca vai ao ar
  com o título "Mais vendidos".**

### 2.3 Pedido → pagamento → estoque → aviso
1. `/api/checkout` cria o pedido `pendente` e gera o link InfinitePay.
2. O webhook é **só gatilho**: o servidor consulta `payment_check` (`paid`, `paid_amount`) e
   confere o valor com `valor_total_centavos`.
3. A RPC `confirmar_pagamento()` roda numa transação com `update pedidos set status='pago' where
   id=… and status='pendente'` (idempotente), insere `pagamentos` (`unique(referencia_externa_id)`)
   e uma movimentação `venda` por item. A trigger existente faz a baixa e bloqueia estoque negativo.
4. Depois do commit, os e-mails saem. A reconciliação cobre webhook perdido e expira pendentes
   antigos: rota `POST /api/tarefas/reconciliar` (segredo `CRON_SECRET`), disparada por cron do
   GitHub Actions a cada 15 min e também ao abrir `/pedido/[token]` pendente.

- **Baixa no pagamento, não na criação** (sem reserva com expiração). Risco: dois clientes pagarem
  a última unidade. Com o volume atual é raro; se ocorrer, a RPC marca o pedido para estorno
  manual e avisa o admin (`shortcut:` documentado no código).
- **Service role** só nas rotas `/api/*`, em env server-side, nunca `NEXT_PUBLIC_`. A InfinitePay
  não documenta assinatura de webhook (confirmar em C1); a consulta ao `payment_check` protege
  contra webhook forjado.
- **Route handlers do Next, não Supabase Edge Functions:** evita um segundo runtime (Deno) e outro
  deploy.

### 2.4 Frete
Tabela própria de zonas por faixa de CEP (rota regional, Bahia, demais estados), com valor por
faixa de peso e prazo, mais retirada. Na versão pública as zonas entram por **migration (seed)**;
o admin de frete vem depois. A etiqueta é comprada à mão. Depois da v1: API do Melhor Envio
(cotação Correios/Jadlog + etiqueta), peça da automação dos 6 meses. O checkout só chama
`calcularFrete()`, então a troca não o afeta.
- **Trade-off:** a tabela é zero dependência e fica sob controle da dona, mas pode cobrar a mais
  ou a menos fora da região. O Melhor Envio é preciso, mas exige conta, token, dimensões por
  produto e tratamento de API fora do ar. Correios direto exige contrato.

### 2.5 Testes
- **Unitário/integração:** Vitest. Unitário em lógica pura (frete, totais, carrinho, validações,
  carrossel). Integração (RLS por perfil, RPC `confirmar_pagamento`) **só no staging**.
- **E2E:** `@playwright/test`, 1 teste mobile do fluxo de compra contra o staging, rodado
  localmente antes da virada. Vale instalar: é a única prova do fluxo de venda inteiro.
- **`npm test` (que roda no build do Netlify) é só offline.** Teste que toca rede ou staging roda
  localmente ou em workflow manual.
- **Context7 MCP:** sim (Next 16 mudou APIs, ex.: `proxy.js`). **Playwright MCP:** opcional, local.

### 2.6 Estoque inicial
Sem script. No dia da virada a dona conta o físico e lança um `ajuste` por produto em
`/admin/estoque/nova`, com a observação "inventário inicial AAAA-MM-DD". **Regra de processo:**
daí em diante, toda venda fora do site (feira, B2B, WhatsApp) é lançada como `ajuste` negativo, ou
se separa uma cota só para o online.

### 2.7 Glossário e ADRs
Sem glossário: o CLAUDE.md já define os termos que confundem. ADR 0001 (regra transversal que
alguém quebraria sem saber o porquê) e ADR 0002 (multilíngue: estrutura de URL e de tabelas, cara de
reverter). As demais decisões viram uma linha no CLAUDE.md. Critério para um ADR futuro: decisão cara
de reverter e cujo motivo não aparece no código.

### 2.9 Multilíngue (PT e EN)
Decisão em [ADR 0002](adr/0002-multilingue.md) (proposto, **nada implementado**, pós-go-live). Resumo: PT
fica nas colunas atuais e EN em tabelas `*_traducoes` com fallback para o PT (a `main` e o banco compartilhado
não mudam); PT sem prefixo e EN em `/en/...`; slugs e caminhos não se traduzem; idioma por cookie
`idioma` + `Accept-Language` + país, só no `proxy.js`; áudio EN em `produto_traducoes.audio_url`. Fatias
**I1–I4** no Pós-go-live. `descricao_curta` e `ingredientes` (C2), coleções M:N e tags nascem já com o par de
tradução.

### 2.8 Visual antes da segurança do banco
Seguro, porque o cadastro está desligado, as fatias visuais não escrevem dados, e o checkout
escreve pelo servidor com service role sem criar policy para anon. Riscos que sobram:
1. Alguém religar o cadastro no painel → vigia diário (B7).
2. Policies de anon mal configuradas nas tabelas de pedido/cliente (hoje invisível, tabelas
   vazias) → conferência de `pg_policies` em B-1b 🔒.
3. Criar um 3º usuário no Auth (vira admin pleno) → não criar antes do `is_admin()`.
4. Senha de admin comprometida → senha forte + MFA, se o plano permitir.
5. Login de admin pelo preview → `/admin` e `/login` devolvem 404 com a flag de mockups (B4).

O `is_admin()` é obrigatório **antes de contas de cliente ou de um 3º usuário**, não antes do
checkout de convidado. As salvaguardas do checkout são 🔒: preço e frete recalculados no servidor,
service role só no servidor, webhook confirmado por `payment_check`, anon negado nas tabelas de
pedido.

---

## 3. Lista priorizada

Você decide em qualquer ponto se continua ou para. Situação de cada item: **real** (dados reais
ou lógica definitiva), **mockup** (UI final com dados falsos atrás da flag, B3),
**cortar-se-atrasar** (sai da versão pública se não ficar pronto). Cada item termina com
`npm test && npm run build` verdes, CLAUDE.md atualizado e teste visual feito por você.

### Bloco A — Front (vem primeiro: destrava a aprovação de design)

**Ordem de execução do front (ajuste de 2026-11-04):**
**A1 → A2 → A3/A4/A5 → A6/A7 → ✋ mostrar o preview à dona.** Só depois disso vêm o **A0** (contrato
de dados) e o carrinho/checkout (**A8–A10**), e então A11–A12. A numeração dos itens não muda;
vale a ordem desta frase, não a da tabela.

Consequências:
- A primeira rodada é só leitura (home, loja, produto) com os produtos reais do banco: não há
  mock nem botão morto nela.
- Sem carrinho, **o A7 sai da primeira rodada sem quantidade nem "Adicionar ao carrinho"**
  (preço, estoque, ficha e selo de meditação sim). O botão de compra chega com o A8, junto do
  contrato do A0. Não entra botão inerte nem na primeira rodada.
- O A0 deve estar pronto antes de qualquer mockup de carrinho/checkout (A8–A10), para o mock não
  divergir do que será implementado (regra da seção 4).
- No preview da primeira rodada, o item de menu/CTA "Loja" leva ao catálogo; não há fluxo de
  compra a demonstrar à dona ainda, e isso deve ser dito a ela.

| # | Item | Situação | Marca | Notas / skills / testes |
|---|---|---|---|---|
| A0 | *(depois do ✋)* **Contrato de dados** do carrinho, cotação, checkout e pedido público (seção 4) + Vitest | real | 🔒 | `lib/checkout/contrato.js` com JSDoc, fixtures e `validar*()` usados pelo mock e pela API futura. tdd |
| A1 | **Infra de preview**: branch `v1`, branch deploy, flag `NEXT_PUBLIC_MOCKUPS`, `noindex`, `/admin` e `/login` em 404 no preview (B3, B4) | real | 🔒 | nenhuma escrita em dados reais. ✅ **Concluído (2026-11-04):** branch deploy da `v1` ativo, envs configuradas no Netlify, verificado em produção e na `v1` |
| A2 | Tokens por papel (cor + fonte) + Header/Footer: menu **Loja, Bem-estar** (`/meditacao`, rótulo a confirmar), **Bem-fazer, Quem somos, Assinaturas** (logo leva à home; itens definidos em `lib/navegacao.js` com status real/mockup; Bem-fazer e Assinaturas são páginas "Em breve" só no preview, 404 e fora do menu em produção), WhatsApp novo, e-mail, Instagram, **CNPJ, razão social, endereço**; remove `/contato` | real | 🔒🧩 (CNPJ) | ✅ **No código (2026-11-04).** Tokens por papel (`--cor-fundo/texto/destaque/botao/rodape`) preparam o seletor de presets do preview; nomes antigos viram aliases até cada página ser refeita. No preview aparece "CNPJ a confirmar"; em produção a linha some até o dado chegar. Referência vaga da dona (Canva), não especificação. design-taste-frontend |
| A2b | ~~**Seletor de paleta** do preview: barra no topo, presets Azul/Verde/Mix 1/Mix 2 em `lib/paletas.js`, `?paleta=` + `localStorage`~~ | — | — | **Substituído pelo X2 (2026-11-05):** o seletor, os presets e o script inline saíram; a paleta de uso é a verde, direto em `globals.css` |
| A3 | Home: hero em carrossel (auto, setas/pontos, ~~botão de pausa~~ *(resolvido no X4: saiu; a pausa por hover, foco e toque ficou)*, `prefers-reduced-motion`) com slides de Loja e Meditação | real | 🔒 | ✅ **No código (2026-11-04).** `HeroCarrossel` (layout "sobreposto"; 2º layout "dividido" é uma entrada em `LAYOUTS` + um bloco de CSS) e `lib/carrossel.js` com Vitest. **Fotos (2026-11-05):** as 4 fotos da dona estão ligadas aos slides (`public/home/hero_slide_{1..4}.webp`, WebP q85 nas dimensões originais, de ~15 MB de PNG para ~1,7 MB; receita no CLAUDE.md). Slide sem foto continua virando placeholder `FotoPendente` no preview e sendo omitido em produção (sem nenhum, o hero não renderiza e a home fica sem `h1`). Check no D2 mantido, para o caso de a dona trocar alguma foto |
| A4 | Home: vitrine de produtos no layout da dona (B6) com produtos reais | real | 🔒 | **o título depende do critério de ordem (regra de nomes abaixo): com `created_at` a seção se chama "Novidades", nunca "Mais vendidos".** Descrição com fallback `line-clamp` | ✅ **No código (2026-11-04).** `VitrineProdutos` em duas colunas; `lib/vitrine.js` (critério → título) + `getVitrine()`; ~~chips levam a `/loja?categoria=slug` (filtro é o A6)~~ **chips removidos no X10** (repetiam a `GradeCategorias`; ficou "Ver toda a loja") |
| A5 | Home: seção de categorias logo abaixo da vitrine (substitui o teaser antigo de meditação, já coberto pelo slide do hero e pelo item "Bem-estar" do menu) | real | 🔒 | ✅ **No código (2026-11-05).** Reativado (antes era cortar-se-atrasar). `GradeCategorias`: cartões claros e arredondados no estilo do cartão do hero, tom levemente variado por posição (nome em serifa itálica moderada, descrição de 2 linhas, nº de produtos, pílula "Ver produtos"; 1/2/4 colunas) com dados reais, só de categorias com ≥1 produto ativo de `getCategoriasComProdutos()`, cada um levando a `/loja?categoria=slug` (o filtro é o A6). Só tokens de papel; contraste do texto sobre cada tom testado a 4,5:1 por preset em `tests/paletas.test.js`. ~~**Sem foto por enquanto:** `categorias` não tem `imagem_url`… a coluna pertence ao grupo da migration C2.~~ **Resolvido no X7:** `categorias.imagem_url` (+ foco/zoom, upload no `CategoriaForm`, bucket `categorias`) já existe e o `select` de `getCategoriasComProdutos()` a inclui (faixa 16:9 no topo do cartão). Falta só a foto da dona (seção 5). design-taste-frontend |
| A6b | Enquadramento das fotos de produto: card em quadro fixo (`--proporcao-produto`) com `cover` + ponto de foco e zoom por produto (`produtos.imagem_foco_x/y`, `imagem_zoom`, `SeletorFoco` no admin, `lib/foco.js`) | real | 🔒 | ✅ **No código (2026-11-05).** Substitui o `contain` + padding do A4. Migrations das 3 colunas em [`supabase/migrations/`](../supabase/migrations/) (`..._produtos_foco_imagem.sql`, `..._produtos_zoom_imagem.sql`), já aplicadas em produção (2026-11-05). A7 reusa `estiloFoto` |
| A6 | `/loja` com filtro por chip (`?categoria=slug`) | real | 🔒 | ✅ **No código (2026-11-05).** Card compartilhado com a vitrine (`CardProduto`); slug desconhecido = "Todas" (link antigo nunca cai em página vazia); página dinâmica por causa do `searchParams` |
| A7 | Produto: ficha, preço, estoque, selo de meditação, **galeria** e **Comprar → WhatsApp** (mudança de rota). **Quantidade e "Adicionar ao carrinho" só entram com o A8** | real | 🔒 | ✅ **No código (2026-11-06), sem migração.** `GaleriaProduto` (fotos de `getFotosDoProduto`, cada uma com seu foco/zoom via `estiloFoto`, quadro do card, miniaturas em botões: teclado e celular) dentro de `ApresentacaoProduto` (que perdeu o ramo morto `produto.imagens` e ganhou `fotos`/`Titulo`; a página do produto agora tem `h1`; `/meditacao` ganhou o enquadramento por foto). `lib/whatsapp.js` guarda o número (55 73 9 2002 6708) e monta o link (`linkCompra`, testado em `tests/whatsapp.test.js`); `BotaoComprar` é o único ponto que usa e o **gancho do registro de clique** (virar client + `sendBeacon`). Nova aba, link direto ao `wa.me`. **Sem estoque:** selo "Esgotado" + o mesmo botão como "Consultar no WhatsApp". Selo de meditação segue só como link para `/meditacao` (sem player na página do produto, decisão do dono). Metadata: `title`, `description` e `openGraph` (título + foto principal); o resto é o A11. Endereço absoluto da mensagem vem de `headers()` (`host`), então a página é dinâmica; `SITE_URL`/`metadataBase` entram no A11. ~~Rota segue com `slugify` até a coluna `slug` (C2); o backfill gera os mesmos slugs~~ **Resolvido no X8:** a rota usa `produtos.slug` (fixo) e o slug antigo redireciona com 308 |
| A8 | Carrinho (`localStorage`, formato do A0, preços lidos do banco) + quantidade/"Adicionar ao carrinho" no A7 | real | 🔒 | depende do A0. Só cliente. tdd |
| A9 | Checkout (contato, CEP, retirada/regional/transportadora, opções de frete, resumo) | mockup → real em C5 | 🔒 | o submit vai para o mock e abre o pedido falso |
| A10 | Tela "indo para o pagamento" + `/pedido/[token]` | mockup → real em C5 | 🔒 | fixture do A0 |
| A11 | Páginas legais (`/privacidade`, `/entrega`, `/trocas`) + Open Graph | real | 🔒🧩 (aprovação dos textos) | **No código (2026-11-08).** Textos em `content/legal/*.md` (editáveis sem código), data única em `lib/legal.js`, links no rodapé, `metadataBase` por `SITE_URL`, imagem OG padrão (`app/opengraph-image.png`), `##`/`###` no parser. **Os textos têm 9 marcas `[CONFIRMAR]` em aberto** (privacidade 2, entrega 2, trocas 5; `npx vitest run tests/legal.test.js --silent=false` lista onde). Sem sitemap/robots no projeto (não criados). A dona/advogado aprova e resolve as marcas no D2 |
| A12 | `/meditacao`: herda os tokens + link "Comprar" por produto | real | — | o redesign completo é cortar-se-atrasar (pós-go-live). **Já feito (2026-11-08):** topo novo (faixa de 3 fotos + texto da dona em 2 colunas) e link "Ver na loja" por produto (X19 revisado); a lista de meditações em si não mudou |
| ✋ | **Aprovação do design pela dona** sobre o preview do A1, **mostrado após A1 → A2 → A3/A4/A5 → A6/A7** | — | 🔒🧩 | impedimento atual; não bloqueia os blocos B–D. O preview mostra a seção como "Novidades" e deve-se avisar a dona do porquê (regra de nomes) |

**Regra de nomes da vitrine da home (ajuste de 2026-11-04):** "Mais vendidos" é uma afirmação ao
consumidor, então o título sai do critério de ordem realmente usado, e nunca é escolhido à mão:

| Critério de ordem | Título permitido |
|---|---|
| `novidade_ordem` (curadoria da dona do que é novo, X6) ou, sem curadoria, `created_at` (mais recentes primeiro) | **Novidades** |
| `destaque_ordem` curado, sem dado de venda por trás | **Favoritos** |
| `destaque_ordem` definido pela dona a partir de vendas reais, ou soma de `pedido_itens` | **Mais vendidos** |

- O componente recebe o `criterio` e deriva o título dele (um único lugar no código), para o
  título não divergir da ordem.
- **Gate do go-live 🔒 (D2):** o site público não pode exibir "Mais vendidos" ordenado por
  `created_at`. Sem ordem real da dona, vai ao ar como "Novidades" (ou "Favoritos" se ela curar
  a ordem sem dado de venda). Isso não bloqueia a virada, só o nome.
- `destaque_ordem` é criado no C2; antes disso só "Novidades" existe.

### Backlog X — ajustes vindos do feedback da dona (ajuste de 2026-11-05)

**Mudança de rota:** o site vai ao ar primeiro com o botão **Comprar levando ao WhatsApp**; o
checkout automático (bloco C, A0, A8–A10) fica **para depois do go-live**. Os ajustes que a dona da
fábrica pedir entram neste backlog "X" (X1, X2…), cada um uma fatia pequena, encaixada na ordem onde
fizer sentido.

**Nova ordem (ajuste de 2026-11-05, atualizada em 2026-11-07):** A1 → A2 → A3/A4/A5 → A6 → **X1 → X2 → X3** → A7 (Comprar →
WhatsApp) → **X8 (prioridade) → X4 → X5 → X6 → X7 → X10 → X9 (404 da marca) → X12 → X13 → X14 → X18 (feedback da dona, rodada 2, em 3 fatias)** → ✋ dona → A11 (legais + Open Graph, com o **X17**) → D (go-live sem pagamento) →
(**X11** Storage corre em paralelo, junto do B-1b; **X19** (link "Ver na loja" por produto em `/meditacao`, que trocou a pílula do topo para a Coleção Inspirar) e **X20** (título da meditação no produto) já estão no código; **X14–X17** são ideias novas, a encaixar depois do ✋ conforme a dona decidir) →
depois: C, A0, A8–A10 (carrinho/checkout). B-1b/B-2 seguem em paralelo. Do D2 sai, por ora, o "pagamento
real baixo + estorno" (volta quando o C existir).

| # | Item | Situação | Marca | Notas |
|---|---|---|---|---|
| X1 | Várias fotos por produto | real | 🔒 | ✅ **No código (2026-11-05).** Tabela `produto_imagens` (ordem, foco/zoom e texto alternativo por foto; a primeira é a principal); `produtos.imagem_url`/`imagem_foco_x/y`/`imagem_zoom` seguem como **cópia da principal** (a `main` e o admin atual só leem/gravam isso, e preview e produção dividem o banco). Admin: `FotosProduto` (enviar várias, subir/descer por botão, tornar principal, excluir também do Storage, ajustar com o `SeletorFoco`). Limites: 8 fotos, JPEG/PNG/WebP, 5 MB (também no bucket). `getFotosDoProduto()` pronta para o A7; **a galeria não entra aqui**. SQL já aplicado em produção (2026-11-05), ver abaixo |
| X2 | Paleta verde como padrão, sem seletor | real | 🔒 | ✅ **No código (2026-11-05).** `--cor-texto` passa a `#27401e` em `app/globals.css` (verde em texto, destaque, botão e rodapé); o azul fica só como referência em [`docs/paleta-azul.md`](paleta-azul.md) (valores completos, contrastes e a regra nunca azul sobre verde, 1,17:1). **Removido:** `SeletorPaleta` (JS + CSS), `lib/paletas.js` (presets Azul/Verde/Mix 1/Mix 2, `variaveis`, `scriptPaleta`), o script inline e o `?paleta=`/`localStorage` (`simplicitude:paleta`; a chave que ficou no navegador de quem usou o preview é órfã e inofensiva), e os testes do script anti-flash. **Ficou:** build lock `SITE_INDEXAVEL`+`NEXT_PUBLIC_MOCKUPS`, `noindex`, 404 de `/admin`/`/login` no preview e `env.NEXT_PUBLIC_MOCKUPS` fixado em `next.config.mjs`. **Fora:** fontes, tamanhos, layout, seções novas. `tests/paletas.test.js` agora lê os tokens do próprio `globals.css` e exige 4,5:1 em texto/fundo, texto/superfície, destaque/fundo, botão, rodapé e texto suave/fundo. **Exceção aceita pelo dono:** texto suave sobre superfície dá 4,22:1 (selo do admin e letra grande do placeholder de `ApresentacaoProduto`); ajuste mínimo se mudar de ideia: suave a 76% (`#596b4f`, 5,20 e 4,70). `.emBreve` do `MeditacaoPlayer` (suave com `opacity: 0.65`) estava em ~2,5:1, já era fraco no azul (2,65:1) — **resolvido no X3** (sem `opacity`) |
| X3 | Tipografia da marca (Fraunces + Assistant) e escala de tamanhos menor | real | 🔒 | ✅ **No código (2026-11-06).** `--font-display` = **Fraunces** (variável, SOFT 0, WONK 0, wght 300–700, opsz 9–72; 62 KB + 75 KB itálico) em títulos e nomes, agora em **caixa normal** (sai o `uppercase` + tracking largo da Cinzel); `--font-body` = **Assistant** 400/600 (17 KB cada) em texto, botões, menu, preços e rótulos; `--font-accent` = **Amsterdam One** 400 (45 KB; o pacote não trouxe licença, anotado em `app/fonts/LEIA-ME.md`) — **no projeto, sem uso por enquanto** (decisão de 2026-11-06: o dono indicará pontualmente onde entra; `preload: false`, e teste impede uso não autorizado). "da floresta" na vitrine, "Em breve" e o mote do rodapé ficaram em Fraunces itálico, o mote em 16px. **Escala `--tam-*`** em `globals.css` (rotulo … destaque), aplicada no site todo, inclusive admin e login (script avulso para o admin; títulos de lista passaram a Fraunces). Títulos caíram ~25–35% (ex.: h1 de página 56–64px → 28–44px; nome do produto 72px → 30–44px; título de seção 48px → 24–34px); corpo 17–18px → 16px; rótulos 13–15px → 12–14px. Fontes geradas com fontTools a partir dos zips (receita no LEIA-ME); zips fora do git (`.gitignore`), licenças OFL no repo. **Corrigido de passagem em `/meditacao`:** nome do produto quebrando no meio da palavra (72px em caixa alta numa coluna de ~410px; agora medido sem quebra em 375, 800 e 1440px) e contraste do "áudio guiado" (`opacity` removida, `--cor-texto-suave` ≈ 4,7:1; também o `.emBreve`, a pendência do X2); `tests/paletas.test.js` impede a volta. `.desc` de `ApresentacaoProduto` deixou de ser justificada (feia em sans na coluna estreita). **Pendência pequena:** o breakpoint do menu (960px) pode baixar agora que a Assistant é mais estreita |
| X4 | Controle do slider da home: sem pausar/continuar e fundo translúcido | real | 🔒 | ✅ **No código (2026-11-06).** `HeroCarrossel`: saiu o botão Pausar/Continuar (e todo o CSS `.pausa`); a pausa por hover, foco de teclado e toque ficou. A pílula de controles deixou de ser a escura do rodapé e usa `color-mix(--cor-fundo 30%, transparent)` + blur (o cartão era 70%; passou a 65% em 2026-11-08); setas e pontos voltaram a `--cor-texto`. `tests/paletas.test.js` agora ancora o regex no bloco `.sobreposto .cartao` (a pílula também tem `color-mix` translúcido). **Riscos aceitos:** (1) o contraste de setas e pontos depende da foto por trás e **não tem teste** (30% de bege sobre trecho escuro de foto cai abaixo de 3:1; conferir nas 4 fotos e, se fraco, subir o 30% no CSS); (2) sem botão, o toque no celular pausa até recarregar, e no desktop a rolagem só para em hover/foco, o que fica aquém do controle de pausa explícito da WCAG 2.2.2 |
| X5 | Home: voltar "Quem somos" e "Meditação" e uma seção nova de placeholder entre elas (texto à esquerda, imagem à direita); seções com menos altura | real | 🔒🧩 (texto e imagem do placeholder) | **No código.** *(A seção nova virou a Sustentabilidade no X18 fatia 3; o que segue sobre o placeholder ficou superado.)* Ordem da home: Hero → Vitrine → Categorias → Meditação → seção nova → Quem somos. Conteúdo recuperado do git, composição redesenhada (cartões divididos espelhados + faixa de foto, `app/home.module.css`). A seção nova só aparece no preview (`NEXT_PUBLIC_MOCKUPS=1`). Pendente com a dona: texto e foto da seção nova; confirmar o título "Meditação" |
| X6 | "Novidades" permanente, com curadoria manual no admin | real | 🔒 | ✅ **No código (2026-11-06); SQL aplicado em 2026-11-06** ([`20261106130000_produtos_novidade_ordem.sql`](../supabase/migrations/20261106130000_produtos_novidade_ordem.sql)). Coluna própria `produtos.novidade_ordem` (smallint nullable, sem default/unique), **não** a `destaque_ordem` do C2 (essa fica para Favoritos/Mais vendidos); segura para a `main` (a ignora). Admin: `/admin/novidades` (escolher, subir/descer, remover, até 8). `getVitrine()` lê só os marcados em ordem; **nada marcado (ou coluna ausente) → 8 mais recentes, ainda "Novidades"**; marcados parciais não são completados. Home com `revalidate = 60`. Fora: arrastar para reordenar, validade da novidade, campo no `ProdutoForm`, gravação atômica (se um update falhar, salvar de novo corrige) |
| X7 | Categorias com imagem (admin + hover com blur que esmaece) | real | 🔒🧩 (fotos) | ✅ **No código (2026-11-06); SQL aplicado em 2026-11-06** ([`20261106140000_categorias_imagem.sql`](../supabase/migrations/20261106140000_categorias_imagem.sql)): `categorias.imagem_url` (nullable) + `imagem_foco_x/y` e `imagem_zoom` (com default), só colunas aditivas, seguras para a `main`. **Decisões:** foto como **faixa 16:9 no topo** do cartão (texto nunca sobre a foto, o teste de contraste não muda); enquadramento com o mesmo `SeletorFoco`/`estiloFoto` dos produtos; arquivo em **bucket próprio `categorias`** (criado na própria migration, com limite de 5 MB, JPEG/PNG/WebP e policy de escrita para `authenticated` em SQL, caminho `{categoria_id}/{uuid}.{ext}`; `caminhoDaUrl(url, bucket)` ganhou o parâmetro de bucket). **Efeito:** `backdrop-filter: blur(8px)` que some no hover e no foco de teclado; **no celular (`hover: none`) a foto fica sempre nítida** (não há "por cima"; o toque já navega). Categoria sem foto = cartão de antes. `getCategoriasComProdutos()` cai na consulta sem foto se a coluna não existir (`42703`), então home e loja não quebram antes do SQL. **Fora:** várias fotos por categoria, texto alternativo (foto decorativa), recorte/compressão no navegador. Faltam as fotos da dona |
| X10 | Tirar os botões de categoria do bloco Novidades da home | real | 🔒 | ✅ **No código (2026-11-06).** Os chips de categoria da `VitrineProdutos` repetiam a `GradeCategorias` logo abaixo: saíram (markup, prop `categorias`, CSS `.chip(s)`); ficou o "Ver toda a loja". `/loja` mantém seus chips de filtro |
| X11 | Análise e organização do Storage | real | 🔒 | **Só registro, nada implementado.** Hoje os buckets (`produtos`, `meditacao`, e o novo `categorias` do X7) foram criados à mão no painel, com policies e limites que só o X1 e o X7 versionam em SQL. Escopo da análise: (1) **buckets por tipo de conteúdo** (fotos de produto, categorias, áudio, institucional) e o que cada um guarda; (2) **policies de `storage.objects` versionadas em SQL** em `supabase/migrations/` (conferir o que existe hoje em `pg_policies`, junto do B-1b); (3) **limites por tipo** (tamanho e MIME por bucket; áudio de meditação é maior que foto); (4) **limpeza de arquivos órfãos** (arquivos sem linha em `produto_imagens`/`produtos.imagem_url`/`categorias.imagem_url`, restos de uploads que falharam e das fotos antigas `principal.{ext}`), com script de listagem antes de qualquer remoção; (5) **o que é público e o que é privado** (hoje tudo público por URL; decidir se algo, ex.: áudio pago ou documentos de pedido, deve ser privado com URL assinada) |
| X8 | **Prioridade, antes do X4:** editar o nome do produto não pode quebrar a URL | real | 🔒 | ✅ **No código (2026-11-06); SQL aplicado em 2026-11-06.** Antes: não havia coluna, o slug era `slugify(nome)` em memória (`getProdutoBySlug`, `CardProduto`), então renomear = 404 no link antigo. Agora: `produtos.slug` (not null, unique, formato `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 80) gerado **uma vez** (backfill = slug atual, URLs não mudam; INSERT sem slug, como o admin da `main`, é preenchido por trigger) e **não muda com o nome**. Tabela `produto_slugs` (PK `slug`) guarda todo slug que um produto já teve: `/loja/[slug]` desconhecido consulta-a e responde **308** (`permanentRedirect`) para o slug atual; a PK + trigger recusam (erro 23505) dar a outro produto um slug antigo. `ProdutoForm`: campo "Endereço na loja" (sugerido do nome só na criação, normalizado ao sair do campo, endereço resultante visível, aviso ao mudar na edição, validação de formato, 23505 → mensagem). **Categorias:** já tinham slug que não acompanha o nome; ganharam `unique`, formato (`not valid`: só gravações novas), validação/aviso no `CategoriaForm`. **Sem redirect de categoria** (link antigo cai em "Todas", nunca 404; não vai em embalagem) — vira X8b se a dona quiser. **Fora:** tela para ver/apagar slugs antigos (apagar o produto libera os slugs dele); a `main` segue calculando do nome até o go-live (o banco é compartilhado, então lá o link continua pelo slug do nome original) |
| X9 | **Página 404 da marca (antes de publicar)** | real | 🔒🧩 (texto) | ✅ **No código (2026-11-06).** Antes: 404 genérica do Next (rota inexistente, `notFound()` de `/loja/[slug]`, `exigirMockups()` em produção). Agora `app/not-found.js` + `not-found.module.css`, dentro do layout raiz (Header/Footer via `SiteChrome`), só com tokens `--cor-*`/`--font-*`/`--tam-*`, uma coluna no molde do `EmBreve` (CSS próprio, porque o `EmBreve` some com os mockups). **Texto provisório, a confirmar com a dona:** rótulo "Página não encontrada", `h1` "Este caminho se perdeu na floresta.", "A página que você procura não existe ou mudou de lugar. O chocolate continua aqui.", botão "Ver a loja" e link "Voltar para o início". `/admin` e `/login` no preview seguem com 404 vazio do `proxy.js` (de propósito); URL inexistente sob `/admin/*` mostra a 404 sem Header/Footer. **Ideia registrada, não implementada:** `app/error.js` (`'use client'`, mesmo CSS) para erro inesperado (Supabase/rede fora do ar hoje mostra a tela genérica do Next): "Algo deu errado por aqui", botão "Tentar de novo" (`reset()`) e link do WhatsApp (`linkWhatsApp()`) para não perder a venda; `global-error.js` não compensa (só quando o próprio layout quebra) |
| X12 | Taxonomia: coleção pertence a categoria, produto ↔ coleção M:N, gestão de coleções e par EN | real | 🔒 | ✅ **Concluído e testado (2026-11-06); SQL [`20261106150000_x12_colecoes.sql`](../supabase/migrations/20261106150000_x12_colecoes.sql) aplicado em 2026-11-06.** Antes: `colecoes` sem tela, 1-N por `produtos.colecao_id`, uma coleção ("Coleção Inspirar", os 4 produtos). Agora: `colecoes.categoria_id` (not null; Inspirar → Chocolates) e `ordem`; "Bombons" entra em Chocolates; `produto_colecoes` (PK produto+coleção) com backfill; **`produtos.colecao_id` fica como cópia da 1ª coleção** (X1) e triggers refletem em `produto_colecoes` o que o admin da `main` gravar (a `main` só lê `colecoes` e grava `colecao_id`, nunca insere coleção). **Decisões:** produto pode estar em coleção de qualquer categoria (o form agrupa por categoria); slug da Inspirar vira `inspirar`, nome inalterado. Admin: `/admin/colecoes` (agrupado por categoria, Subir/Descer, criar/editar), checkboxes no `ProdutoForm`. **I1 do ADR 0002 para categorias e coleções:** `categoria_traducoes`, `colecao_traducoes`, `lib/i18n.js` (`traduzir`, `acaoTraducao`), seção "English (opcional)" (`TraducaoEn`) e coluna/selo EN nas listas. **Fora:** excluir coleção, ordenar categorias ou produtos dentro da coleção, uso público (filtro/página de coleção), rotas `/en`, tradução de produto e de tag, `ordem` em `produto_colecoes` (o ADR a previa; acrescentar depois é aditivo). **Limite aceito:** a `main` só conhece uma coleção: trocar lá tira só o par antigo e adiciona o novo, e tirar a coleção lá não zera a cópia se restarem outras — até o go-live, editar coleções só pelo admin da `v1`. Conferir `pg_policies`/RLS de `colecoes` no B-1b (a migration só acrescenta a policy de escrita) |
| X13 | Campos do produto: descrição curta, descrição longa, ingredientes, tags e tradução EN | real | 🔒 | ✅ **Concluído e testado (2026-11-07); SQL [`20261107120000_x13_campos_produto.sql`](../supabase/migrations/20261107120000_x13_campos_produto.sql) aplicado em 2026-11-07.** Antes: só `descricao` (as quebras de linha sumiam na tela) e `atributos` (texto livre, "Intenso \| 62% cacau"); sem curta, ingredientes nem tags. Agora: `produtos.descricao_curta` (≤120) e `ingredientes`; `tags` + `produto_tags` (M:N); `produto_traducoes` e `tag_traducoes` (I1 do ADR 0002 para produto e tag; **sem `atributos` nem `audio_url`**, esse é o I3). **Decisões:** `atributos` **não é migrado**: a coluna fica para a `main`, a `v1` não a exibe nem a grava e a curta começa vazia; **Comprar vem antes** da descrição longa e dos ingredientes (em `/meditacao` o player sobe pelo mesmo motivo). Admin: "Atributos" → "Descrição curta", "Descrição longa", "Ingredientes", checkboxes de tags e `TraducaoEn` (agora com `campos`); CRUD em `/admin/tags` (com Excluir). Página: curta em itálico, chips de tag, `white-space: pre-line` na longa, ingredientes em `dl`; card e meta description usam `descricao_curta \|\| descricao`. **Fora:** rotas `/en` (I2), uso público de tag (link, filtro, tags no card e em `/meditacao`), áudio EN (I3), apagar `atributos` (depois do go-live), texto rico, ordem manual das tags. **Ajustes pós-teste (2026-11-07):** `/meditacao` mostra só a descrição curta (prop `resumido` de `ApresentacaoProduto`: sem descrição longa nem ingredientes); no `ProdutoForm` a seção "English (opcional)" subiu para logo depois do campo Ingredientes (antes ficava abaixo das fotos e parecia escondida) |
| X14 | Nova `/loja`: topo só de texto, filtro por categoria/coleção e carrosséis de uma linha | real | 🔒 | ✅ **No código (2026-11-07), sem SQL; falta o dono conferir no navegador.** Antes: `/loja` era título + chips de categoria + grade única. Agora: **topo só de texto** (rótulo, `h1` e frase direto sobre o fundo, sem foto nem cartão; ajuste de 2026-11-07, antes era um cartão dividido com foto; ≥900px a frase vai à direita; a foto de categoria deixou de ser usada na `/loja`), **filtro** em duas fileiras (categorias; e, com categoria ativa, "Tudo em …" + as coleções dela) e, em "Todas" e na categoria, **carrosséis de uma linha** por coleção, com "Mais {categoria}" só se sobrar produto e separadores entre as seções. `?categoria=slug` segue valendo; `?colecao=slug` é novo (coleção válida vence categoria; slug inválido, vazio, repetido ou de coleção sem produto = "Todas"). **Decisões da dona/dono:** categorias em ordem alfabética (sem `categorias.ordem`); resultado com uma lista só vira grade; cada produto aparece só na própria categoria nas seções (o Chocobook, de Presentes, está na Inspirar de propósito) e `?colecao=` mostra todos os da coleção; catálogo atual, ainda ralo, segue assim. **Código:** `montarLoja` e `getColecoesPublicas` em `lib/produtos.js` (`montarLoja` substituiu `filtrarPorCategoria`), `CarrosselProdutos` extraído da `VitrineProdutos` (a home não muda), `tests/loja.test.js`. **Fora:** `/en`, tag, busca (X16), landing de Presentes (X15), página própria de coleção, `categorias.ordem`, foto própria de coleção, `generateMetadata` por filtro (A11). Produto sem categoria cai numa seção "Outros" em "Todas" (não discutido; hoje o catálogo real não tem)
| X15 | Destaque ou landing de Presentes/Natal | real | 🔒🧩 (conteúdo) | **Só registro, nada implementado.** Persona "presente" (2ª prioridade) e a data sazonal. Opções a decidir com a dona: (a) destaque na home (slide do hero/faixa) levando a `/loja` filtrada, ou (b) landing própria (`/presentes`) com seleção de produtos/kits. **Parcial (2026-11-08):** o slide 1 do hero já leva a `/loja?categoria=presentes`; a landing segue só registrada. Depende de uma coleção ou tag "Presentes" (X12/X13 já permitem, sem uso público), de texto e de fotos |
| X16 | Busca no site todo, no cabeçalho | real | 🧩 (escopo com a dona) | **Só registro, nada implementado.** Campo de busca no `Header` que cobre produtos (nome, descrição curta, tags) e, se valer a pena, páginas institucionais. A decidir: busca no servidor via Supabase (`ilike` ou full-text) ou filtro no navegador (catálogo pequeno), página de resultados (`/busca?q=`), comportamento no celular (menu), acentos (`unaccent`, já existe no banco do X8) e o ADR 0002 (busca por idioma, pós-I2) |
| X17 | Política de troca e devolução | real | 🔒🧩 (texto da dona) | **Entregue dentro do A11 (2026-11-08): `/trocas` está no código com o texto da dona; faltam as marcas `[CONFIRMAR]` (5 em `trocas.md`, 3 delas para o advogado: art. 26 e art. 49 do CDC).** O texto cobre: prazo de arrependimento (CDC, 7 dias na compra à distância), produto perecível e calor, quem paga o frete de devolução, avaria no transporte, fluxo pelo WhatsApp enquanto não há checkout |
| X18 | Feedback da dona, rodada 2, em 3 fatias | real | 🔒🧩 (textos e fotos das fatias 2 e 3) | **Fatia 1 ✅ no código (2026-11-07), sem SQL:** (a) menu: "Bem-estar" → **Meditação** e "Bem-fazer" → **Sustentabilidade**, no rótulo e na rota (`/bem-fazer` → `/sustentabilidade`, `app/sustentabilidade/`; só existe no preview, **sem redirect**); ordem final Loja, Meditação, Sustentabilidade, Quem somos, Assinaturas (`lib/navegacao.js`). O slide "Bem-estar" do hero da home **não mudou** (o pedido foi só o menu). (b) `GradeCategorias`: **sem desfoque** (some o `.foto::after` com `backdrop-filter`; foto sempre nítida, o resto do cartão igual; o X7 passa a valer sem o efeito de hover). (c) `/loja/[slug]`: o link "Meditação guiada disponível" virou **"Acesse aqui a meditação guiada"**. **Fatia 2 ✅ no código (2026-11-07), sem SQL:** seção Meditação da home **sem cartão, sem moldura e sem cantos arredondados** (`app/page.js`, `app/home.module.css`, classe `.meditacao`): foto atual (`/meditacao/hero.png`) direto sobre o fundo, colada às bordas da tela, à esquerda e na altura do bloco no desktop (em cima no celular), texto à direita centrado na vertical. Título "Chocolates para Meditação", parágrafo novo da dona e pílula **"Conheça a Coleção Inspirar →"** para `/loja?colecao=inspirar`. Saiu o CSS do zigue-zague (`.fotoDireita`). A seção nova (placeholder) e Quem somos **não mudaram** (seguem em cartão). Falta o dono conferir no navegador. **Fatia 3 ✅ no código (2026-11-07), sem SQL — X18 concluído:** a seção **Sustentabilidade** substitui o placeholder da home e **aparece também em produção** (`app/page.js`, array `CUIDADOS`; `app/home.module.css`): título "*Um mundo melhor* com simples atitudes" (Fraunces, só "Um mundo melhor" em itálico) e três blocos (Cuidar de Si, do Outro, do Todo) lado a lado no desktop (≥900px) e empilhados no celular, **sem caixa, sem borda e sem cantos arredondados**, foto 16:9 em cima e título + texto da dona (literais) embaixo. **Cada bloco inteiro é um link para `/sustentabilidade`** (sem botão; `Link` no `h3` com `::after` cobrindo o bloco, foco visível). Fotos em `public/home/home-cuidar-{de-si,do-outro,do-todo}.webp` (WebP q85, mesmas dimensões, PSNR 37,9–38,7 dB; a "de-si" tem só 960px de largura; originais em `_DOCS/Seção sustentabilidade/`, fora do git). Saiu o placeholder e o uso de `FotoPendente`/`mockupsLigados` na home. **A página `/sustentabilidade` deixou de ser mockup:** existe em produção e o item do menu é `real` (`lib/navegacao.js`); mostra só o `h1` "Sustentabilidade" e um aviso provisório de que o conteúdo chega em breve, com CSS próprio (`app/sustentabilidade/page.module.css`, molde do 404). **Pendente (no D2):** confirmar o conteúdo da página ou remover o item do menu e os links antes de publicar. Falta o dono conferir no navegador. **Ajuste pós-X18 (2026-11-07), sem SQL:** Quem somos também saiu do cartão: usa a mesma `.secaoFoto` da Meditação com a variante `.espelhada` (foto `cabruca.jpg` à direita, colada à borda, na altura do bloco; celular: foto em cima); `.meditacao` foi renomeada `.secaoFoto` e saíram `.cartao`/`.fotoMenor`. Foto, frase e botão inalterados. Fecha a pendência "home sem caixa" em todas as seções. **Ajuste pós-X18 (2026-11-08), sem SQL:** (00) **cartão do hero mais transparente: 70% → 65%** (pedido: igualar à pílula, 30%; medido nas 4 fotos, o texto cai a 1,5:1 na Floresta, 1,9 na Meditação e 2,7 em Presentear a 30%; 65% é o menor percentual que mantém 4,5:1 no 5º percentil mais escuro da área do cartão, e 60% reprova na Floresta, 3,96). `tests/paletas.test.js` deixou de usar foto preta pura (a 65% dá 4,3) e mede as fotos de `public/home/hero-*.webp` com `sharp`; a pílula segue a 30%. (0) **novos slides do hero** (`app/page.js`, array `SLIDES`; componente, CSS e comportamento intactos), pedido da dona, textos literais, nesta ordem: 1 "Chocolate para Presentear" ("Escolha um presente →", `/loja?categoria=presentes`, foto nova `hero-presentear.webp`, `posicao '0% 50%'`), 2 "Chocolate da Floresta" ("Impacto Positivo →", `/sustentabilidade`, foto final `hero-floresta.webp`, q90, 35 dB), 3 "Chocolate para Meditar" ("Conheça a Coleção →", `/meditacao`, foto nova `hero-meditacao.webp`), 4 "Chocolate pra todo mundo!" ("Ver a Loja →", `/loja`, foto final `hero-veganos.webp`, `posicao '75% 50%'`, com texto na imagem à direita; versão de 2026-11-08). Fotos novas em WebP q85 (PSNR 38,8 a 41,6 dB; a de Presentear foi trocada por uma versão nova em 2026-11-08, com a logo da Simplicitude no lugar de "SUA LOGO AQUI"; a da floresta em q90, 35 dB, o máximo que a folhagem permite), tamanho original e sem ampliar (1928×851 e 1536×864, abaixo do mínimo de 1920×1080); `hero_slide_1..4.webp` removidas. **Só a foto do slide 1 é provisória** (a dona envia a final depois; tem texto na coluna direita, escondido pelo `posicao` no desktop). A do slide 4 também tem texto (à direita, longe do cartão do slide). O título do slide 1 virou o `h1` da home. (a) **frase do manifesto** entre o hero e a vitrine Novidades (`app/page.js`, `.manifesto` em `app/home.module.css`): "Chocolates plant-based, feitos com ingredientes da floresta, que nutrem corpo e alma (quebra de linha, sem travessão) e regeneram a Mata Atlântica.", Fraunces itálico, negrito em "plant-based", "nutrem" e "regeneram a Mata Atlântica", centralizada, 62ch (2 linhas no desktop), sem caixa; texto dos slides intacto. (b) **Controles do slider no celular** (`HeroCarrossel.module.css`): a pílula translúcida do desktop passa a valer em todas as larguras e, até 640px, fica dentro da foto, centrada na base, sem linha própria (some o vazio de ~68px abaixo do cartão). A direção pedida (setas e pontos na linha do botão) **não coube** em 320–430px (6 alvos de 44px = ~284px; botões de 147 a 268px; espaço útil de 280 a 390px), então o dono escolheu "sobre a foto". Posição por `top: 0` + `margin-top: calc(75% - 60px)` (foto 4:3). Desktop inalterado. **Risco do X4 vale agora também no celular:** o contraste de setas e pontos depende da foto por trás e não tem teste |

| X19 | Link na página `/meditacao` levando o visitante aos produtos da coleção Inspirar (tudo da coleção Inspirar tem a ver com meditação) | real | 🔒 | ✅ **No código (2026-11-08), sem SQL; falta o dono conferir no navegador.** **Revisado no mesmo dia (2026-11-08):** a pílula "Ver a Coleção Inspirar na loja →" do topo de `/meditacao` (para `/loja?colecao=inspirar`) **saiu** e, no lugar, **cada produto da lista de meditações tem um link "Ver na loja" para `/loja/[slug]`**, depois do player. **Por quê:** o visitante que ouve uma meditação quer o produto daquela meditação, e `/loja/[slug]` tem o Comprar, o preço e os ingredientes que `/meditacao` (resumida) não mostra; a página do produto já devolve para `/meditacao` ("Acesse aqui a meditação guiada"), então os dois lados ficam ligados. `getProdutos()` só traz produto ativo e `slug` é fixo (X8), então o link nunca quebra, e a regra de "link some se a coleção não vale" deixou de existir nesta página. `COLECAO_MEDITACAO` (`lib/produtos.js`) segue só no botão da home; se a dona renomear o slug da coleção no admin, trocar a constante. O topo da página foi refeito junto (faixa de 3 fotos + duas colunas com título/botão "Acesse as meditações guiadas" e o texto da dona; ver `CLAUDE.md`, Rotas) |

| X20 | No cadastro do produto, ao marcar "possui meditação", abrir um campo de título da meditação, que é o que aparece na página /meditacao no lugar do nome do produto (evita aparecer "Chocolate 30g" na meditação) | real | 🔒🧩 (títulos da dona) | ✅ **No código (2026-11-08); SQL [`20261108120000_x20_titulo_meditacao.sql`](../supabase/migrations/20261108120000_x20_titulo_meditacao.sql) a aplicar no SQL Editor antes do push** (sem ele o salvar do admin da `v1` falha; a leitura não quebra). Colunas `produtos.titulo_meditacao` e `produto_traducoes.titulo_meditacao` (nullable, aditivas, seguras para a `main`). **Decisões:** campo só aparece com "Possui meditação guiada" marcado (desmarcar grava `null` nos dois idiomas, como o `audio_url`); **vazio cai no nome do produto** e **não é obrigatório** (senão toda edição de um produto de meditação ficaria travada); par EN na seção `TraducaoEn` ("Meditation title"). Só o `h2` de `/meditacao` muda (prop `titulo` de `ApresentacaoProduto`; `alt` da foto e placeholder seguem com o nome). **Compartilhamento não muda:** a `metadata` de `/meditacao` é fixa e `/loja/[slug]` segue com o nome. Sem teste novo (um `\|\|` no JSX; EN usa funções já testadas). Falta o dono conferir no navegador e a dona preencher os títulos |

**SQL do X8:** migration [`supabase/migrations/20261106120000_produtos_slug.sql`](../supabase/migrations/20261106120000_produtos_slug.sql) (extensão `unaccent`, `public.slugify`, colunas/tabela, RLS, triggers; conferir colisão de nomes antes, o `select` está no cabeçalho).

**SQL do X1** (aplicado em produção em 2026-11-05): migration [`supabase/migrations/20261105181330_produto_imagens.sql`](../supabase/migrations/20261105181330_produto_imagens.sql) (tabela, RLS, limite do bucket) e script de reconciliação [`supabase/scripts/x1_reconciliar_produto_imagens.sql`](../supabase/scripts/x1_reconciliar_produto_imagens.sql) (**rodar de novo no D2**, porque até o go-live a dona edita fotos pelo admin da `main`, que só grava em `produtos`).

**Fora do X1:** galeria em `/loja/[slug]` e Comprar → WhatsApp (feitos no A7); arrastar para reordenar; recorte
ou compressão no navegador; HEIC; apagar a cópia em `produtos.imagem_*`; limite de 8 no banco.

### Bloco B — Fundação do backend (pode correr em paralelo à aprovação)

| # | Item | Marca | Notas |
|---|---|---|---|
| B-1a | Pasta de migrations: `supabase/migrations/` (A6b, A6c, X1) e `supabase/scripts/` (SQL de dados que se repete) + regra no README | — | ✅ **Pronto (2026-11-05).** A6b/A6c reconstruídos (tipo/not null/default conferidos no banco); o resto do schema não tem SQL no repo e fica para o B-1b |
| B-1b | Baseline do schema (`supabase db pull` → `supabase/migrations/0000_baseline.sql`, precisa de Docker); conferir `pg_policies`: **anon negado em `pedidos`/`pagamentos`/`clientes`/`enderecos`**, além do storage | 🔒🧩 (token Supabase) | wizard |
| B-2 | Staging: 2º projeto Supabase + baseline + cópia de `produtos`/`categorias`/`colecoes` (dados públicos) | 🔒🧩 | o preview passa a apontar para cá quando o checkout real começar (B4) |
| B-3 | Vigia do `disable_signup` no GitHub Actions, fora do build (B7) | 🧩 (Actions) | não bloqueia deploy |

### Bloco C — Checkout

| # | Item | Marca | Notas |
|---|---|---|---|
| C1 | Pesquisa InfinitePay (URL oficial, payload do webhook, sandbox?) → `docs/research/infinitepay.md` | 🔒🧩 (conta + `handle`) | research. As fontes públicas divergem na URL da API |
| C2 | Migration de venda: (`produtos.slug` já feito no X8) `descricao_curta` (**e `ingredientes`**, com o par em `produto_traducoes`; ✅ feitos no X13)/`destaque_ordem` (+ campos no `ProdutoForm`); ~~**`categorias.imagem_url`** (+ upload no `CategoriaForm`; a foto do cartão do A5 depende dela)~~ ✅ feito no X7; `pedidos` de convidado (`cliente_id` nullable, `comprador_*`, `token_acesso`); `metodo_entrega` ganha `regional`; `unique(pagamentos.referencia_externa_id)`; `frete_zonas` com seed; RPC `confirmar_pagamento()`; `CHECK`s | 🔒🧩 (regras de frete) | tdd: integração da RPC no staging |
| C3 | `POST /api/frete`, `/api/checkout`, `/api/webhooks/infinitepay`, `/api/tarefas/reconciliar` + `lib/checkout/*`, todos usando o contrato do A0 | 🔒 | codebase-design, tdd, security-review |
| C4 | `lib/email.js` (Resend via `fetch`): comprador + separação; `/admin/pedidos` só leitura | 🔒🧩 (Resend, e-mail de quem separa) | e-mail real com DMARC=pass |
| C5 | Trocar os mockups A9/A10 pela API real (mesmo contrato) | 🔒 | |
| C6 | 1 e2e `@playwright/test` mobile do fluxo de compra contra o staging | 🔒 | |

### Bloco D — Go-live

| # | Item | Marca | Notas |
|---|---|---|---|
| D1 | Preparar o domínio: adicionar no Netlify sem apontar; Resend em `send.simplicitude.com.br` | 🔒🧩 (acesso DNS GoDaddy) | não toca o SPF raiz |
| D2 | Virada: env de produção, migrations em produção, **inventário físico + `ajuste`**, **rodar de novo `supabase/scripts/x1_reconciliar_produto_imagens.sql` (reconcilia `produto_imagens` com as fotos editadas pela `main`)**, ~~remover produtos de teste~~ **feito (2026-11-08: removidos do banco e `public/teste/` apagada)**, merge `v1`→`main` (flag desligada; o build falha se algum mockup ficar ligado), **conferir o título da vitrine da home (regra de nomes: nada de "Mais vendidos" sem ordem real da dona)**, **conferir CNPJ/razão social reais no rodapé (a linha "a confirmar" só aparece no preview)**, **confirmar o conteúdo da página Sustentabilidade ou remover o item do menu e os links antes de publicar**, **conferir que todos os slides do hero têm foto real (hoje têm; se alguma for removida, o slide some em produção e, sem nenhuma, o hero some e a home perde o `h1`)**, **substituir os textos legais provisórios: zerar as 9 marcas `[CONFIRMAR]` de `content/legal/*.md` (conferir com `npx vitest run tests/legal.test.js --silent=false`), com revisão da contadora/advogado, e atualizar `DATA_ATUALIZACAO_LEGAL` em `lib/legal.js`; confirmar que a Privacidade só cita GA, Meta Pixel, aviso de cookies e cookie de idioma se já existirem**, **definir `SITE_URL=https://simplicitude.com.br` no Netlify (og:image absoluta)**, `SITE_INDEXAVEL=1`, DNS (B5), SSL, pagamento real baixo + estorno, smoke | 🔒🧩 | security-review |
| D3 | Investigar o consumo de créditos do Netlify antes do go-live. O site ainda não está publicado e já gasta créditos com requisições e tráfego. Conferir no painel de uso do Netlify o que mais consome (deploys, banda, requisições de função, otimização de imagens do `next/image`, páginas dinâmicas e com `revalidate`) e avaliar se uma CDN na frente ou ajustes de cache reduzem o consumo | 🧩 (acesso ao painel do Netlify) | Decisão atual: seguir no plano grátis até o go-live |

### Pós-go-live (ordem sugerida)
1. `admins` + `is_admin()` + policies + storage só admin. Obrigatório antes de contas de cliente e
   do 3º usuário no Auth.
2. Transições de `/admin/pedidos` + e-mail de "enviado" + cancelamento (movimentação `cancelamento`).
3. `/admin/frete`.
4. Redesign de `/meditacao`.
5. ~~Galeria do produto~~ ✅ feita no A7 (várias fotos: X1; galeria: A7). Falta, 🧩: as fotos da dona. A grade de categorias (A5) e a coluna `categorias.imagem_url` (X7) já existem; ~~as fotos esperam a coluna do C2~~ falta só a dona enviar as fotos).
6. ESLint + CI no GitHub Actions.
7. **Migração do DNS e do e-mail para fora da GoDaddy** (B5), como mudança separada.
8. Melhor Envio, WhatsApp, contas de cliente, institucional, NF-e, B2B.
9. **Multilíngue** ([ADR 0002](adr/0002-multilingue.md)), em fatias: **I1** tabelas `*_traducoes` +
   `traduzir()` (`lib/i18n.js`) + seção "English (opcional)" nos formulários do admin (inofensivo sem rotas;
   **categorias e coleções no X12, produto e tag no X13**) →
   **I2** `app/[lang]/` + `proxy.js` + seletor + dicionários + hreflang/sitemap → **I3** áudio EN → **I4**
   conteúdo EN (dona). Skills: `tdd` (I1, I2), `design-taste-frontend` (seletor).

### Skills por fase
`design-taste-frontend` (A2–A7, A9–A11) · `tdd` (A0, A8, C2, C3) · `research` (C1) ·
`codebase-design` (C3) · `security-review` (C3, D2) · `wizard` (B-1b, B-2, D1, D2) ·
`grilling` (regras de frete e checkout com a dona) · `code-review`/`ponytail-review` ao fim de
cada bloco.

---

## 4. Contrato de dados (definido no A0, antes de qualquer mockup)

Nomes iguais às colunas do banco (snake_case), sem camada de mapeamento. Dinheiro em centavos.

```js
// Carrinho — localStorage 'simplicitude:carrinho:v1' (sem preço: preço nunca vem do cliente)
{ versao: 1, itens: [{ produto_id: 'uuid', quantidade: 1 /* 1..20 */ }] }

// POST /api/frete → cotação
req: { cep: '45638000', itens: [{ produto_id, quantidade }] }
res: { opcoes: [{ metodo_entrega: 'retirada'|'regional'|'transportadora', nome, valor_centavos, prazo_dias }] }

// POST /api/checkout
req: { itens: [...], comprador: { nome, email, telefone, cpf },
       metodo_entrega, entrega: { cep, rua, numero, complemento, bairro, cidade, estado } | null }
res: { token_acesso, link_pagamento_url }

// GET /pedido/[token] — visão pública (sem CPF/e-mail/telefone)
{ status, metodo_entrega, codigo_rastreio,
  itens: [{ nome_produto, quantidade, preco_unitario_centavos, subtotal_centavos }],
  valor_produtos_centavos, valor_frete_centavos, valor_total_centavos,
  entrega: { cidade, estado } | null }
```

O mock e a API real importam as mesmas funções `validar*()` e as mesmas fixtures; se o contrato
mudar, os testes do A0 quebram dos dois lados.

---

## B3. Mockups fora do domínio real

**Branch + flag, as duas.**
- **Branch `v1`:** o redesign mora nela até a aprovação da dona e o go-live; o `main` (site atual)
  não muda antes. O branch deploy do Netlify dá uma URL fixa (`v1--<site>.netlify.app`).
- **Flag `NEXT_PUBLIC_MOCKUPS=1`:** definida só nos contextos *branch-deploy* e *deploy-preview*.
  Cada ponto de mockup checa a flag: ligada renderiza o mock; desligada o item some
  (cortar-se-atrasar) ou o build falha.
- **Trava no build:** `next.config.mjs` aborta quando `SITE_INDEXAVEL=1` e
  `NEXT_PUBLIC_MOCKUPS=1` estão juntos. É impossível publicar mockup no domínio real.
- **Mocks** ficam em `lib/mock/` (fixtures do contrato) e nunca gravam nada.
- *Só flag no `main`* publicaria o visual novo, ainda não aprovado, no site atual. *Só branch*
  levaria botão morto para produção no merge.

## B4. Preview para a dona

- **URL:** branch deploy da `v1` (fixa, atualiza a cada push). PRs para a `v1` geram Deploy
  Previews extras para comparar variações.
- **`noindex`:** `next.config.mjs` envia `X-Robots-Tag: noindex, nofollow` em todas as rotas,
  **exceto** com `SITE_INDEXAVEL=1`, definida só em produção no go-live (D2). O padrão seguro é
  não indexar. É env própria, não o `CONTEXT` do Netlify (portabilidade).
- **Sem escrita em dados reais:** leituras públicas usam o client anônimo (a RLS impede escrita);
  mockups não gravam; `proxy.js` devolve 404 para `/admin` e `/login` quando
  `NEXT_PUBLIC_MOCKUPS=1`. Quando o checkout real começar (C3), as envs de preview apontam para o
  staging (B-2).
- **Acesso:** a proteção por senha do Netlify é recurso pago. URL não listada + `noindex` bastam
  para conteúdo que vai ser público.

## B5. DNS e e-mail — GoDaddy temporária

Fatos verificados em 2026-11-04: nameservers `ns41/42.domaincontrol.com` (GoDaddy); MX
`secureserver.net`; SPF `v=spf1 include:secureserver.net -all`; DMARC `p=reject` com alinhamento
relaxado; `@` e `www` em `103.169.142.0`.

**No go-live (D2):** a zona fica onde está e muda **só 2 registros**:
- `A @` → IP do load balancer do Netlify, exibido no painel (documentado como `75.2.60.5`, a
  confirmar na hora);
- `www` → `CNAME <site>.netlify.app`.

**Não tocar** em MX, SPF, `TXT D6500682`, `_dmarc`. Antes, salvar print da zona; depois, comparar
`Resolve-DnsName` de MX/TXT/_dmarc e testar e-mail de/para `viva@` nos dois sentidos. Rollback:
voltar os 2 registros para `103.169.142.0`. O e-mail transacional fica em `send.simplicitude.com.br`
(Resend cria `MX`/`TXT`/DKIM próprios lá; o SPF raiz não muda; o alinhamento relaxado do DMARC
aceita).

**Depois do go-live, mudança separada** (sair da GoDaddy; o contato técnico no registro.br passa a
ser você): (1) escolher o novo provedor de e-mail e migrar as caixas; (2) recriar **todos** os
registros (Netlify, Resend `send.`, MX/SPF/DKIM/DMARC do novo e-mail) no DNS de destino; (3) só
então trocar os nameservers no registro.br. Tem ADR, checklist e rollback próprios. Nada no
go-live depende disso.

## B6. Vitrine da home — "Mais vendidos" / "Novidades" / "Favoritos" (referência da dona)

O layout abaixo é o da dona para "Mais vendidos"; o **título** segue a regra de nomes do bloco A
(hoje, com ordem por `created_at`, é "Novidades").


- **Layout:** coluna esquerda com título em serifa com ênfase em itálico, ~~chips de categoria
  (`categorias.slug` → `/loja?categoria=…`)~~ *(chips removidos no X10)* e botão "Ver toda a loja"; à direita, carrossel
  horizontal de cards (imagem sobre fundo claro, categoria, nome, descrição curta, preço). Sem
  favoritos na v1.
- **Reaproveita** `VitrineProdutos` (scroll-snap + setas).
- **Descrição curta: o campo não existe** em `produtos` (colunas: `ativo, atributos, audio_url,
  categoria_id, colecao_id, created_at, descricao, estoque, id, imagem_url,
  mostrar_categoria_no_titulo, nome, peso_gramas, preco_centavos, tem_meditacao`). A coluna
  `descricao_curta` (≤120 caracteres) entra no C2. Até lá, e quando vazia, o card mostra
  `descricao` em 2 linhas com `line-clamp`. `atributos` não serve: são tags ("62% cacau | Laranja").
- A categoria aparece sempre no card, sem depender de `mostrar_categoria_no_titulo`.
- Ordem: `created_at` desc até o C2 criar `destaque_ordem`; depois, `destaque_ordem` (nulos por
  último, desempate por `created_at`).

## B7. Vigia do `disable_signup` sem quebrar o build

`scripts/vigia-signup.mjs` (fetch de `/auth/v1/settings`), executado **só** por workflow do GitHub
Actions (`schedule` diário, `workflow_dispatch` e o mesmo cron da reconciliação). **Não** entra no
`npm test` nem no build do Netlify.
- `exit 1` (o GitHub avisa por e-mail) **só** se a resposta for 200 e `disable_signup === false`;
- erro de rede ou Supabase fora do ar vira `::warning::` com `exit 0`; o próximo dia tenta de novo.

---

## 5. Pendências (o que preciso de vocês)

| Item | Quem | Marca |
|---|---|---|
| **Aprovação do design** sobre o preview | dona | 🔒🧩 |
| CNPJ, razão social e endereço oficial | dona | 🔒🧩 |
| Conta InfinitePay com Checkout + InfiniteTag (`handle`) | dona | 🔒🧩 |
| Regras de frete: rota regional (cidades, valor, prazo), valor Bahia, valor Brasil, frete grátis?, retirada (endereço, horário), peso embalado, política de calor | dona | 🔒🧩 |
| Aprovar privacidade, entrega e trocas (textos já no site, com 9 `[CONFIRMAR]` abertas) | dona | 🔒🧩 |
| E-mail que recebe pedidos + quem separa | dona | 🔒🧩 |
| Inventário físico no dia da virada + regra de lançar vendas de feira/B2B | dona | 🔒🧩 |
| Acesso ao DNS na GoDaddy + o que roda hoje em `103.169.142.0` | você/dona | 🔒🧩 |
| Token Supabase (CLI) + ok para o projeto de staging | você | 🔒🧩 |
| ~~Acesso às envs e aos contextos de deploy do Netlify~~ — feito (A1) | você | — |
| Conta Resend | você | 🔒🧩 |
| GitHub Actions habilitado (cron + vigia) | você | 🧩 (a reconciliação é 🔒) |
| Nota fiscal nas vendas online | dona | 🧩 (pode bloquear por motivo fiscal) |
| Ordem real dos mais vendidos (a partir de vendas de feira/WhatsApp) + descrição curta | dona | 🧩 (fallback: a seção vai ao ar como "Novidades"; sem esse dado o nome "Mais vendidos" não é usado) |
| Fotos do hero | dona | 🧩 (só o slide 1 é provisório; a final virá da dona, 16:9, mín. 1920×1080, sem texto na imagem) |
| Fotos de categoria (~~precisam de `categorias.imagem_url`, C2~~ coluna e upload prontos no X7) / galeria do produto | dona | 🧩 (categoria sem foto vai ao ar com o cartão de sempre) |
| Tipografia oficial | dona | 🧩 (provisória fica) |
| Textos em inglês (produtos, categorias, coleções, tags) e áudios de meditação em inglês | dona | 🧩 pós-go-live (I4/I3; sem eles a página EN fica `noindex` e o player toca o PT) |
| Novo provedor de e-mail (saída da GoDaddy) | você/dona | 🧩 pós-go-live |
| ~~Seções da home sem caixa demarcada e sem bordas na foto~~ — feito em todas: Meditação e Sustentabilidade (X18 fatias 2 e 3) e Quem somos (2026-11-07) | você (a pedido da dona) | — |
| Build local falha com EPERM na pasta `.next` por causa do OneDrive: resolver movendo o projeto para fora do OneDrive | você | 🧩 |

**Decisões a confirmar:** o redesign de `/meditacao` (cortar-se-atrasar; o A5 já foi reativado);
checkout de convidado; o conteúdo de Sustentabilidade (ex-Bem-fazer, X18; hoje só aviso "em breve", já em produção) e Assinaturas (hoje só "Em breve", mockup). Superado no X18: o rótulo "Bem-estar" virou "Meditação". Superada: "`/quem-somos` fora do menu" — agora está no menu.
