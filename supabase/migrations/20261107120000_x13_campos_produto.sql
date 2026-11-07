-- X13: campos do produto. Descrição curta (≤120) e ingredientes em `produtos`; tags (cadastro + N:N com produtos);
-- tradução EN de produto e de tag (ADR 0002, fatia I1; categorias e coleções já foram no X12).
-- 1) produtos.descricao_curta e produtos.ingredientes (nullable). `atributos` e `descricao` ficam intocadas:
--    a main continua lendo e gravando as duas (a v1 só deixa de usar `atributos`).
-- 2) tags (nome, slug único com o mesmo check de formato do X8) e produto_tags (PK produto+tag).
-- 3) tag_traducoes e produto_traducoes (PK entidade+idioma, idioma só 'en', campo vazio cai no PT em lib/i18n.js).
--    produto_traducoes não tem `atributos` (substituído pela descrição curta) nem `audio_url` (I3, aditivo depois).
-- Seguro para a main: só colunas/tabelas novas; ela grava payload explícito em produtos e lê com select('*').
-- Depende do X12 (20261106150000) só pela ordem de aplicação, não por objeto.
-- Fatia X13. A aplicar em produção. Reexecutável: if not exists, drop ... if exists, on conflict.

-- 1) produtos
alter table public.produtos
  add column if not exists descricao_curta text,
  add column if not exists ingredientes text;

alter table public.produtos drop constraint if exists produtos_descricao_curta_tamanho;
alter table public.produtos add constraint produtos_descricao_curta_tamanho
  check (char_length(descricao_curta) <= 120);

-- 2) tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.tags drop constraint if exists tags_slug_formato;
alter table public.tags add constraint tags_slug_formato
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80);

create table if not exists public.produto_tags (
  produto_id uuid not null references public.produtos(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (produto_id, tag_id)
);
create index if not exists produto_tags_tag_idx on public.produto_tags (tag_id);

-- 3) traduções
create table if not exists public.tag_traducoes (
  tag_id uuid not null references public.tags(id) on delete cascade,
  idioma text not null check (idioma in ('en')),
  nome text,
  primary key (tag_id, idioma)
);

create table if not exists public.produto_traducoes (
  produto_id uuid not null references public.produtos(id) on delete cascade,
  idioma text not null check (idioma in ('en')),
  nome text,
  descricao_curta text check (char_length(descricao_curta) <= 120),
  descricao text,
  ingredientes text,
  primary key (produto_id, idioma)
);

-- RLS e grants: mesmo modelo das demais (authenticated = admin, pendência de segurança #1 do CLAUDE.md)
alter table public.tags enable row level security;
alter table public.produto_tags enable row level security;
alter table public.tag_traducoes enable row level security;
alter table public.produto_traducoes enable row level security;

grant select on public.tags, public.produto_tags, public.tag_traducoes, public.produto_traducoes to anon, authenticated;
grant insert, update, delete on public.tags, public.produto_tags, public.tag_traducoes, public.produto_traducoes to authenticated;

-- tag é pública, como categoria (e a tradução dela também)
drop policy if exists "tags leitura publica" on public.tags;
create policy "tags leitura publica" on public.tags for select to anon using (true);
drop policy if exists "tags admin" on public.tags;
create policy "tags admin" on public.tags for all to authenticated using (true) with check (true);

drop policy if exists "tag_traducoes leitura publica" on public.tag_traducoes;
create policy "tag_traducoes leitura publica" on public.tag_traducoes for select to anon using (true);
drop policy if exists "tag_traducoes admin" on public.tag_traducoes;
create policy "tag_traducoes admin" on public.tag_traducoes for all to authenticated using (true) with check (true);

-- ligação e tradução do produto: anon só enxerga as de produto ativo (padrão de produto_colecoes)
drop policy if exists "produto_tags leitura publica" on public.produto_tags;
create policy "produto_tags leitura publica" on public.produto_tags
  for select to anon
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.ativo));
drop policy if exists "produto_tags admin" on public.produto_tags;
create policy "produto_tags admin" on public.produto_tags for all to authenticated using (true) with check (true);

drop policy if exists "produto_traducoes leitura publica" on public.produto_traducoes;
create policy "produto_traducoes leitura publica" on public.produto_traducoes
  for select to anon
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.ativo));
drop policy if exists "produto_traducoes admin" on public.produto_traducoes;
create policy "produto_traducoes admin" on public.produto_traducoes for all to authenticated using (true) with check (true);
