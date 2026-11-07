-- Remove os produtos de TESTE (slug "teste-%") e as tags "teste-%". Reexecutável.
-- Só por SQL: excluir pelo admin tenta apagar do Storage (as fotos de teste ficam em public/teste/).
-- Depois de rodar, apagar a pasta public/teste/ do repositório (item do D2 em docs/plano-v1.md).
-- Cascade leva junto produto_imagens, produto_colecoes, produto_tags, produto_slugs e produto_traducoes.

begin;

delete from public.estoque_movimentacoes where produto_id in (select id from public.produtos where slug like 'teste-%');
delete from public.produtos where slug like 'teste-%';
delete from public.tags where slug like 'teste-%';

commit;

-- Conferência: as duas contagens devem dar 0
select (select count(*) from public.produtos where slug like 'teste-%') as produtos_teste,
       (select count(*) from public.tags where slug like 'teste-%') as tags_teste;
