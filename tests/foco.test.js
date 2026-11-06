import { describe, expect, it } from 'vitest';
import { estiloFoto, focoParaCss, normalizarFoco, normalizarZoom } from '../lib/foco.js';

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

describe('normalizarZoom', () => {
  it('mantém inteiros de 100 a 200, inclusive os limites', () => {
    expect(normalizarZoom(100)).toBe(100);
    expect(normalizarZoom(150)).toBe(150);
    expect(normalizarZoom(200)).toBe(200);
  });

  it('limita fora da faixa (nunca abaixo de 100, para não sobrar vazio)', () => {
    expect(normalizarZoom(50)).toBe(100);
    expect(normalizarZoom(0)).toBe(100);
    expect(normalizarZoom(-10)).toBe(100);
    expect(normalizarZoom(500)).toBe(200);
  });

  it('arredonda decimais e aceita número em texto', () => {
    expect(normalizarZoom(149.6)).toBe(150);
    expect(normalizarZoom('120')).toBe(120);
  });

  it.each([[null], [undefined], [NaN], [''], ['abc']])('%s vira 100', (v) => {
    expect(normalizarZoom(v)).toBe(100);
  });
});

describe('estiloFoto', () => {
  it('sem zoom só posiciona (sem transform)', () => {
    expect(estiloFoto(30, 70, 100)).toEqual({ objectPosition: '30% 70%' });
    expect(estiloFoto(30, 70)).toEqual({ objectPosition: '30% 70%' });
    expect(estiloFoto(30, 70, null)).toEqual({ objectPosition: '30% 70%' });
  });

  it('com zoom, escala com a origem no ponto de foco', () => {
    expect(estiloFoto(30, 70, 150)).toEqual({
      objectPosition: '30% 70%',
      transformOrigin: '30% 70%',
      transform: 'scale(1.5)',
    });
  });

  it('valores inválidos caem no padrão (centro, sem zoom)', () => {
    expect(estiloFoto(NaN, 'x', 'y')).toEqual({ objectPosition: '50% 50%' });
    expect(estiloFoto(-5, 140, 900)).toEqual({
      objectPosition: '0% 100%',
      transformOrigin: '0% 100%',
      transform: 'scale(2)',
    });
  });
});
