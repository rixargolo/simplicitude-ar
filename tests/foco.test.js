import { describe, expect, it } from 'vitest';
import { focoParaCss, normalizarFoco } from '../lib/foco.js';

describe('normalizarFoco', () => {
  it('mantém inteiros dentro de 0–100, inclusive os limites', () => {
    expect(normalizarFoco(0)).toBe(0);
    expect(normalizarFoco(37)).toBe(37);
    expect(normalizarFoco(100)).toBe(100);
  });

  it('limita valores fora da faixa', () => {
    expect(normalizarFoco(-20)).toBe(0);
    expect(normalizarFoco(250)).toBe(100);
    expect(normalizarFoco(Infinity)).toBe(100);
    expect(normalizarFoco(-Infinity)).toBe(0);
  });

  it('arredonda decimais e aceita número em texto', () => {
    expect(normalizarFoco(33.6)).toBe(34);
    expect(normalizarFoco('30')).toBe(30);
  });

  it.each([[null], [undefined], [NaN], [''], ['abc'], [{}]])('%s vira o centro (50)', (v) => {
    expect(normalizarFoco(v)).toBe(50);
  });
});

describe('focoParaCss', () => {
  it('monta o object-position com os dois eixos normalizados', () => {
    expect(focoParaCss(30, 70)).toBe('30% 70%');
    expect(focoParaCss(-5, 140)).toBe('0% 100%');
  });

  it('sem foco (produto antigo ou nulo) fica centralizado', () => {
    expect(focoParaCss()).toBe('50% 50%');
    expect(focoParaCss(null, NaN)).toBe('50% 50%');
  });
});
