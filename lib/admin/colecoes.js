import { createClient } from '@/lib/supabase/server';

// Consultas autenticadas de coleções para a área admin (X12). Coleção pertence a uma categoria.

// Todas as coleções, na ordem do admin: `ordem` (null por último) e nome. `colecao_traducoes(idioma)` só
// serve ao selo "EN ✓"; `categorias(nome)` agrupa a lista e o seletor do produto.
export async function getColecoes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('colecoes')
    .select('*, categorias(nome), colecao_traducoes(idioma)')
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Uma coleção pelo id, com a tradução completa. Null se não existir.
export async function getColecaoById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('colecoes')
    .select('*, colecao_traducoes(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
}
