import { describe, expect, it } from 'vitest';
import { CRITERIOS_VITRINE, CRITERIO_VITRINE } from '../lib/vitrine.js';

describe('critério da vitrine', () => {
  it('hoje a ordem é created_at e o título é Novidades', () => {
    expect(CRITERIO_VITRINE.coluna).toBe('created_at');
    expect(CRITERIO_VITRINE.titulo).toBe('Novidades');
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
