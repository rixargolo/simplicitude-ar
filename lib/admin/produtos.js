import { createClient } from '@/lib/supabase/server';

// Versões autenticadas das consultas de produtos/categorias para a área
// admin (coleções: lib/admin/colecoes.js) — diferente de lib/produtos.js (cliente anônimo, só ativo=true),
// aqui usamos o cliente com sessão do usuário logado, que enxerga também
// os produtos inativos (necessário para a listagem de gestão).

// Busca todos os produtos (ativos e inativos), ordenados por nome.
export async function getAllProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*, produto_colecoes(colecao_id)')
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Busca um único produto pelo id, com as fotos (produto_imagens, X1). Retorna null se não existir.
export async function getProdutoById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*, produto_imagens(*), produto_colecoes(colecao_id)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
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
