-- X12: taxonomia. Coleção pertence a uma categoria; produto ↔ coleção vira muitos-para-muitos;
-- categorias e coleções ganham o par de tradução do ADR 0002 (fatia I1, só para essas duas entidades).
-- 1) colecoes.categoria_id (not null, backfill = Chocolates), colecoes.ordem (nullable: null vai para o fim),
--    slug da Inspirar limpo (cole-o-inspirar → inspirar), slug único e com check de formato (not valid, como as categorias no X8),
--    seed de "Bombons" em Chocolates e policy de escrita para authenticated (nunca houve tela de coleções).
-- 2) produto_colecoes (produto_id, colecao_id), com backfill a partir de produtos.colecao_id.
--    produtos.colecao_id continua como CÓPIA da 1ª coleção (mesmo padrão do X1): o admin da main só grava essa coluna,
--    e os triggers de sincronizar_colecao_principal() refletem a troca/remoção feita lá em produto_colecoes.
-- 3) categoria_traducoes e colecao_traducoes (PK entidade+idioma, idioma só 'en', campos vazios caem no PT em lib/i18n.js).
-- Seguro para a main: só colunas/tabelas novas; a main grava payload explícito em produtos e lê colecoes com select('*')
-- (a coluna categoria_id not null não a afeta: a main nunca insere coleção).
-- Não liga nem desliga RLS em colecoes (estado atual não versionado, B-1b): só acrescenta a policy de escrita.
-- Fatia X12. A aplicar em produção. Reexecutável: if not exists, on conflict, drop ... if exists.

-- 1) colecoes
alter table public.colecoes
  add column if not exists categoria_id uuid references public.categorias(id) on delete restrict,
  add column if not exists ordem smallint check (ordem > 0);

update public.colecoes
   set categoria_id = (select id from public.categorias where slug = 'chocolates')
 where categoria_id is null;
alter table public.colecoes alter column categoria_id set not null;

create index if not exists colecoes_categoria_ordem_idx on public.colecoes (categoria_id, ordem);

update public.colecoes set slug = 'inspirar' where slug = 'cole-o-inspirar';
update public.colecoes set ordem = 1 where slug = 'inspirar' and ordem is null;

create unique index if not exists colecoes_slug_key on public.colecoes (slug);
alter table public.colecoes drop constraint if exists colecoes_slug_formato;
alter table public.colecoes add constraint colecoes_slug_formato
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80) not valid;

insert into public.colecoes (nome, slug, categoria_id, ordem)
select 'Bombons', 'bombons', c.id, 2 from public.categorias c where c.slug = 'chocolates'
on conflict (slug) do nothing;

grant select on public.colecoes to anon, authenticated;
grant insert, update, delete on public.colecoes to authenticated;
-- mesmo modelo das demais tabelas: authenticated = admin (pendência de segurança #1 do CLAUDE.md)
drop policy if exists "colecoes admin" on public.colecoes;
create policy "colecoes admin" on public.colecoes
  for all to authenticated using (true) with check (true);

-- 2) produto_colecoes
create table if not exists public.produto_colecoes (
  produto_id uuid not null references public.produtos(id) on delete cascade,
  colecao_id uuid not null references public.colecoes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (produto_id, colecao_id)
);
create index if not exists produto_colecoes_colecao_idx on public.produto_colecoes (colecao_id);

alter table public.produto_colecoes enable row level security;
grant select on public.produto_colecoes to anon, authenticated;
grant insert, update, delete on public.produto_colecoes to authenticated;

drop policy if exists "produto_colecoes leitura publica" on public.produto_colecoes;
create policy "produto_colecoes leitura publica" on public.produto_colecoes
  for select to anon
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.ativo));

drop policy if exists "produto_colecoes admin" on public.produto_colecoes;
create policy "produto_colecoes admin" on public.produto_colecoes
  for all to authenticated using (true) with check (true);

insert into public.produto_colecoes (produto_id, colecao_id)
select id, colecao_id from public.produtos where colecao_id is not null
on conflict do nothing;

-- Admin da main grava só produtos.colecao_id: troca/remoção aparece aqui na hora.
-- shortcut: a main só conhece uma coleção; trocar lá tira só o par antigo e põe o novo (as demais ficam),
-- e tirar a coleção lá não zera a cópia se restarem outras; até o go-live, editar coleções só pelo admin da v1.
create or replace function public.sincronizar_colecao_principal() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.colecao_id is not null then
      delete from public.produto_colecoes where produto_id = new.id and colecao_id = old.colecao_id;
    end if;
  end if;
  if new.colecao_id is not null then
    insert into public.produto_colecoes (produto_id, colecao_id) values (new.id, new.colecao_id)
    on conflict do nothing;
  end if;
  return null;
end $$;

-- dois triggers: o WHEN de um trigger de INSERT não pode citar OLD
drop trigger if exists produtos_sincronizar_colecao on public.produtos;
drop trigger if exists produtos_sincronizar_colecao_ins on public.produtos;
create trigger produtos_sincronizar_colecao_ins
  after insert on public.produtos
  for each row when (new.colecao_id is not null)
  execute function public.sincronizar_colecao_principal();

drop trigger if exists produtos_sincronizar_colecao_upd on public.produtos;
create trigger produtos_sincronizar_colecao_upd
  after update of colecao_id on public.produtos
  for each row when (old.colecao_id is distinct from new.colecao_id)
  execute function public.sincronizar_colecao_principal();

-- 3) Traduções (ADR 0002, opção B): PT fica nas tabelas-base; uma linha por (entidade, idioma).
create table if not exists public.categoria_traducoes (
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  idioma text not null check (idioma in ('en')),
  nome text,
  descricao text,
  primary key (categoria_id, idioma)
);

create table if not exists public.colecao_traducoes (
  colecao_id uuid not null references public.colecoes(id) on delete cascade,
  idioma text not null check (idioma in ('en')),
  nome text,
  descricao text,
  primary key (colecao_id, idioma)
);

alter table public.categoria_traducoes enable row level security;
alter table public.colecao_traducoes enable row level security;
grant select on public.categoria_traducoes, public.colecao_traducoes to anon, authenticated;
grant insert, update, delete on public.categoria_traducoes, public.colecao_traducoes to authenticated;

-- categorias e coleções já são públicas: a tradução também
drop policy if exists "categoria_traducoes leitura publica" on public.categoria_traducoes;
create policy "categoria_traducoes leitura publica" on public.categoria_traducoes
  for select to anon using (true);
drop policy if exists "categoria_traducoes admin" on public.categoria_traducoes;
create policy "categoria_traducoes admin" on public.categoria_traducoes
  for all to authenticated using (true) with check (true);

drop policy if exists "colecao_traducoes leitura publica" on public.colecao_traducoes;
create policy "colecao_traducoes leitura publica" on public.colecao_traducoes
  for select to anon using (true);
drop policy if exists "colecao_traducoes admin" on public.colecao_traducoes;
create policy "colecao_traducoes admin" on public.colecao_traducoes
  for all to authenticated using (true) with check (true);
