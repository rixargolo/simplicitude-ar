-- Fotos otimizadas: produto_imagens.caminho_original guarda o arquivo original de uma foto reprocessada
-- (scripts/otimizar-fotos-produtos.mjs), para poder reverter e, numa fatia futura, apagar os originais do Storage.
-- Fica null em foto enviada já otimizada pelo admin e em foto ainda não reprocessada.
-- Seguro para a main: só uma coluna nova (ela lê com select('*') e grava payload explícito).
-- RLS/grants: sem mudança (a policy "produto_imagens admin" cobre a linha toda).
-- Fatia "otimizar fotos dos produtos". Ainda NÃO aplicado em produção.
-- Reexecutável: add column if not exists.
alter table public.produto_imagens add column if not exists caminho_original text;
