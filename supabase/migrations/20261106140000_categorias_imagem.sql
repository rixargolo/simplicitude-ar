-- X7: foto opcional por categoria (cartão da home) com ponto de foco e zoom, como nos produtos.
-- 1) Acrescenta categorias.imagem_url (nullable) e imagem_foco_x/imagem_foco_y/imagem_zoom (com default).
-- 2) Cria o bucket público "categorias" (5 MB, JPEG/PNG/WebP) e as policies de escrita em storage.objects.
--    Caminho dos arquivos: {categoria_id}/{uuid}.{ext}.
-- Seguro para a main: só colunas novas nullable ou com default e um bucket novo; a main grava payload explícito
-- e lê com select('*'). Nada muda em RLS de tabelas nem no bucket "produtos".
-- Leitura: bucket público serve a URL pública sem policy de SELECT para anon (de propósito: sem listagem anônima).
-- Escrita: mesmo modelo das demais tabelas, authenticated = admin (pendência de segurança #1 do CLAUDE.md).
-- Fatia X7. Já aplicado em produção em 2026-11-06. Reexecutável: if not exists, on conflict, drop policy if exists.

alter table public.categorias
  add column if not exists imagem_url text,
  add column if not exists imagem_foco_x smallint not null default 50 check (imagem_foco_x between 0 and 100),
  add column if not exists imagem_foco_y smallint not null default 50 check (imagem_foco_y between 0 and 100),
  add column if not exists imagem_zoom smallint not null default 100 check (imagem_zoom between 100 and 200);

comment on column public.categorias.imagem_url is
  'X7: URL pública da foto da categoria (bucket categorias). null = cartão sem foto.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('categorias', 'categorias', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- for all cobre insert (upload), select (listar/baixar, exigido por remove e upsert), update e delete
drop policy if exists "categorias storage admin" on storage.objects;
create policy "categorias storage admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'categorias')
  with check (bucket_id = 'categorias');
