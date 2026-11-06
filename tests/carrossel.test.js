import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ notFound: () => {} }));

async function carregar(mockups) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_MOCKUPS', mockups);
  return import('../lib/carrossel.js');
}

afterEach(() => vi.unstubAllEnvs());

const inicio = (total = 3) => ({ indice: 0, total, pausado: false, interagindo: false });

describe('índice do carrossel', () => {
  it('avança e volta ao início depois do último', async () => {
    const { reducer } = await carregar('');
    let s = inicio(3);
    s = reducer(s, { tipo: 'avancar' });
    expect(s.indice).toBe(1);
    s = reducer(s, { tipo: 'avancar' });
    s = reducer(s, { tipo: 'avancar' });
    expect(s.indice).toBe(0);
  });

  it('voltar no primeiro vai ao último', async () => {
    const { reducer } = await carregar('');
    expect(reducer(inicio(3), { tipo: 'voltar' }).indice).toBe(2);
    expect(reducer({ ...inicio(3), indice: 2 }, { tipo: 'voltar' }).indice).toBe(1);
  });

  it('ir pula para o slide pedido', async () => {
    const { reducer } = await carregar('');
    expect(reducer(inicio(3), { tipo: 'ir', indice: 2 }).indice).toBe(2);
  });

  it('tick avança sozinho e volta ao início', async () => {
    const { reducer } = await carregar('');
    const s = reducer({ ...inicio(2), indice: 1 }, { tipo: 'tick' });
    expect(s.indice).toBe(0);
  });
});

describe('pausa', () => {
  it('tick não avança com a pausa explícita (toque)', async () => {
    const { reducer } = await carregar('');
    const s = reducer(inicio(3), { tipo: 'alternarPausa' });
    expect(s.pausado).toBe(true);
    expect(reducer(s, { tipo: 'tick' }).indice).toBe(0);
  });

  it('alternarPausa de novo retoma', async () => {
    const { reducer } = await carregar('');
    let s = reducer(inicio(3), { tipo: 'alternarPausa' });
    s = reducer(s, { tipo: 'alternarPausa' });
    expect(s.pausado).toBe(false);
    expect(reducer(s, { tipo: 'tick' }).indice).toBe(1);
  });

  it('tick não avança durante hover/foco, e retoma ao sair', async () => {
    const { reducer } = await carregar('');
    let s = reducer(inicio(3), { tipo: 'interagir', valor: true });
    expect(reducer(s, { tipo: 'tick' }).indice).toBe(0);
    s = reducer(s, { tipo: 'interagir', valor: false });
    expect(reducer(s, { tipo: 'tick' }).indice).toBe(1);
  });

  it('navegar à mão funciona mesmo pausado', async () => {
    const { reducer } = await carregar('');
    const s = reducer({ ...inicio(3), pausado: true }, { tipo: 'avancar' });
    expect(s.indice).toBe(1);
    expect(s.pausado).toBe(true);
  });
});

describe('slides visíveis', () => {
  const slides = [
    { id: 'a', imagem: { src: '/a.jpg', alt: 'A' } },
    { id: 'b' },
  ];

  it('com a flag (preview), slide sem imagem fica, para mostrar o placeholder', async () => {
    const { slidesVisiveis } = await carregar('1');
    expect(slidesVisiveis(slides).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('sem a flag (produção), slide sem imagem real é omitido', async () => {
    const { slidesVisiveis } = await carregar('');
    expect(slidesVisiveis(slides).map((s) => s.id)).toEqual(['a']);
  });

  it('sem a flag e nenhuma imagem, não sobra slide (o hero não renderiza)', async () => {
    const { slidesVisiveis } = await carregar('');
    expect(slidesVisiveis([{ id: 'b' }, { id: 'c' }])).toEqual([]);
  });
});
