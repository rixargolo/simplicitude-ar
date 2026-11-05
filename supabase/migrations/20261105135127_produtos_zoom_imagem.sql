-- A6c: zoom da foto do produto (produtos.imagem_zoom, 100–200, sem zoom = 100).
-- Já aplicado em produção em 2026-11-05.
-- Reconstruído; tipo, not null e default conferidos no banco de produção em 2026-11-05;
-- o nome das constraints de check pode diferir do banco.
-- Reexecutável: add column if not exists.

alter table public.produtos
  add column if not exists imagem_zoom smallint not null default 100 check (imagem_zoom between 100 and 200);
