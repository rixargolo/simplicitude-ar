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

// Busca todos os produtos ativos, ordenados por nome.
export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Busca um produto ativo cujo nome, ao passar por slugify, bata com `slug`.
// Não há coluna `slug` no banco — o catálogo é pequeno, então filtramos
// em memória sobre o resultado de getProdutos().
export async function getProdutoBySlug(slug) {
  const produtos = await getProdutos();
  return produtos.find((produto) => slugify(produto.nome) === slug) ?? null;
}
