import { supabase } from './supabase';

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

// Busca todos os produtos ativos, ordenados por nome. Inclui o nome da
// categoria (via join em categoria_id) para uso em rotuloCategoria().
export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Busca os produtos ativos mais recentemente cadastrados (created_at desc),
// limitados a `limite`. Usado na vitrine de produtos da home.
export async function getProdutosRecentes(limite = 8) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) throw error;

  return data ?? [];
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
