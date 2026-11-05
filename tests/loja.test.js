import { describe, expect, it, vi } from 'vitest';

// lib/produtos.js importa o client do supabase; aqui só se testa a função pura
vi.mock('../lib/supabase.js', () => ({ supabase: {} }));

import { filtrarPorCategoria } from '../lib/produtos.js';

const categorias = [
  { nome: 'Chocolates', slug: 'chocolate', descricao: 'Veganos.', total: 2 },
  { nome: 'Presentes', slug: 'presentes', descricao: null, total: 1 },
];
const produtos = [
  { id: 1, nome: 'Alegria', categorias: { nome: 'Chocolates', slug: 'chocolate' } },
  { id: 2, nome: 'Serenidade', categorias: { nome: 'Chocolates', slug: 'chocolate' } },
  { id: 3, nome: 'Kit', categorias: { nome: 'Presentes', slug: 'presentes' } },
  { id: 4, nome: 'Sem categoria', categorias: null },
];

describe('filtrarPorCategoria', () => {
  it('slug conhecido filtra e devolve a categoria ativa', () => {
    const r = filtrarPorCategoria(produtos, categorias, 'chocolate');
    expect(r.ativa).toBe(categorias[0]);
    expect(r.produtos.map((p) => p.id)).toEqual([1, 2]);
  });

  it.each([['desconhecido', 'xyz'], ['ausente', undefined], ['repetido', ['chocolate', 'presentes']], ['vazio', '']])(
    'slug %s vira "Todas" (sem categoria ativa, todos os produtos)',
    (_, slug) => {
      const r = filtrarPorCategoria(produtos, categorias, slug);
      expect(r.ativa).toBeNull();
      expect(r.produtos).toHaveLength(4);
    },
  );

  it('categoria sem produto ativo (fora da lista) também vira "Todas"', () => {
    expect(filtrarPorCategoria(produtos, categorias, 'embalagens').ativa).toBeNull();
  });
});
