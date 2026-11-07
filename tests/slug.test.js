import { describe, expect, it, vi } from 'vitest';

// from().select().eq().eq().maybeSingle() → resposta; guarda os filtros para conferir a consulta
const estado = vi.hoisted(() => ({ resposta: { data: null, error: null }, tabela: null, filtros: [] }));
vi.mock('../lib/supabase.js', () => {
  const cadeia = {
    select: () => cadeia,
    eq: (coluna, valor) => (estado.filtros.push([coluna, valor]), cadeia),
    order: () => cadeia, // ordem das tags embutidas (X13); não é filtro
    maybeSingle: () => Promise.resolve(estado.resposta),
  };
  return { supabase: { from: (t) => ((estado.tabela = t), (estado.filtros = []), cadeia) } };
});

import { getProdutoBySlug, getSlugAtual, slugify, slugValido } from '../lib/produtos.js';

describe('slugValido', () => {
  it.each(['alegria', 'barra-70', 'a', 'a'.repeat(80)])('aceita %s', (s) => {
    expect(slugValido(s)).toBe(true);
  });

  it.each([
    ['vazio', ''],
    ['maiúscula', 'Alegria'],
    ['acento', 'esperança'],
    ['espaço', 'barra 70'],
    ['hífen na ponta', '-alegria'],
    ['hífen no fim', 'alegria-'],
    ['hífen duplo', 'a--b'],
    ['underscore', 'a_b'],
    ['81 caracteres', 'a'.repeat(81)],
    ['não é texto', null],
  ])('recusa %s', (_, s) => {
    expect(slugValido(s)).toBe(false);
  });

  it('tudo que slugify produz de um nome comum é válido', () => {
    expect(slugValido(slugify('  Esperança — Barra 70%  '))).toBe(true);
    expect(slugify('Esperança')).toBe('esperanca');
  });
});

describe('getProdutoBySlug', () => {
  it('consulta produtos ativos pela coluna slug (não pelo nome)', async () => {
    estado.resposta = { data: { id: 1, nome: 'Alegria Nova', slug: 'alegria' }, error: null };
    expect(await getProdutoBySlug('alegria')).toMatchObject({ slug: 'alegria' });
    expect(estado.tabela).toBe('produtos');
    expect(estado.filtros).toEqual([['ativo', true], ['slug', 'alegria']]);
  });

  it('slug desconhecido → null; erro → lança', async () => {
    estado.resposta = { data: null, error: null };
    expect(await getProdutoBySlug('nao-existe')).toBeNull();
    estado.resposta = { data: null, error: new Error('falhou') };
    await expect(getProdutoBySlug('x')).rejects.toThrow('falhou');
  });
});

describe('getSlugAtual', () => {
  it('slug antigo devolve o slug atual do produto ativo', async () => {
    estado.resposta = { data: { produtos: { slug: 'alegria-nova' } }, error: null };
    expect(await getSlugAtual('alegria')).toBe('alegria-nova');
    expect(estado.tabela).toBe('produto_slugs');
    expect(estado.filtros).toEqual([['slug', 'alegria'], ['produtos.ativo', true]]);
  });

  it('slug que nunca existiu (ou de produto inativo) → null; erro → lança', async () => {
    estado.resposta = { data: null, error: null };
    expect(await getSlugAtual('nunca-existiu')).toBeNull();
    estado.resposta = { data: null, error: new Error('falhou') };
    await expect(getSlugAtual('x')).rejects.toThrow('falhou');
  });
});
