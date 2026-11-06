-- X8: endereço (slug) estável do produto. Coluna produtos.slug fixa + histórico produto_slugs
-- (slug antigo continua resolvendo e redireciona; nunca é reaproveitado por outro produto).
-- Ainda NÃO aplicado em produção. Aplicar ANTES de publicar a v1 (o código novo lê produtos.slug).
-- Seguro para a branch main: ela não conhece a coluna; o trigger preenche o slug em INSERT sem slug,
-- e UPDATE de nome não mexe no slug.
-- Reexecutável: if not exists, drop ... if exists, on conflict do nothing.
--
-- Conferir ANTES de rodar (deve voltar vazio; duas linhas aqui derrubariam o unique):
--   select public_slug, count(*) from (select regexp_replace(lower(extensions.unaccent(nome)), '[^a-z0-9]+', '-', 'g') as public_slug from produtos) t group by 1 having count(*) > 1;

create extension if not exists unaccent with schema extensions;

-- Mesma regra do slugify() de lib/produtos.js.
create or replace function public.slugify(t text) returns text
language sql stable set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(t)), '[^a-z0-9]+', '-', 'g'))
$$;

-- produtos.slug
alter table public.produtos add column if not exists slug text;
update public.produtos set slug = public.slugify(nome) where slug is null;
alter table public.produtos alter column slug set not null;

alter table public.produtos drop constraint if exists produtos_slug_formato;
alter table public.produtos add constraint produtos_slug_formato
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80);
create unique index if not exists produtos_slug_key on public.produtos (slug);

-- Histórico: todo slug que algum produto já teve, inclusive o atual. A PK impede reaproveitar.
-- on delete cascade: apagar o produto libera os slugs dele (e os links antigos viram 404, de propósito).
create table if not exists public.produto_slugs (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists produto_slugs_produto_idx on public.produto_slugs (produto_id);

insert into public.produto_slugs (slug, produto_id)
select slug, id from public.produtos
on conflict (slug) do nothing;

alter table public.produto_slugs enable row level security;
grant select on public.produto_slugs to anon, authenticated;

drop policy if exists "produto_slugs leitura publica" on public.produto_slugs;
create policy "produto_slugs leitura publica" on public.produto_slugs
  for select to anon
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.ativo));

drop policy if exists "produto_slugs admin leitura" on public.produto_slugs;
create policy "produto_slugs admin leitura" on public.produto_slugs
  for select to authenticated using (true);
-- sem policy de escrita: só o trigger abaixo (security definer) grava.

-- INSERT sem slug (admin da main): gera do nome.
create or replace function public.produtos_slug_padrao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.slug := coalesce(nullif(new.slug, ''), public.slugify(new.nome));
  return new;
end $$;

drop trigger if exists produtos_slug_padrao on public.produtos;
create trigger produtos_slug_padrao before insert on public.produtos
  for each row execute function public.produtos_slug_padrao();

-- Registra o slug no histórico; recusa um slug que já pertenceu a OUTRO produto.
create or replace function public.produtos_slug_historico() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.produto_slugs s where s.slug = new.slug and s.produto_id <> new.id) then
    raise exception 'O endereço "%" já é ou já foi de outro produto.', new.slug using errcode = '23505';
  end if;
  insert into public.produto_slugs (slug, produto_id) values (new.slug, new.id) on conflict (slug) do nothing;
  return null;
end $$;

drop trigger if exists produtos_slug_historico on public.produtos;
create trigger produtos_slug_historico after insert or update of slug on public.produtos
  for each row execute function public.produtos_slug_historico();

-- Categorias: slug único e no mesmo formato. O check é "not valid": vale só para gravações novas,
-- então slugs antigos fora do formato não derrubam a migration. O unique falha se já houver duplicata.
create unique index if not exists categorias_slug_key on public.categorias (slug);
alter table public.categorias drop constraint if exists categorias_slug_formato;
alter table public.categorias add constraint categorias_slug_formato
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80) not valid;
