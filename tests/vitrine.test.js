import { describe, expect, it, vi } from 'vitest';

// encadeamento falso do supabase-js: registra as chamadas; limit() resolve com a próxima resposta
const estado = vi.hoisted(() => ({ respostas: [], chamadas: [] }));
vi.mock('../lib/supabase.js', () => {
  const cadeia = {};
  for (const m of ['select', 'eq', 'not', 'order']) {
    cadeia[m] = (...args) => (estado.chamadas.push([m, ...args]), cadeia);
  }
  cadeia.limit = () => Promise.resolve(estado.respostas.shift());
  return { supabase: { from: () => cadeia } };
});

import { CRITERIOS_VITRINE, CRITERIO_VITRINE, MAX_VITRINE } from '../lib/vitrine.js';
import { getVitrine } from '../lib/produtos.js';

describe('critério da vitrine', () => {
  it('a ordem é a curadoria da dona (novidade_ordem) e o título é Novidades', () => {
    expect(CRITERIO_VITRINE.coluna).toBe('novidade_ordem');
    expect(CRITERIO_VITRINE.titulo).toBe('Novidades');
    expect(CRITERIOS_VITRINE.recentes).toEqual({ titulo: 'Novidades', coluna: 'created_at' });
    expect(MAX_VITRINE).toBe(8);
  });

  it('cada critério tem o título combinado', () => {
    expect(CRITERIOS_VITRINE.novidades.titulo).toBe('Novidades');
    expect(CRITERIOS_VITRINE.favoritos.titulo).toBe('Favoritos');
    expect(CRITERIOS_VITRINE.maisVendidos.titulo).toBe('Mais vendidos');
  });

  it('nunca "Mais vendidos" ordenado por created_at', () => {
    for (const c of Object.values(CRITERIOS_VITRINE)) {
      if (c.coluna === 'created_at') expect(c.titulo).not.toBe('Mais vendidos');
    }
  });
});

describe('getVitrine', () => {
  it('com produtos curados: só os marcados, em ordem crescente, desempate por created_at', async () => {
    estado.chamadas = [];
    estado.respostas = [{ data: [{ id: 'a' }, { id: 'b' }], error: null }];
    const { titulo, produtos } = await getVitrine();
    expect(titulo).toBe('Novidades');
    expect(produtos).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(estado.chamadas).toContainEqual(['not', 'novidade_ordem', 'is', null]);
    expect(estado.chamadas).toContainEqual(['order', 'novidade_ordem', { ascending: true }]);
    expect(estado.chamadas).toContainEqual(['order', 'created_at', { ascending: false }]);
  });

  it('nada curado: cai nos mais recentes e mantém o título Novidades', async () => {
    estado.chamadas = [];
    estado.respostas = [
      { data: [], error: null },
      { data: [{ id: 'novo' }], error: null },
    ];
    const { titulo, produtos } = await getVitrine();
    expect(titulo).toBe('Novidades');
    expect(produtos).toEqual([{ id: 'novo' }]);
    expect(estado.chamadas.at(-1)).toEqual(['order', 'created_at', { ascending: false }]);
  });

  it('erro do banco lança', async () => {
    estado.respostas = [{ data: null, error: new Error('falhou') }];
    await expect(getVitrine()).rejects.toThrow('falhou');
  });

  it('coluna novidade_ordem ainda inexistente (42703): usa os recentes em vez de quebrar', async () => {
    estado.respostas = [
      { data: null, error: { code: '42703' } },
      { data: [{ id: 'novo' }], error: null },
    ];
    expect((await getVitrine()).produtos).toEqual([{ id: 'novo' }]);
  });
});
