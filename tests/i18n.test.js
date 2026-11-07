import { describe, expect, it } from 'vitest';
import { acaoTraducao, traduzir } from '../lib/i18n.js';

const cat = { id: 'c1', nome: 'Chocolates', descricao: 'Barras artesanais', slug: 'chocolates' };

describe('traduzir', () => {
  it('pt devolve o registro intacto', () => {
    const t = { categoria_id: 'c1', idioma: 'en', nome: 'Chocolate' };
    expect(traduzir(cat, t, 'pt')).toBe(cat);
  });

  it('sem tradução ou sem registro devolve o que veio', () => {
    expect(traduzir(cat, null, 'en')).toBe(cat);
    expect(traduzir(cat, undefined, 'en')).toBe(cat);
    expect(traduzir(null, { nome: 'x' }, 'en')).toBeNull();
  });

  it('en completo sobrescreve os campos de texto', () => {
    const t = { categoria_id: 'c1', idioma: 'en', nome: 'Chocolates EN', descricao: 'Artisan bars' };
    expect(traduzir(cat, t, 'en')).toEqual({ ...cat, nome: 'Chocolates EN', descricao: 'Artisan bars' });
  });

  it('campo vazio, só espaços ou nulo cai no PT', () => {
    const t = { categoria_id: 'c1', idioma: 'en', nome: '  ', descricao: null };
    expect(traduzir(cat, t, 'en')).toEqual(cat);
    expect(traduzir(cat, { nome: 'Only name', descricao: '' }, 'en')).toEqual({ ...cat, nome: 'Only name' });
  });

  it('não copia idioma nem chaves estrangeiras para o registro', () => {
    const r = traduzir(cat, { categoria_id: 'outro', idioma: 'en', nome: 'N' }, 'en');
    expect(r.id).toBe('c1');
    expect(r).not.toHaveProperty('idioma');
    expect(r).not.toHaveProperty('categoria_id');
  });
});

describe('acaoTraducao', () => {
  it('algum campo preenchido grava', () => {
    expect(acaoTraducao({ nome: 'A', descricao: '' }, false)).toBe('gravar');
    expect(acaoTraducao({ nome: '', descricao: 'd' }, true)).toBe('gravar');
  });

  it('tudo vazio apaga se existia, senão não faz nada', () => {
    expect(acaoTraducao({ nome: ' ', descricao: '' }, true)).toBe('apagar');
    expect(acaoTraducao({ nome: '', descricao: '' }, false)).toBe('nada');
  });
});
