import { createClient } from '@/lib/supabase/server';

// Versões autenticadas das consultas de produtos/coleções para a área
// admin — diferente de lib/produtos.js (cliente anônimo, só ativo=true),
// aqui usamos o cliente com sessão do usuário logado, que enxerga também
// os produtos inativos (necessário para a listagem de gestão).

// Busca todos os produtos (ativos e inativos), ordenados por nome.
export async function getAllProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Busca um único produto pelo id. Retorna null se não existir.
export async function getProdutoById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
}

// Busca todas as coleções, ordenadas por nome.
export async function getColecoes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('colecoes')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Busca todas as categorias, ordenadas por nome.
export async function getCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}
