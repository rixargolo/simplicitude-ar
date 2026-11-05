import { supabase } from './supabase';
import { CRITERIO_VITRINE } from './vitrine';

// Normaliza o nome de um produto em slug de URL:
// minúsculas, sem acento, espaços/caracteres especiais viram hífen.
// Ex.: "Esperança" -> "esperanca"
export function slugify(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove marcas de acentuação
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // não-alfanumérico vira hífen
    .replace(/^-+|-+$/g, ''); // remove hífens das pontas
}

// Busca todos os produtos ativos, ordenados por nome. Inclui nome e slug da
// categoria (via join em categoria_id) para rotuloCategoria() e para o filtro da /loja.
export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome, slug)')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Vitrine da home: produtos ativos na ordem do critério (lib/vitrine.js) e o título que
// deriva dele. created_at é desc (mais novo primeiro); destaque_ordem é asc, nulos por último.
export async function getVitrine(criterio = CRITERIO_VITRINE, limite = 8) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .eq('ativo', true)
    .order(criterio.coluna, { ascending: criterio.coluna !== 'created_at', nullsFirst: false })
    .limit(limite);

  if (error) throw error;

  return { titulo: criterio.titulo, produtos: data ?? [] };
}

// Categorias que têm ao menos um produto ativo (chips da vitrine e GradeCategorias →
// /loja?categoria=slug). `total` = nº de produtos ativos. Quando o C2 criar
// categorias.imagem_url, é só incluí-la no select e no map (GradeCategorias já a usa).
export async function getCategoriasComProdutos() {
  const { data, error } = await supabase
    .from('categorias')
    .select('nome, slug, descricao, produtos!inner(id)')
    .eq('produtos.ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(({ nome, slug, descricao, produtos }) => ({
    nome,
    slug,
    descricao,
    total: produtos.length,
  }));
}

// Filtro da /loja (?categoria=slug). `slug` desconhecido, ausente ou repetido
// (?categoria=a&categoria=b chega como array) vira "Todas": { ativa: null, produtos }
// com tudo. `categorias` = getCategoriasComProdutos(), então só categorias com produto ativo.
export function filtrarPorCategoria(produtos, categorias, slug) {
  const ativa = typeof slug === 'string' ? categorias.find((c) => c.slug === slug) ?? null : null;
  if (!ativa) return { ativa: null, produtos };
  return { ativa, produtos: produtos.filter((p) => p.categorias?.slug === ativa.slug) };
}

// Rótulo de categoria a ser exibido antes do nome do produto (ex.:
// "Chocolate"), ou null quando nenhum rótulo deve aparecer. Só exibe algo
// quando o produto tem mostrar_categoria_no_titulo=true e uma categoria
// vinculada — não há mais fallback fixo.
export function rotuloCategoria(produto) {
  if (produto.mostrar_categoria_no_titulo && produto.categoria_id) {
    return produto.categorias?.nome ?? null;
  }
  return null;
}

// Busca um produto ativo cujo nome, ao passar por slugify, bata com `slug`.
// Não há coluna `slug` no banco — o catálogo é pequeno, então filtramos
// em memória sobre o resultado de getProdutos().
export async function getProdutoBySlug(slug) {
  const produtos = await getProdutos();
  return produtos.find((produto) => slugify(produto.nome) === slug) ?? null;
}
