import { describe, expect, it, vi } from 'vitest';

// encadeamento falso do supabase-js: from().select().eq().order() → { data, error }
const resposta = vi.hoisted(() => ({ data: null, error: null }));
vi.mock('../lib/supabase.js', () => {
  const cadeia = { select: () => cadeia, eq: () => cadeia, order: () => Promise.resolve(resposta) };
  return { supabase: { from: () => cadeia } };
});

import { getCategoriasComProdutos } from '../lib/produtos.js';

describe('getCategoriasComProdutos', () => {
  it('devolve nome, slug, descrição e o total de produtos, sem vazar a lista de produtos', async () => {
    resposta.data = [
      { nome: 'Chocolates', slug: 'chocolate', descricao: 'Veganos.', produtos: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      { nome: 'Presentes', slug: 'presentes', descricao: null, produtos: [{ id: 4 }] },
    ];
    expect(await getCategoriasComProdutos()).toEqual([
      { nome: 'Chocolates', slug: 'chocolate', descricao: 'Veganos.', total: 3 },
      { nome: 'Presentes', slug: 'presentes', descricao: null, total: 1 },
    ]);
  });

  it('sem dados devolve lista vazia; com erro, lança', async () => {
    resposta.data = null;
    expect(await getCategoriasComProdutos()).toEqual([]);
    resposta.error = new Error('falhou');
    await expect(getCategoriasComProdutos()).rejects.toThrow('falhou');
    resposta.error = null;
  });
});
