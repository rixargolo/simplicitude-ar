-- X1: preenche e reconcilia produto_imagens com produtos.imagem_url.
-- NÃO é migration: roda no SQL Editor do Supabase DEPOIS da migration 20261105181330_produto_imagens.sql
-- e DE NOVO no go-live (D2), porque até lá a dona edita fotos pelo admin da `main`, que só grava em produtos.
-- Reexecutável: delete só de linhas órfãs, insert ... on conflict do nothing, update com o mesmo valor.
-- Já rodado em produção em 2026-11-05 (1ª vez).

-- 1) principal antiga trocada de extensão pelo admin da main: arquivo apagado, linha sai
delete from public.produto_imagens i using public.produtos p
 where i.produto_id = p.id
   and i.caminho like p.id::text || '/principal.%'
   and i.caminho is distinct from
       split_part(substring(p.imagem_url from '/object/public/produtos/(.+)$'), '?', 1);
-- 2) principal de produtos que ainda não está na tabela entra como primeira
insert into public.produto_imagens (produto_id, caminho, ordem, foco_x, foco_y, zoom)
select p.id, c.caminho,
       coalesce((select min(i.ordem) from public.produto_imagens i where i.produto_id = p.id) - 1, 0),
       coalesce(p.imagem_foco_x, 50), coalesce(p.imagem_foco_y, 50), coalesce(p.imagem_zoom, 100)
  from public.produtos p
 cross join lateral (select split_part(substring(p.imagem_url from '/object/public/produtos/(.+)$'), '?', 1) as caminho) c
 where c.caminho <> ''
on conflict (produto_id, caminho) do nothing;
-- 3) foco/zoom da principal seguem produtos (o admin da main só edita ali)
update public.produto_imagens i
   set foco_x = coalesce(p.imagem_foco_x, 50), foco_y = coalesce(p.imagem_foco_y, 50), zoom = coalesce(p.imagem_zoom, 100)
  from public.produtos p
 where i.produto_id = p.id
   and i.caminho = split_part(substring(p.imagem_url from '/object/public/produtos/(.+)$'), '?', 1);

-- Conferência: deve listar 1 linha por produto com foto, ordem 0
select p.nome, i.caminho, i.ordem, i.foco_x, i.foco_y, i.zoom
  from public.produtos p left join public.produto_imagens i on i.produto_id = p.id order by p.nome, i.ordem;
