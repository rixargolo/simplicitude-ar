# ADR 0002 — Multilíngue (PT e EN)

**Status:** proposto (só decisão, nada implementado) · **Data:** 2026-11-06

## Contexto

O site passa a ter português e inglês; outros idiomas virão depois. Visitante de país anglófono
abre em inglês e há um seletor visível. Os áudios de meditação existem por idioma (os em inglês
virão depois). Produtos, categorias, coleções e tags precisam de tradução, e o admin continua
simples para a dona da fábrica.

Fatos do projeto que pesam na escolha:

- O banco é **compartilhado** entre `main` e `v1` até o go-live: a `main` lê `produtos.nome`,
  `descricao`, `atributos`, `audio_url` e `colecao_id`. Mudança que mova ou renomeie essas colunas
  quebra o site atual.
- Os slugs acabaram de ser fixados (X8) e os links já circulam.
- Hoje não existem `descricao_curta` (prevista no C2), `ingredientes` nem tags (`atributos` é texto
  livre, ex.: "62% cacau | Laranja"). `colecoes` é 1-N (`produtos.colecao_id`).
- A v1 entrega só no Brasil. Preço é em BRL.
- Vale o [ADR 0001](0001-portabilidade.md): só Next.js/Postgres/HTTP padrão, nada de `@netlify/*`,
  envs de plataforma nem serviço de tradução externo.

## Decisão

### 1. Onde guardar o conteúdo traduzível

| Opção | Prós | Contras |
|---|---|---|
| A. Coluna por idioma (`nome_en`, `descricao_en`…) | Sem join; formulário trivial | Cada idioma novo = migration em 4 tabelas × ~5 campos |
| **B. Tabela de tradução por entidade; PT fica na tabela-base** | Idioma novo é dado, não schema; PT intocado (a `main` segue funcionando); FK e `check` normais | Um embed/join e o fallback em JS |
| C. `jsonb` por campo (`{"pt": …, "en": …}`) | Uma coluna só | Quebra a `main`, a trigger `slugify(nome)` e os `check`; migra todo o conteúdo |
| D. Tabela genérica (entidade, campo, idioma, valor) | Uma tabela para tudo | EAV sem FK nem tipo; consultas ruins |
| E. CMS/SaaS de tradução | Interface pronta | Fere o ADR 0001 |

**Escolha: B.** O PT é o idioma-base e obrigatório, nas colunas que já existem. Os demais idiomas
vão para tabelas irmãs, uma linha por (entidade, idioma):

- `produto_traducoes(produto_id, idioma, nome, descricao_curta, descricao, ingredientes, atributos, audio_url)`
- `categoria_traducoes(categoria_id, idioma, nome, descricao)`
- `colecao_traducoes(colecao_id, idioma, nome, descricao)`
- `tag_traducoes(tag_id, idioma, nome)`

Regras: PK `(entidade_id, idioma)`; `idioma` com `check (idioma in ('en'))` (idioma novo = ampliar o
check); `on delete cascade`; RLS no mesmo modelo das tabelas-base (anon lê só de produto ativo,
escrita para `authenticated`). Campo de tradução vazio **cai no PT**, por uma função pura
`traduzir(registro, traducao, idioma)` em `lib/i18n.js`, com teste. A leitura pública continua no
servidor, em `lib/produtos.js`, com embed `produto_traducoes!left` filtrado pelo idioma.

**Campos já previstos no desenho**

| Campo | Onde mora o PT | Tradução |
|---|---|---|
| Descrição longa | `produtos.descricao` (sem renomear: a `main` usa) | `produto_traducoes.descricao` |
| Descrição curta (≤120, C2) | `produtos.descricao_curta` | `produto_traducoes.descricao_curta` |
| Ingredientes | `produtos.ingredientes` (novo) | `produto_traducoes.ingredientes` |
| Coleções (M:N) | `produto_colecoes(produto_id, colecao_id, ordem)`; `produtos.colecao_id` fica como cópia da 1ª até a `main` sair (mesmo padrão do X1) | `colecao_traducoes` |
| Tags | `tags(id, slug, nome)` + `produto_tags(produto_id, tag_id)` | `tag_traducoes` |

