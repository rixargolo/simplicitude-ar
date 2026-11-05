import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ notFound: () => {} }));

async function carregar(mockups) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_MOCKUPS', mockups);
  return import('../lib/paletas.js');
}

afterEach(() => vi.unstubAllEnvs());

// contraste WCAG 2.x
const luz = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contraste = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe('contraste', () => {
  it('a própria medida: azul sobre verde reprova, azul sobre bege passa', () => {
    expect(contraste('#272a5c', '#27401e')).toBeLessThan(1.3);
    expect(contraste('#272a5c', '#f6f3ea')).toBeGreaterThan(4.5);
  });

  it('todo preset cumpre 4,5:1 em texto, destaque, botão e rodapé', async () => {
    const { PALETAS } = await carregar('1');
    for (const [chave, p] of Object.entries(PALETAS)) {
      expect(contraste(p.texto, p.fundo), `${chave}: texto/fundo`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.destaque, p.fundo), `${chave}: destaque/fundo`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.botaoTexto, p.botao), `${chave}: botão`).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.rodapeTexto, p.rodape), `${chave}: rodapé`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('o padrão existe', async () => {
    const { PALETAS, PALETA_PADRAO } = await carregar('1');
    expect(PALETAS[PALETA_PADRAO]).toBeDefined();
  });
});

describe('script anti-flash', () => {
  // executa o script com ambiente simulado e devolve o que ele aplicou
  async function rodar({ busca = '', lembrado = null, mockups = '1' } = {}) {
    const { scriptPaleta, variaveis, CHAVE_PALETA } = await carregar(mockups);
    const script = scriptPaleta();
    if (script === null) return { script, aplicadas: {}, dataset: {}, variaveis };
    const aplicadas = {};
    const guardado = {};
    const dataset = {};
    new Function('location', 'localStorage', 'document', script)(
      { search: busca },
      {
        getItem: () => lembrado,
        setItem: (k, v) => {
          guardado[k] = v;
        },
      },
      { documentElement: { style: { setProperty: (k, v) => (aplicadas[k] = v) }, dataset } },
    );
    return { aplicadas, dataset, guardado, variaveis, CHAVE_PALETA };
  }

  it('sem a flag não gera script: seletor e ?paleta não têm efeito', async () => {
    const r = await rodar({ busca: '?paleta=verde', mockups: '' });
    expect(r.script).toBeNull();
    expect(r.aplicadas).toEqual({});
  });

  it('?paleta válido vence o lembrado e é lembrado', async () => {
    const r = await rodar({ busca: '?paleta=verde', lembrado: 'duo' });
    expect(r.aplicadas).toEqual(r.variaveis('verde'));
    expect(r.dataset.paleta).toBe('verde');
    expect(r.guardado[r.CHAVE_PALETA]).toBe('verde');
  });

  it('sem URL, usa a escolha lembrada', async () => {
    const r = await rodar({ lembrado: 'duo' });
    expect(r.aplicadas).toEqual(r.variaveis('duo'));
  });

  it('valor inválido cai no padrão', async () => {
    const r = await rodar({ busca: '?paleta=xyz', lembrado: 'toString' });
    expect(r.aplicadas).toEqual(r.variaveis('azul'));
    expect(r.guardado).toEqual({});
  });
});
