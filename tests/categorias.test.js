import { describe, expect, it, vi } from 'vitest';

// encadeamento falso do supabase-js: from().select().eq().order() → { data, error }
// `respostas` é consumida uma por chamada (a última se repete); `selects` guarda as colunas pedidas.
const mock = vi.hoisted(() => ({ respostas: [], selects: [] }));
vi.mock('../lib/supabase.js', () => {
  const cadeia = {
    select: (colunas) => (mock.selects.push(colunas), cadeia),
    eq: () => cadeia,
    order: () => Promise.resolve(mock.respostas.length > 1 ? mock.respostas.shift() : mock.respostas[0]),
  };
  return { supabase: { from: () => cadeia } };
});

import { getCategoriasComProdutos } from '../lib/produtos.js';

function responder(...respostas) {
  mock.respostas = respostas;
  mock.selects = [];
}

describe('getCategoriasComProdutos', () => {
  it('devolve nome, slug, descrição, foto com enquadramento e o total de produtos, sem vazar a lista de produtos', async () => {
    const foto = { imagem_url: 'https://x/a.jpg', imagem_foco_x: 30, imagem_foco_y: 70, imagem_zoom: 120 };
    responder({
      data: [
        { nome: 'Chocolates', slug: 'chocolate', descricao: 'Veganos.', ...foto, produtos: [{ id: 1 }, { id: 2 }, { id: 3 }] },
        { nome: 'Presentes', slug: 'presentes', descricao: null, imagem_url: null, produtos: [{ id: 4 }] },
      ],
      error: null,
    });
    expect(await getCategoriasComProdutos()).toEqual([
      { nome: 'Chocolates', slug: 'chocolate', descricao: 'Veganos.', ...foto, total: 3 },
      { nome: 'Presentes', slug: 'presentes', descricao: null, imagem_url: null, total: 1 },
    ]);
    expect(mock.selects[0]).toContain('imagem_url');
  });

  it('coluna da foto inexistente (SQL do X7 não aplicado): refaz a consulta sem a foto', async () => {
    responder(
      { data: null, error: { code: '42703' } },
      { data: [{ nome: 'Presentes', slug: 'presentes', descricao: null, produtos: [{ id: 4 }] }], error: null },
    );
    expect(await getCategoriasComProdutos()).toEqual([
      { nome: 'Presentes', slug: 'presentes', descricao: null, total: 1 },
    ]);
    expect(mock.selects).toHaveLength(2);
    expect(mock.selects[1]).not.toContain('imagem_url');
  });

  it('sem dados devolve lista vazia; com outro erro, lança', async () => {
    responder({ data: null, error: null });
    expect(await getCategoriasComProdutos()).toEqual([]);
    responder({ data: null, error: new Error('falhou') });
    await expect(getCategoriasComProdutos()).rejects.toThrow('falhou');
  });
});