- **Slugs não se traduzem** (produto, categoria, coleção, tag): um slug por registro, e o histórico
  do X8 (`produto_slugs`, 308) continua valendo sem mapa por idioma.
- `pedido_itens.nome_produto` guarda sempre o nome em PT (quem separa o pedido lê PT).
  `pedidos.idioma` entra com o checkout, só para escolher o idioma do e-mail.

### 2. Rotas e SEO

| Opção | Prós | Contras |
|---|---|---|
| **P. PT sem prefixo, EN em `/en/...`** | URLs atuais e links já compartilhados intactos; mercado principal com URL limpa | Rewrite interno do PT no `proxy.js` |
| Q. Tudo prefixado (`/pt`, `/en`), a raiz detecta | Padrão comum, `x-default` redirecionador | Muda todas as URLs logo após o go-live; mais um redirect em todo link do Instagram |
| R. Subdomínio ou domínio por idioma (`en.`) | Separação total | DNS (GoDaddy temporária), cookie e deploy em dobro |
| S. Mesma URL, idioma por cookie | Zero rota nova | O Google indexa um idioma só; hreflang impossível |

**Escolha: P.**

- Páginas públicas passam a viver em `app/[lang]/` (`lang` ∈ `pt`, `en`). O `proxy.js` reescreve
  `/x` → `/pt/x` (invisível) e responde 404 a `/pt/...` digitado (evita URL duplicada).
  `admin` e `login` ficam fora do `[lang]`, só em PT, em route groups com layout raiz próprio; o
  `<html lang>` sai do layout de cada grupo.
- **Caminhos não se traduzem** (`/en/loja/<slug>`, `/en/quem-somos`): sem mapa de segmentos. Traduzir
  depois é aditivo (rewrite + 308).
- **Metadados:** `generateMetadata` com `alternates.canonical` e `alternates.languages`
  (`pt-BR` → `/x`, `en` → `/en/x`, `x-default` → `/x`), `openGraph.locale`/`alternateLocale` e
  `app/sitemap.js` com `alternates`. URLs absolutas vêm de `SITE_URL` (A11).
- **Página EN sem tradução** de nome e descrição abre com o texto PT, mas sai com `robots: noindex` e
  **sem** o par hreflang (evita conteúdo duplicado entre os dois idiomas).
- **Texto fixo** (menu, botões, institucional) em dicionários JS `lib/i18n/pt.js` e `en.js`.
  **Sem dependência nova**: uma lib de i18n não compensa para 2 idiomas.
- Preço segue em BRL nos dois idiomas (`Intl.NumberFormat` por locale); a versão EN avisa que a
  entrega é só no Brasil. A mensagem do WhatsApp (`linkCompra`) também sai por idioma.

### 3. Detectar o idioma e lembrar a escolha

Só no `proxy.js`, **só em URL sem prefixo** (PT). `/en/...` nunca redireciona. Ordem de decisão:

1. Cookie `idioma` (1 ano, `SameSite=Lax`, funcional, citado na política de privacidade do A11) manda.
2. Sem cookie e **sem `Accept-Language`** → PT. Googlebot e os leitores de prévia do WhatsApp e do
   Instagram não enviam o cabeçalho; assim o Google sempre vê o PT, sem farejar user-agent.
3. Sem cookie: se o `Accept-Language` prefere EN a PT **e** (PT não está na lista **ou** o país é
   anglófono), responde 307 para `/en/x` com `Cache-Control: private, no-store`.
4. Senão, PT.

O país vem de um cabeçalho da plataforma, lido por **uma** função, `paisDaRequisicao(headers)` em
`lib/i18n.js` (aceita o cabeçalho do Netlify, `cf-ipcountry` e `cloudfront-viewer-country`; confirmar
o nome exato do Netlify na implementação). Sem cabeçalho, vale só o `Accept-Language`. Países
anglófonos ficam numa constante (US, GB, IE, CA, AU, NZ). Assim a portabilidade do ADR 0001 se
mantém: trocar de hospedagem é mexer numa função.

**Refino sobre o pedido original:** só o país não decide. Brasileiro morando em país anglófono, com
navegador em PT, abre PT; turista com navegador em EN no Brasil abre EN.

