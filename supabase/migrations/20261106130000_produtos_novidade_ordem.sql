-- X6: curadoria manual da vitrine "Novidades" da home.
-- Acrescenta produtos.novidade_ordem (posição na vitrine; 1 = primeiro; null = fora da vitrine).
-- Seguro para a main: coluna nullable, sem default; a main lê com select('*') e grava payload explícito.
-- Sem unique (trocar posições esbarraria nele); empate resolvido por created_at desc no código.
-- Não muda RLS: valem as policies atuais de produtos.
-- Fatia X6. Já aplicado em produção em 2026-11-06. Reexecutável.

alter table public.produtos
  add column if not exists novidade_ordem smallint check (novidade_ordem > 0);

comment on column public.produtos.novidade_ordem is
  'X6: posição na vitrine Novidades da home (1 = primeiro). null = fora da vitrine.';
