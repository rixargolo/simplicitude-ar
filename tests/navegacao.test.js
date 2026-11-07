import { existsSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

async function carregar(mockups) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_MOCKUPS', mockups);
  return import('../lib/navegacao.js');
}

afterEach(() => vi.unstubAllEnvs());

describe('menu', () => {
  it('em produção só tem os itens reais, na ordem', async () => {
    const { itensMenu } = await carregar('');
    expect(itensMenu().map((i) => i.rotulo)).toEqual(['Loja', 'Meditação', 'Quem somos']);
  });

  it('no preview tem os 5 itens', async () => {
    const { itensMenu } = await carregar('1');
    expect(itensMenu().map((i) => i.rotulo)).toEqual([
      'Loja',
      'Meditação',
      'Sustentabilidade',
      'Quem somos',
      'Assinaturas',
    ]);
  });

  it('todo item aponta para uma página que existe', async () => {
    const { itensMenu } = await carregar('1');
    for (const { href } of itensMenu()) {
      expect(existsSync(new URL(`../app${href}/page.js`, import.meta.url)), href).toBe(true);
    }
  });
});

describe('exigirMockups', () => {
  it('dá 404 sem a flag', async () => {
    const { exigirMockups } = await carregar('');
    expect(exigirMockups).toThrow('NEXT_NOT_FOUND');
  });

  it('passa com a flag', async () => {
    const { exigirMockups } = await carregar('1');
    expect(exigirMockups).not.toThrow();
  });
});
