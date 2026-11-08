-- X20: título da meditação. Aparece em /meditacao no lugar do nome do produto; vazio = usa o nome.
-- 1) produtos.titulo_meditacao (text, nullable). 2) produto_traducoes.titulo_meditacao (EN, nullable; vazio cai no PT).
-- Seguro para a main: só colunas novas (ela grava payload explícito e lê com select('*')).
-- RLS/grants: sem mudança (as policies das duas tabelas cobrem a linha toda).
-- Fatia X20. Já aplicado em produção em 2026-11-08. Reexecutável: add column if not exists.
alter table public.produtos add column if not exists titulo_meditacao text;
alter table public.produto_traducoes add column if not exists titulo_meditacao text;
