-- Produtos de TESTE para ver a /loja populada (X14). NÃO é migration: roda no SQL Editor do Supabase.
-- Marcador: slug começando com "teste-" (produtos e tags novas). Reexecutável: limpa os de teste e recria.
-- Fotos: arquivos em public/teste/ (caminho local em produto_imagens.caminho e produtos.imagem_url), nada no Storage.
-- ATENÇÃO: v1 e main leem o mesmo banco; a produção mostra estes produtos (sem foto) até a remoção.
-- Remover: supabase/scripts/teste_remover_produtos.sql e apagar a pasta public/teste/ (item do D2).
-- Gerado a partir de uma lista só; 22 produtos em Chocolates, Presentes, Empório e Dia-a-Dia, coleções Inspirar e Bombons.

begin;

delete from public.estoque_movimentacoes where produto_id in (select id from public.produtos where slug like 'teste-%');
delete from public.produtos where slug like 'teste-%';
delete from public.tags where slug like 'teste-%';

insert into public.tags (nome, slug) values
  ('Sem glúten', 'teste-sem-gluten'),
  ('Sem lactose', 'teste-sem-lactose'),
  ('Agrofloresta', 'teste-agrofloresta'),
  ('Artesanal', 'teste-artesanal'),
  ('Para presentear', 'teste-para-presentear');

insert into public.produtos
  (nome, slug, descricao, descricao_curta, ingredientes, peso_gramas, preco_centavos, estoque,
   categoria_id, colecao_id, ativo, tem_meditacao, mostrar_categoria_no_titulo, imagem_url)
select v.nome, v.slug, v.descricao, v.curta, v.ingredientes, v.peso, v.preco, v.estoque::int,
       (select id from public.categorias where slug = v.cat),
       (select id from public.colecoes where slug = v.col),
       true, false, true, '/teste/' || v.slug || '-1.webp'
