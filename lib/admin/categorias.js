import { createClient } from '@/lib/supabase/server';

// Versões autenticadas das consultas de categorias para a área admin —
// mesmo padrão de lib/admin/produtos.js.

// Busca todas as categorias, ordenadas por nome.
export async function getAllCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Busca uma única categoria pelo id. Retorna null se não existir.
export async function getCategoriaById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
}
