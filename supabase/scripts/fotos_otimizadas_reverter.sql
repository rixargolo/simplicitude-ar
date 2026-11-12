-- Reverte o reprocessamento de fotos (scripts/otimizar-fotos-produtos.mjs): volta cada foto ao arquivo original
-- e regrava a cópia produtos.imagem_url (que só carrega o caminho novo se a foto era a principal).
-- Só funciona enquanto os originais estão no Storage (a fatia de otimização não apaga nada).
-- Não é migration: roda à mão, só se algo der errado. Reexecutável.
-- Os arquivos novos (-320/-640/-1080/-1600/-og) ficam órfãos no Storage; remover depois, se quiser.
-- Atenção: imagem_url volta SEM o "?v=" que as fotos mais antigas tinham; o conteúdo é o mesmo, só muda o cache.

begin;

-- 1) a cópia em produtos aponta de novo para o original (só onde ela apontava para a versão nova)
update public.produtos p
   set imagem_url = replace(p.imagem_url, i.caminho, i.caminho_original)
  from public.produto_imagens i
 where i.produto_id = p.id
   and i.caminho_original is not null
   and p.imagem_url like '%/' || i.caminho;

-- 2) a linha da foto volta ao original
update public.produto_imagens
   set caminho = caminho_original,
       caminho_original = null
 where caminho_original is not null;

commit;
