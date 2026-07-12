import { createClient } from '@/lib/supabase/server';

// Camada de leitura da área admin de estoque. Segue o mesmo padrão de
// lib/admin/produtos.js: cliente com sessão do usuário logado (enxerga
// também produtos inativos), sempre `throw error` em caso de falha.
//
// A escrita (INSERT em estoque_movimentacoes) fica no client component do
// formulário (MovimentacaoForm) — esta camada só lê. A aplicação nunca faz
// UPDATE em produtos.estoque; isso é responsabilidade exclusiva da trigger
// `calcular_estoque_movimentacao` no banco.

// Busca todos os produtos (ativos e inativos) com seu estoque atual, já
// acompanhados do nome da coleção para exibição na listagem.
export async function getProdutosComEstoque() {
  const supabase = await createClient();

  const [produtosRes, colecoesRes] = await Promise.all([
    supabase.from('produtos').select('*').order('nome', { ascending: true }),
    supabase.from('colecoes').select('*').order('nome', { ascending: true }),
  ]);

  if (produtosRes.error) throw produtosRes.error;
  if (colecoesRes.error) throw colecoesRes.error;

  return {
    produtos: produtosRes.data ?? [],
    colecoes: colecoesRes.data ?? [],
  };
}

// Busca o histórico de movimentações de estoque, mais recente primeiro,
// já acompanhado do nome do produto.
export async function getMovimentacoes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estoque_movimentacoes')
    .select('*, produtos(nome)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  return data ?? [];
}