from (values
  ('teste-barra-cacau-70-80g', 'Barra 70% Cacau 80g', 'Barra de chocolate 70% cacau, vegana e sem lactose.
Cada quadradinho pede um momento de pausa.', 'Intensa e equilibrada, feita com cacau de agrofloresta do Sul da Bahia.', 'Cacau, açúcar de coco, manteiga de cacau.', 80, 2400, 32, 'chocolates', 'inspirar'),
  ('teste-barra-nibs-80g', 'Barra com Nibs de Cacau 80g', 'Textura crocante e sabor profundo de cacau.
Sem lactose, sem glúten e vegana.', 'Chocolate 60% com nibs crocantes de cacau.', 'Cacau, açúcar de coco, manteiga de cacau, nibs de cacau.', 80, 2600, 25, 'chocolates', 'inspirar'),
  ('teste-bombom-cupuacu-cx6', 'Bombons de Cupuaçu (cx com 6)', 'Seis bombons artesanais com recheio de cupuaçu.
Feitos em pequenos lotes.', 'Recheio cremoso de cupuaçu em casquinha de chocolate.', 'Cacau, polpa de cupuaçu, açúcar de coco, manteiga de cacau.', 90, 3600, 18, 'chocolates', 'bombons'),
  ('teste-bombom-cafe-cx6', 'Bombons de Café (cx com 6)', 'Seis bombons artesanais com ganache de café.', 'Ganache de café sobre chocolate meio amargo.', 'Cacau, café, açúcar de coco, manteiga de cacau.', 90, 3600, 14, 'chocolates', 'bombons'),
  ('teste-bombom-gengibre-cx6', 'Bombons de Gengibre (cx com 6)', 'Seis bombons artesanais com recheio de gengibre.
Esgotado de propósito, para testar o selo.', 'Picância suave de gengibre com chocolate escuro.', 'Cacau, gengibre, açúcar de coco, manteiga de cacau.', 90, 3800, 0, 'chocolates', 'bombons'),
  ('teste-caixa-bombons-inspirar-12', 'Caixa de Bombons Inspirar (12 un.)', 'Caixa com sabores sortidos da casa.
Produto em duas coleções, Inspirar e Bombons.', 'Doze bombons sortidos para saborear com calma.', 'Cacau, frutas, café, gengibre, açúcar de coco, manteiga de cacau.', 180, 6400, 12, 'chocolates', 'inspirar'),
  ('teste-trufa-inspirar-3un', 'Trufas Inspirar (3 un.)', 'Trufas veganas de chocolate meio amargo.
Produto em duas coleções.', 'Três trufas cremosas, uma para cada respiração.', 'Cacau, creme de castanhas, açúcar de coco.', 60, 2200, 30, 'chocolates', 'inspirar'),
  ('teste-barra-amendoas-80g', 'Barra com Amêndoas 80g', 'Sem coleção, para aparecer em "Mais Chocolates".', 'Chocolate ao estilo ao leite, vegano, com amêndoas inteiras.', 'Cacau, amêndoas, açúcar de coco, manteiga de cacau.', 80, 2800, 22, 'chocolates', null),
  ('teste-chocolate-em-po-200g', 'Chocolate em Pó 50% 200g', 'Chocolate em pó 50% cacau.
Sem coleção.', 'Para chocolate quente cremoso ou receitas.', 'Cacau em pó, açúcar de coco.', 200, 3200, 40, 'chocolates', null),
  ('teste-barra-laranja-80g', 'Barra com Laranja 80g', 'Estoque não controlado (null), não deve aparecer como esgotado.', 'Casca de laranja cristalizada em chocolate 60%.', 'Cacau, laranja, açúcar de coco, manteiga de cacau.', 80, 2600, null, 'chocolates', null),
  ('teste-kit-degustacao', 'Kit Degustação (4 barras)', 'Kit com quatro sabores de barra, em caixa presenteável.
Categoria Presentes, coleção de Chocolates.', 'Quatro barras para conhecer a casa.', 'Cacau, açúcar de coco, manteiga de cacau, nibs, amêndoas, laranja.', 320, 8900, 15, 'presentes', 'bombons'),
  ('teste-kit-presente-inspirar', 'Kit Presente Inspirar', 'Kit maior, em duas coleções.
Um presente que cuida de quem recebe.', 'Chocolates, bombons e uma meditação para presentear.', 'Cacau, açúcar de coco, manteiga de cacau, frutas.', 400, 12000, 9, 'presentes', 'inspirar'),
  ('teste-cesta-da-floresta', 'Cesta da Floresta', 'Cesta farta com itens do Empório e do chocolate.
Sem coleção.', 'Chocolates, chá, biscoitos e geleia numa cesta.', 'Ver rótulo de cada item.', 900, 18900, 6, 'presentes', null),
  ('teste-kit-cha-e-chocolate', 'Kit Chá e Chocolate', 'Kit pequeno, sem coleção.', 'Chá de casca de cacau e uma barra para a tarde.', 'Casca de cacau, cacau, açúcar de coco, manteiga de cacau.', 250, 7400, 17, 'presentes', null),
  ('teste-nibs-de-cacau-100g', 'Nibs de Cacau 100g', 'Nibs de cacau torrado.', 'Cacau puro em pedacinhos, para granola, iogurte e receitas.', 'Cacau.', 100, 2200, 28, 'emporio', null),
  ('teste-cha-de-casca-de-cacau-30g', 'Chá de Casca de Cacau 30g', 'Aproveita a casca que sobra da fábrica.', 'Aroma achocolatado, sem amargor, feito da casca do cacau.', 'Casca de cacau.', 30, 1800, 35, 'emporio', null),
  ('teste-biscoito-de-cacau-150g', 'Biscoito de Cacau 150g', 'Feito em pequenos lotes.', 'Biscoito artesanal, crocante, com gotas de chocolate.', 'Farinha de trigo, cacau, açúcar de coco, óleo de coco.', 150, 1600, 20, 'emporio', null),
  ('teste-geleia-de-cacau-200g', 'Geleia da Polpa do Cacau 200g', 'Geleia artesanal da polpa do cacau.', 'Doce e levemente ácida, da polpa do fruto do cacau.', 'Polpa de cacau, açúcar.', 200, 2400, 11, 'emporio', null),
  ('teste-sabonete-de-cacau-90g', 'Sabonete de Cacau 90g', 'Hidrata e perfuma de leve.', 'Sabonete artesanal com manteiga de cacau.', null, 90, 2800, 26, 'dia-a-dia', null),
  ('teste-vela-aromatica-cacau', 'Vela Aromática de Cacau', 'Cerca de 30 horas de queima.', 'Cera vegetal com aroma de cacau torrado.', null, 180, 4200, 13, 'dia-a-dia', null),
  ('teste-manteiga-de-cacau-60g', 'Manteiga de Cacau Hidratante 60g', 'Textura firme que derrete na pele.', 'Hidratante para mãos e lábios, com manteiga de cacau pura.', null, 60, 3800, 19, 'dia-a-dia', null),
  ('teste-ecobag-simplicitude', 'Ecobag Simplicitude', 'Ecobag de algodão estampada à mão.', 'Algodão cru, para levar a floresta por aí.', null, 120, 4500, 31, 'dia-a-dia', null)
) as v(slug, nome, descricao, curta, ingredientes, peso, preco, estoque, cat, col);

-- coleções extras (a 1ª já entra pelo trigger de produtos.colecao_id; on conflict cobre as duas)
insert into public.produto_colecoes (produto_id, colecao_id)
select p.id, c.id
from (values
  ('teste-barra-cacau-70-80g', 'inspirar'),
  ('teste-barra-nibs-80g', 'inspirar'),
  ('teste-bombom-cupuacu-cx6', 'bombons'),
  ('teste-bombom-cafe-cx6', 'bombons'),
  ('teste-bombom-gengibre-cx6', 'bombons'),
  ('teste-caixa-bombons-inspirar-12', 'inspirar'),
  ('teste-caixa-bombons-inspirar-12', 'bombons'),
  ('teste-trufa-inspirar-3un', 'inspirar'),
  ('teste-trufa-inspirar-3un', 'bombons'),
  ('teste-kit-degustacao', 'bombons'),
  ('teste-kit-presente-inspirar', 'inspirar'),
  ('teste-kit-presente-inspirar', 'bombons')
) as v(slug, col)
join public.produtos p on p.slug = v.slug
join public.colecoes c on c.slug = v.col
on conflict do nothing;

insert into public.produto_imagens (produto_id, caminho, ordem)
select p.id, v.caminho, v.ordem
from (values
  ('teste-barra-cacau-70-80g', '/teste/teste-barra-cacau-70-80g-1.webp', 0),
  ('teste-barra-cacau-70-80g', '/teste/teste-barra-cacau-70-80g-2.webp', 1),
  ('teste-barra-nibs-80g', '/teste/teste-barra-nibs-80g-1.webp', 0),
  ('teste-bombom-cupuacu-cx6', '/teste/teste-bombom-cupuacu-cx6-1.webp', 0),
  ('teste-bombom-cupuacu-cx6', '/teste/teste-bombom-cupuacu-cx6-2.webp', 1),
  ('teste-bombom-cafe-cx6', '/teste/teste-bombom-cafe-cx6-1.webp', 0),
  ('teste-bombom-gengibre-cx6', '/teste/teste-bombom-gengibre-cx6-1.webp', 0),
  ('teste-bombom-gengibre-cx6', '/teste/teste-bombom-gengibre-cx6-2.webp', 1),
  ('teste-caixa-bombons-inspirar-12', '/teste/teste-caixa-bombons-inspirar-12-1.webp', 0),
  ('teste-trufa-inspirar-3un', '/teste/teste-trufa-inspirar-3un-1.webp', 0),
  ('teste-trufa-inspirar-3un', '/teste/teste-trufa-inspirar-3un-2.webp', 1),
  ('teste-barra-amendoas-80g', '/teste/teste-barra-amendoas-80g-1.webp', 0),
  ('teste-chocolate-em-po-200g', '/teste/teste-chocolate-em-po-200g-1.webp', 0),
  ('teste-chocolate-em-po-200g', '/teste/teste-chocolate-em-po-200g-2.webp', 1),
  ('teste-barra-laranja-80g', '/teste/teste-barra-laranja-80g-1.webp', 0),
  ('teste-kit-degustacao', '/teste/teste-kit-degustacao-1.webp', 0),
  ('teste-kit-degustacao', '/teste/teste-kit-degustacao-2.webp', 1),
  ('teste-kit-presente-inspirar', '/teste/teste-kit-presente-inspirar-1.webp', 0),
  ('teste-cesta-da-floresta', '/teste/teste-cesta-da-floresta-1.webp', 0),
  ('teste-cesta-da-floresta', '/teste/teste-cesta-da-floresta-2.webp', 1),
  ('teste-kit-cha-e-chocolate', '/teste/teste-kit-cha-e-chocolate-1.webp', 0),
  ('teste-nibs-de-cacau-100g', '/teste/teste-nibs-de-cacau-100g-1.webp', 0),
  ('teste-nibs-de-cacau-100g', '/teste/teste-nibs-de-cacau-100g-2.webp', 1),
  ('teste-cha-de-casca-de-cacau-30g', '/teste/teste-cha-de-casca-de-cacau-30g-1.webp', 0),
  ('teste-biscoito-de-cacau-150g', '/teste/teste-biscoito-de-cacau-150g-1.webp', 0),
  ('teste-biscoito-de-cacau-150g', '/teste/teste-biscoito-de-cacau-150g-2.webp', 1),
  ('teste-geleia-de-cacau-200g', '/teste/teste-geleia-de-cacau-200g-1.webp', 0),
  ('teste-sabonete-de-cacau-90g', '/teste/teste-sabonete-de-cacau-90g-1.webp', 0),
  ('teste-sabonete-de-cacau-90g', '/teste/teste-sabonete-de-cacau-90g-2.webp', 1),
  ('teste-vela-aromatica-cacau', '/teste/teste-vela-aromatica-cacau-1.webp', 0),
  ('teste-manteiga-de-cacau-60g', '/teste/teste-manteiga-de-cacau-60g-1.webp', 0),
  ('teste-manteiga-de-cacau-60g', '/teste/teste-manteiga-de-cacau-60g-2.webp', 1),
  ('teste-ecobag-simplicitude', '/teste/teste-ecobag-simplicitude-1.webp', 0)
) as v(slug, caminho, ordem)
join public.produtos p on p.slug = v.slug;

insert into public.produto_tags (produto_id, tag_id)
select p.id, t.id
from (values
  ('teste-barra-cacau-70-80g', 'vegano'),
  ('teste-barra-cacau-70-80g', 'teste-sem-gluten'),
  ('teste-barra-cacau-70-80g', 'teste-sem-lactose'),
  ('teste-barra-cacau-70-80g', 'teste-agrofloresta'),
  ('teste-barra-nibs-80g', 'vegano'),
  ('teste-barra-nibs-80g', 'teste-sem-gluten'),
  ('teste-barra-nibs-80g', 'teste-sem-lactose'),
  ('teste-bombom-cupuacu-cx6', 'vegano'),
  ('teste-bombom-cupuacu-cx6', 'teste-sem-gluten'),
  ('teste-bombom-cupuacu-cx6', 'teste-sem-lactose'),
  ('teste-bombom-cupuacu-cx6', 'teste-artesanal'),
  ('teste-bombom-cafe-cx6', 'vegano'),
  ('teste-bombom-cafe-cx6', 'teste-sem-gluten'),
  ('teste-bombom-cafe-cx6', 'teste-sem-lactose'),
  ('teste-bombom-cafe-cx6', 'teste-artesanal'),
  ('teste-bombom-gengibre-cx6', 'vegano'),
  ('teste-bombom-gengibre-cx6', 'teste-sem-gluten'),
  ('teste-bombom-gengibre-cx6', 'teste-sem-lactose'),
  ('teste-bombom-gengibre-cx6', 'teste-artesanal'),
  ('teste-caixa-bombons-inspirar-12', 'vegano'),
  ('teste-caixa-bombons-inspirar-12', 'teste-sem-gluten'),
  ('teste-caixa-bombons-inspirar-12', 'teste-sem-lactose'),
  ('teste-caixa-bombons-inspirar-12', 'teste-para-presentear'),
  ('teste-trufa-inspirar-3un', 'vegano'),
  ('teste-trufa-inspirar-3un', 'teste-sem-gluten'),
  ('teste-trufa-inspirar-3un', 'teste-sem-lactose'),
  ('teste-barra-amendoas-80g', 'vegano'),
  ('teste-barra-amendoas-80g', 'teste-sem-gluten'),
  ('teste-barra-amendoas-80g', 'teste-sem-lactose'),
  ('teste-chocolate-em-po-200g', 'vegano'),
  ('teste-chocolate-em-po-200g', 'teste-sem-gluten'),
  ('teste-barra-laranja-80g', 'vegano'),
  ('teste-barra-laranja-80g', 'teste-sem-gluten'),
  ('teste-barra-laranja-80g', 'teste-sem-lactose'),
  ('teste-kit-degustacao', 'vegano'),
  ('teste-kit-degustacao', 'teste-sem-gluten'),
  ('teste-kit-degustacao', 'teste-sem-lactose'),
  ('teste-kit-degustacao', 'teste-para-presentear'),
  ('teste-kit-presente-inspirar', 'vegano'),
  ('teste-kit-presente-inspirar', 'teste-para-presentear'),
  ('teste-cesta-da-floresta', 'teste-artesanal'),
  ('teste-cesta-da-floresta', 'teste-para-presentear'),
  ('teste-kit-cha-e-chocolate', 'vegano'),
  ('teste-kit-cha-e-chocolate', 'teste-para-presentear'),
  ('teste-nibs-de-cacau-100g', 'vegano'),
  ('teste-nibs-de-cacau-100g', 'teste-sem-gluten'),
  ('teste-nibs-de-cacau-100g', 'teste-agrofloresta'),
  ('teste-cha-de-casca-de-cacau-30g', 'vegano'),
  ('teste-cha-de-casca-de-cacau-30g', 'teste-sem-gluten'),
  ('teste-cha-de-casca-de-cacau-30g', 'teste-agrofloresta'),
  ('teste-biscoito-de-cacau-150g', 'vegano'),
  ('teste-biscoito-de-cacau-150g', 'teste-artesanal'),
  ('teste-geleia-de-cacau-200g', 'vegano'),
  ('teste-geleia-de-cacau-200g', 'teste-sem-gluten'),
  ('teste-geleia-de-cacau-200g', 'teste-artesanal'),
  ('teste-sabonete-de-cacau-90g', 'vegano'),
  ('teste-sabonete-de-cacau-90g', 'teste-artesanal'),
  ('teste-vela-aromatica-cacau', 'teste-artesanal'),
  ('teste-manteiga-de-cacau-60g', 'vegano'),
  ('teste-manteiga-de-cacau-60g', 'teste-agrofloresta'),
  ('teste-ecobag-simplicitude', 'teste-artesanal')
) as v(slug, tag)
join public.produtos p on p.slug = v.slug
join public.tags t on t.slug = v.tag
on conflict do nothing;

commit;

-- Conferência: produtos de teste por categoria e coleção
select c.nome as categoria, coalesce(co.nome, '(sem coleção)') as colecao, count(*) as produtos
from public.produtos p
join public.categorias c on c.id = p.categoria_id
left join public.produto_colecoes pc on pc.produto_id = p.id
left join public.colecoes co on co.id = pc.colecao_id
where p.slug like 'teste-%'
group by 1, 2 order by 1, 2;