**Seletor** no `Header` (e no `Footer`): um `<a>` para a URL equivalente no outro idioma (funciona sem
JS) com `onClick` que grava o cookie. **Só a escolha explícita grava o cookie**: abrir um link `/en`
compartilhado não grava (senão um brasileiro que clicou num link em inglês passaria a ser
redirecionado sempre).
`shortcut:` sem JS a escolha não é lembrada; aceitável, o link do seletor continua funcionando.

### 4. Áudios por idioma

| Opção | Prós | Contras |
|---|---|---|
| Coluna `audio_url_en` em `produtos` | Simples | A mesma dor da opção A |
| Tabela `produto_audios(produto_id, idioma, url)` | Comporta vários áudios e metadados | Tabela a mais sem necessidade hoje |
| **`audio_url` em `produto_traducoes`** | Mesmo mecanismo do texto; PT segue em `produtos.audio_url` (a `main` não muda) | — |

**Escolha: a última.** Arquivos novos no bucket `meditacao` em `{idioma}/{arquivo}`; os atuais ficam
onde estão. Sem áudio no idioma pedido, o player toca o PT com o aviso "Guided meditation in
Portuguese — English version coming soon" (`traduzir` devolve também o `audio_idioma` efetivo).
`tem_meditacao` não depende de idioma.

### 5. Migração do conteúdo atual

- **Nenhum texto PT se move.** Todas as mudanças de banco são aditivas, em arquivos novos de
  `supabase/migrations/`; a `main` e o banco compartilhado seguem intactos.
- URLs atuais não mudam (PT sem prefixo); `produto_slugs` fica como está.
- Código: mover as páginas públicas para `app/[lang]/`; ampliar o `matcher` do `proxy.js` para as
  páginas públicas (exceto `_next`, estáticos e `api`), preservando o 404 de `/admin` e `/login` no
  preview; trocar texto fixo por dicionário. O EN só entra no seletor quando as páginas do menu
  tiverem texto em EN.
- **Admin:** nos formulários de produto, categoria, coleção e tag, o PT fica como hoje (obrigatório)
  e ganha uma seção recolhível **"English (opcional)"** com os mesmos campos na mesma tela. Vazio =
  usa o PT. Salvar faz upsert da linha de tradução (e apaga a linha se tudo estiver vazio). As listas
  ganham um selo "EN ✓ / —". A escrita segue pelo client autenticado, como o resto do admin: isso
  **amplia a dívida já aceita no ADR 0001** (admin escreve do browser) e entra na mesma conta, se um
  dia o banco trocar.
- **Fatias (pós-go-live):** **I1** tabelas `*_traducoes` + `traduzir()` + campos EN no admin (inofensivo
  sem as rotas) → **I2** `[lang]` + `proxy.js` + seletor + dicionários + hreflang/sitemap → **I3** áudio EN →
  **I4** conteúdo em EN, pela dona. `descricao_curta`, `ingredientes`, coleções M:N e tags entram nas
  fatias que as criarem (C2 ou novas), já com o par de tradução.
  **Andamento (X12, 2026-11-06):** `categoria_traducoes`, `colecao_traducoes`, `lib/i18n.js` e a seção "English
  (opcional)" já existem para categorias e coleções. O M:N `produto_colecoes` entrou sem a coluna `ordem` prevista na
  tabela acima (nada a usa; acrescentá-la depois é aditivo). Faltam produto e tag, e as rotas (I2).

## Fora do escopo

Tradução automática no admin, moeda estrangeira, entrega fora do Brasil, admin em inglês, caminhos
traduzidos e terceiro idioma (o `check` de `idioma` e um dicionário novo bastam quando chegar).

## Consequências

- Adicionar um idioma é dado, um item no `check`, um dicionário e uma constante; não é migração de
  conteúdo.
- O PT continua sendo a fonte da verdade: sem tradução, o site funciona (com `noindex` na página EN).
- Custo aceito: um embed a mais nas leituras públicas, a regra de fallback em JS e a mudança
  estrutural de `app/` para `app/[lang]/` (a parte mais cara de reverter, por isso este ADR).
- Risco a vigiar: a detecção mexe no `proxy.js`, hoje restrito a `/admin` e `/login`; ampliá-lo
  coloca-o no caminho de toda página pública (manter a lógica pura, em `lib/i18n.js`, com testes).
