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
- `getProdutosRecentes()`: substituído pelo critério de "mais vendidos".
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
6. **Slug calculado do nome**: renomear um produto quebra links já postados no Instagram.
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
Sem glossário: o CLAUDE.md já define os termos que confundem. Só o ADR 0001 (regra transversal que
alguém quebraria sem saber o porquê). As demais decisões viram uma linha no CLAUDE.md. Critério
para um ADR futuro: decisão cara de reverter e cujo motivo não aparece no código.

### 2.8 Visual antes da segurança do banco
Seguro, porque o cadastro está desligado, as fatias visuais não escrevem dados, e o checkout
escreve pelo servidor com service role sem criar policy para anon. Riscos que sobram:
1. Alguém religar o cadastro no painel → vigia diário (B7).
2. Policies de anon mal configuradas nas tabelas de pedido/cliente (hoje invisível, tabelas
   vazias) → conferência de `pg_policies` em B-1 🔒.
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
**A1 → A2 → A3/A4 → A6/A7 → ✋ mostrar o preview à dona.** Só depois disso vêm o **A0** (contrato
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
| A3 | Home: hero em carrossel (auto, setas/pontos, pausa, `prefers-reduced-motion`) com slides de Loja e Meditação | real | 🔒 | fotos atuais; fotos novas 🧩 não bloqueiam. Unitário do índice do carrossel |
| A4 | Home: vitrine de produtos no layout da dona (B6) com produtos reais | real | 🔒 | **o título depende do critério de ordem (regra de nomes abaixo): com `created_at` a seção se chama "Novidades", nunca "Mais vendidos".** Descrição com fallback `line-clamp` |
| A5 | Home: grade de categorias com fotos | cortar-se-atrasar | — | os chips do A4 cobrem a navegação por categoria |
| A6 | `/loja` com filtro por chip (`?categoria=slug`) | real | 🔒 | |
| A7 | Produto: ficha, preço, estoque, selo de meditação. **Quantidade e "Adicionar ao carrinho" só entram com o A8** | real | 🔒 | rota segue com `slugify` até a coluna `slug` (C2); o backfill gera os mesmos slugs |
| A8 | Carrinho (`localStorage`, formato do A0, preços lidos do banco) + quantidade/"Adicionar ao carrinho" no A7 | real | 🔒 | depende do A0. Só cliente. tdd |
| A9 | Checkout (contato, CEP, retirada/regional/transportadora, opções de frete, resumo) | mockup → real em C5 | 🔒 | o submit vai para o mock e abre o pedido falso |
| A10 | Tela "indo para o pagamento" + `/pedido/[token]` | mockup → real em C5 | 🔒 | fixture do A0 |
| A11 | Páginas legais (`/privacidade`, `/entrega`, `/trocas`) + Open Graph | real | 🔒🧩 (aprovação dos textos) | eu redijo, a dona aprova |
| A12 | `/meditacao`: herda os tokens + link "Comprar" por produto | real | — | o redesign é cortar-se-atrasar (pós-go-live) |
| ✋ | **Aprovação do design pela dona** sobre o preview do A1, **mostrado após A1 → A2 → A3/A4 → A6/A7** | — | 🔒🧩 | impedimento atual; não bloqueia os blocos B–D. O preview mostra a seção como "Novidades" e deve-se avisar a dona do porquê (regra de nomes) |

**Regra de nomes da vitrine da home (ajuste de 2026-11-04):** "Mais vendidos" é uma afirmação ao
consumidor, então o título sai do critério de ordem realmente usado, e nunca é escolhido à mão:

| Critério de ordem | Título permitido |
|---|---|
| `created_at` (mais recentes primeiro; é o que existe hoje) | **Novidades** |
| `destaque_ordem` curado, sem dado de venda por trás | **Favoritos** |
| `destaque_ordem` definido pela dona a partir de vendas reais, ou soma de `pedido_itens` | **Mais vendidos** |

- O componente recebe o `criterio` e deriva o título dele (um único lugar no código), para o
  título não divergir da ordem.
- **Gate do go-live 🔒 (D2):** o site público não pode exibir "Mais vendidos" ordenado por
  `created_at`. Sem ordem real da dona, vai ao ar como "Novidades" (ou "Favoritos" se ela curar
  a ordem sem dado de venda). Isso não bloqueia a virada, só o nome.
- `destaque_ordem` é criado no C2; antes disso só "Novidades" existe.

### Bloco B — Fundação do backend (pode correr em paralelo à aprovação)

| # | Item | Marca | Notas |
|---|---|---|---|
| B-1 | Migrations versionadas (`supabase db pull` → `supabase/migrations/0000_baseline.sql`); conferir `pg_policies`: **anon negado em `pedidos`/`pagamentos`/`clientes`/`enderecos`**, além do storage | 🔒🧩 (token Supabase) | wizard |
| B-2 | Staging: 2º projeto Supabase + baseline + cópia de `produtos`/`categorias`/`colecoes` (dados públicos) | 🔒🧩 | o preview passa a apontar para cá quando o checkout real começar (B4) |
| B-3 | Vigia do `disable_signup` no GitHub Actions, fora do build (B7) | 🧩 (Actions) | não bloqueia deploy |

### Bloco C — Checkout

| # | Item | Marca | Notas |
|---|---|---|---|
| C1 | Pesquisa InfinitePay (URL oficial, payload do webhook, sandbox?) → `docs/research/infinitepay.md` | 🔒🧩 (conta + `handle`) | research. As fontes públicas divergem na URL da API |
| C2 | Migration de venda: `produtos.slug`/`descricao_curta`/`destaque_ordem` (+ campos no `ProdutoForm`); `pedidos` de convidado (`cliente_id` nullable, `comprador_*`, `token_acesso`); `metodo_entrega` ganha `regional`; `unique(pagamentos.referencia_externa_id)`; `frete_zonas` com seed; RPC `confirmar_pagamento()`; `CHECK`s | 🔒🧩 (regras de frete) | tdd: integração da RPC no staging |
| C3 | `POST /api/frete`, `/api/checkout`, `/api/webhooks/infinitepay`, `/api/tarefas/reconciliar` + `lib/checkout/*`, todos usando o contrato do A0 | 🔒 | codebase-design, tdd, security-review |
| C4 | `lib/email.js` (Resend via `fetch`): comprador + separação; `/admin/pedidos` só leitura | 🔒🧩 (Resend, e-mail de quem separa) | e-mail real com DMARC=pass |
| C5 | Trocar os mockups A9/A10 pela API real (mesmo contrato) | 🔒 | |
| C6 | 1 e2e `@playwright/test` mobile do fluxo de compra contra o staging | 🔒 | |

### Bloco D — Go-live

| # | Item | Marca | Notas |
|---|---|---|---|
| D1 | Preparar o domínio: adicionar no Netlify sem apontar; Resend em `send.simplicitude.com.br` | 🔒🧩 (acesso DNS GoDaddy) | não toca o SPF raiz |
| D2 | Virada: env de produção, migrations em produção, **inventário físico + `ajuste`**, merge `v1`→`main` (flag desligada; o build falha se algum mockup ficar ligado), **conferir o título da vitrine da home (regra de nomes: nada de "Mais vendidos" sem ordem real da dona)**, **conferir CNPJ/razão social reais no rodapé (a linha "a confirmar" só aparece no preview)**, `SITE_INDEXAVEL=1`, DNS (B5), SSL, pagamento real baixo + estorno, smoke | 🔒🧩 | security-review |

### Pós-go-live (ordem sugerida)
1. `admins` + `is_admin()` + policies + storage só admin. Obrigatório antes de contas de cliente e
   do 3º usuário no Auth.
2. Transições de `/admin/pedidos` + e-mail de "enviado" + cancelamento (movimentação `cancelamento`).
3. `/admin/frete`.
4. Redesign de `/meditacao`.
5. Grade de categorias (A5) e galeria do produto 🧩.
6. ESLint + CI no GitHub Actions.
7. **Migração do DNS e do e-mail para fora da GoDaddy** (B5), como mudança separada.
8. Melhor Envio, WhatsApp, contas de cliente, institucional, NF-e, B2B.

### Skills por fase
`design-taste-frontend` (A2–A4, A6, A7, A9–A11) · `tdd` (A0, A8, C2, C3) · `research` (C1) ·
`codebase-design` (C3) · `security-review` (C3, D2) · `wizard` (B-1, B-2, D1, D2) ·
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


- **Layout:** coluna esquerda com título em serifa com ênfase em itálico, chips de categoria
  (`categorias.slug` → `/loja?categoria=…`) e botão "Ver toda a loja"; à direita, carrossel
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
| Aprovar privacidade, entrega e trocas | dona | 🔒🧩 |
| E-mail que recebe pedidos + quem separa | dona | 🔒🧩 |
| Inventário físico no dia da virada + regra de lançar vendas de feira/B2B | dona | 🔒🧩 |
| Acesso ao DNS na GoDaddy + o que roda hoje em `103.169.142.0` | você/dona | 🔒🧩 |
| Token Supabase (CLI) + ok para o projeto de staging | você | 🔒🧩 |
| ~~Acesso às envs e aos contextos de deploy do Netlify~~ — feito (A1) | você | — |
| Conta Resend | você | 🔒🧩 |
| GitHub Actions habilitado (cron + vigia) | você | 🧩 (a reconciliação é 🔒) |
| Nota fiscal nas vendas online | dona | 🧩 (pode bloquear por motivo fiscal) |
| Ordem real dos mais vendidos (a partir de vendas de feira/WhatsApp) + descrição curta | dona | 🧩 (fallback: a seção vai ao ar como "Novidades"; sem esse dado o nome "Mais vendidos" não é usado) |
| Fotos do hero | dona | 🧩 (há fotos atuais) |
| Fotos de categoria / galeria | dona | 🧩 pós-go-live |
| Tipografia oficial | dona | 🧩 (provisória fica) |
| Novo provedor de e-mail (saída da GoDaddy) | você/dona | 🧩 pós-go-live |

**Decisões a confirmar:** cortar-se-atrasar A5 (grade de categorias) e o redesign de `/meditacao`;
checkout de convidado; o rótulo "Bem-estar" para `/meditacao`; o conteúdo de Bem-fazer e Assinaturas (hoje só "Em breve"). Superada: "`/quem-somos` fora do menu" — agora está no menu.
