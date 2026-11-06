-- X1: várias fotos por produto. Tabela produto_imagens + RLS + limite do bucket "produtos".
-- Já aplicado em produção em 2026-11-05.
-- Aditiva: produtos.imagem_url/foco/zoom ficam como cópia da principal.
-- O preenchimento/reconciliação com produtos.imagem_url NÃO é migration (roda de novo no go-live, D2):
-- fica em supabase/scripts/x1_reconciliar_produto_imagens.sql.
-- Reexecutável: if not exists, drop policy if exists, update com o mesmo valor.

create table if not exists public.produto_imagens (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  caminho text not null,                       -- caminho no bucket "produtos", sem URL nem ?v=
  ordem integer not null default 0,            -- menor = antes; a primeira é a principal
  foco_x smallint not null default 50 check (foco_x between 0 and 100),
  foco_y smallint not null default 50 check (foco_y between 0 and 100),
  zoom smallint not null default 100 check (zoom between 100 and 200),
  alt text,
  created_at timestamptz not null default now(),
  unique (produto_id, caminho)
);
create index if not exists produto_imagens_produto_ordem_idx
  on public.produto_imagens (produto_id, ordem);

alter table public.produto_imagens enable row level security;

grant select on public.produto_imagens to anon, authenticated;
grant insert, update, delete on public.produto_imagens to authenticated;

drop policy if exists "produto_imagens leitura publica" on public.produto_imagens;
create policy "produto_imagens leitura publica" on public.produto_imagens
  for select to anon
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.ativo));

-- mesmo modelo das demais tabelas: authenticated = admin (pendência de segurança #1)
drop policy if exists "produto_imagens admin" on public.produto_imagens;
create policy "produto_imagens admin" on public.produto_imagens
  for all to authenticated using (true) with check (true);

-- Limite no servidor (Storage)
update storage.buckets
   set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id = 'produtos';
