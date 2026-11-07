import { describe, expect, it, vi } from 'vitest';

// lib/produtos.js importa o client do supabase; aqui só se testa a função pura
vi.mock('../lib/supabase.js', () => ({ supabase: {} }));

import { montarLoja } from '../lib/produtos.js';

const categorias = [
  { id: 'c1', nome: 'Chocolates', slug: 'chocolate', descricao: 'Veganos.', total: 3 },
  { id: 'c2', nome: 'Presentes', slug: 'presentes', descricao: null, total: 1 },
];
const colecoes = [
  { id: 'k1', nome: 'Inspirar', slug: 'inspirar', categoria_id: 'c1', ordem: 1 },
  { id: 'k2', nome: 'Bombons', slug: 'bombons', categoria_id: 'c1', ordem: 2 }, // sem produto
  { id: 'k3', nome: 'Veganos', slug: 'veganos', categoria_id: 'c1', ordem: 3 },
];
const doChoc = { nome: 'Chocolates', slug: 'chocolate' };
const colecao = (...ids) => ids.map((colecao_id) => ({ colecao_id }));
const produtos = [
  { id: 1, nome: 'Alegria', categorias: doChoc, produto_colecoes: colecao('k1') },
  { id: 2, nome: 'Serenidade', categorias: doChoc, produto_colecoes: colecao('k1', 'k3') },
  { id: 3, nome: 'Avulso', categorias: doChoc, produto_colecoes: [] },
  // Presentes, mas na coleção Inspirar (que é de Chocolates), como o Chocobook real
  { id: 4, nome: 'Kit', categorias: { nome: 'Presentes', slug: 'presentes' }, produto_colecoes: colecao('k1') },
  { id: 5, nome: 'Sem categoria', categorias: null, produto_colecoes: [] },
];

const ids = (lista) => lista.produtos.map((p) => p.id);
const loja = (params) => montarLoja(produtos, categorias, colecoes, params);

describe('montarLoja — "Todas"', () => {
  it('uma seção por categoria, na ordem recebida, e uma final para o produto sem categoria', () => {
    const r = loja({});
    expect(r.categoria).toBeNull();
    expect(r.colecao).toBeNull();
    expect(r.secoes.map((s) => s.categoria?.slug ?? null)).toEqual(['chocolate', 'presentes', null]);
    expect(r.grade).toBeNull();
  });

  it('dentro da categoria: um carrossel por coleção (só produtos DA categoria) e o resto no fim', () => {
    const [choc] = loja({}).secoes;
    expect(choc.listas.map((l) => l.colecao?.slug ?? null)).toEqual(['inspirar', 'veganos', null]);
    expect(ids(choc.listas[0])).toEqual([1, 2]); // o Kit (Presentes) não entra na Inspirar de Chocolates
    expect(ids(choc.listas[1])).toEqual([2]);
    expect(ids(choc.listas[2])).toEqual([3]);
  });

  it('um produto aparece em uma só seção', () => {
    const vistos = loja({}).secoes.flatMap((s) => s.listas.flatMap((l) => l.produtos.map((p) => p.id)));
    expect(vistos.filter((id) => id === 4)).toHaveLength(1);
  });

  it('coleção sem produto não vira lista, e o resto vazio não vira lista', () => {
    const soColecao = produtos.filter((p) => p.id !== 3); // sobra produto em coleção, nenhum avulso
    const [choc] = montarLoja(soColecao, categorias, colecoes, {}).secoes;
    expect(choc.listas.map((l) => l.colecao?.slug ?? null)).toEqual(['inspirar', 'veganos']);
  });

  it('categoria sem coleção tem uma lista só (o resto), sem coleção', () => {
    const presentes = loja({}).secoes[1];
    expect(presentes.listas).toHaveLength(1);
    expect(presentes.listas[0].colecao).toBeNull();
    expect(ids(presentes.listas[0])).toEqual([4]);
  });
});

describe('montarLoja — ?categoria=', () => {
  it('slug conhecido mostra só aquela categoria e as coleções dela na 2ª fileira', () => {
    const r = loja({ categoria: 'chocolate' });
    expect(r.categoria).toBe(categorias[0]);
    expect(r.secoes).toHaveLength(1);
    expect(r.colecoesDaCategoria.map((c) => c.slug)).toEqual(['inspirar', 'veganos']); // Bombons não tem produto
    expect(r.grade).toBeNull();
  });

  it('categoria com uma lista só vira grade', () => {
    const r = loja({ categoria: 'presentes' });
    expect(r.grade.map((p) => p.id)).toEqual([4]);
    expect(r.colecoesDaCategoria).toEqual([]);
  });

  it.each([['desconhecido', 'xyz'], ['ausente', undefined], ['repetido', ['chocolate', 'presentes']], ['vazio', '']])(
    'slug %s vira "Todas"',
    (_, slug) => {
      const r = loja({ categoria: slug });
      expect(r.categoria).toBeNull();
      expect(r.secoes).toHaveLength(3);
    },
  );
});

describe('montarLoja — ?colecao=', () => {
  it('mostra todos os produtos da coleção (inclusive de outra categoria), em grade, e ativa a categoria dela', () => {
    const r = loja({ colecao: 'inspirar' });
    expect(r.colecao).toBe(colecoes[0]);
    expect(r.categoria).toBe(categorias[0]);
    expect(r.grade.map((p) => p.id)).toEqual([1, 2, 4]);
    expect(r.secoes).toEqual([]);
  });

  it('vence ?categoria=', () => {
    const r = loja({ colecao: 'veganos', categoria: 'presentes' });
    expect(r.colecao.slug).toBe('veganos');
    expect(r.categoria.slug).toBe('chocolate');
  });

  it.each([['sem produto', 'bombons'], ['desconhecida', 'xyz'], ['repetida', ['inspirar', 'veganos']], ['vazia', '']])(
    'coleção %s é ignorada (cai na categoria ou em "Todas")',
    (_, slug) => {
      expect(loja({ colecao: slug }).colecao).toBeNull();
      expect(loja({ colecao: slug, categoria: 'presentes' }).categoria.slug).toBe('presentes');
      expect(loja({ colecao: slug }).secoes).toHaveLength(3);
    },
  );
});

describe('montarLoja — sem produtos', () => {
  it('devolve grade vazia (a página mostra o estado vazio)', () => {
    const r = montarLoja([], [], [], {});
    expect(r.secoes).toEqual([]);
    expect(r.grade).toEqual([]);
  });
});
