import { createClient } from '@/lib/supabase/server';

// Consultas autenticadas de tags para a área admin (X13).

// Todas as tags por nome. `tag_traducoes(idioma)` só serve ao selo "EN ✓".
export async function getTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tags')
    .select('*, tag_traducoes(idioma)')
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Uma tag pelo id, com a tradução completa. Null se não existir.
export async function getTagById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tags')
    .select('*, tag_traducoes(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
}
