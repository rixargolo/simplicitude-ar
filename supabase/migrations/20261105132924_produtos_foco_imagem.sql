-- A6b: ponto de foco da foto do produto (produtos.imagem_foco_x / imagem_foco_y, 0–100, centro = 50).
-- Já aplicado em produção em 2026-11-05.
-- Reconstruído; tipo, not null e default conferidos no banco de produção em 2026-11-05;
-- o nome das constraints de check pode diferir do banco.
-- Reexecutável: add column if not exists.

alter table public.produtos
  add column if not exists imagem_foco_x smallint not null default 50 check (imagem_foco_x between 0 and 100),
  add column if not exists imagem_foco_y smallint not null default 50 check (imagem_foco_y between 0 and 100);
