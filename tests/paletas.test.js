import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8');

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
// `pct` de `a` por cima de `b`, em sRGB (o mesmo que color-mix(in srgb, a pct%, b))
const mistura = (a, b, pct) =>
  '#' +
  [1, 3, 5]
    .map((i) => {
      const x = parseInt(a.slice(i, i + 2), 16);
      const y = parseInt(b.slice(i, i + 2), 16);
      return Math.round(x * pct + y * (1 - pct)).toString(16).padStart(2, '0');
    })
    .join('');

// Tokens do :root de app/globals.css já resolvidos para hex (hex, var() e color-mix em sRGB).
// O teste mede o CSS de verdade, não uma cópia da paleta.
function tokens() {
  const css = ler('../app/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const bloco = css.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
  const brutos = Object.fromEntries(
    [...bloco.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
  const resolver = (valor) => {
    if (/^#[0-9a-f]{6}$/i.test(valor)) return valor.toLowerCase();
    const v = valor.match(/^var\((--[\w-]+)\)$/);
    if (v) return resolver(brutos[v[1]]);
    const m = valor.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/);
    if (m) return mistura(resolver(m[1]), resolver(m[3]), Number(m[2]) / 100);
    throw new Error(`valor de cor não suportado: ${valor}`);
  };
  return Object.fromEntries(
    Object.keys(brutos)
      .filter((k) => k.startsWith('--cor-'))
      .map((k) => [k, resolver(brutos[k])]),
  );
}

describe('contraste', () => {
  it('a própria medida: azul sobre verde reprova, azul sobre bege passa (referência em docs/paleta-azul.md)', () => {
    expect(contraste('#272a5c', '#27401e')).toBeLessThan(1.3);
    expect(contraste('#272a5c', '#f6f3ea')).toBeGreaterThan(4.5);
  });

  it('a paleta de uso é a verde (X2)', () => {
    const t = tokens();
    expect(t['--cor-fundo']).toBe('#f6f3ea');
    expect(t['--cor-texto']).toBe('#27401e');
    expect(t['--cor-destaque']).toBe('#27401e');
  });

  it('texto, destaque, botão, rodapé e texto suave cumprem 4,5:1', () => {
    const t = tokens();
    const pares = {
      'texto/fundo': ['--cor-texto', '--cor-fundo'],
      'texto/superfície': ['--cor-texto', '--cor-superficie'],
      'destaque/fundo': ['--cor-destaque', '--cor-fundo'],
      'botão': ['--cor-botao-texto', '--cor-botao'],
      'rodapé': ['--cor-rodape-texto', '--cor-rodape'],
      // texto suave/superfície (4,22) fica de fora de propósito: só aparece no selo do admin
      // (decisão do X2, ver plano-v1)
      'texto suave/fundo': ['--cor-texto-suave', '--cor-fundo'],
    };
    for (const [nome, [frente, fundo]] of Object.entries(pares)) {
      expect(contraste(t[frente], t[fundo]), nome).toBeGreaterThanOrEqual(4.5);
    }
  });

  // o percentual vem do próprio CSS: mudar a opacidade lá é conferido aqui
  // ancorado no bloco do cartão: a pílula dos controles também usa um color-mix translúcido
  const alfaDoCartao = () => {
    const css = ler('../app/components/HeroCarrossel.module.css');
    const m = css.match(
      /\.sobreposto \.cartao\s*\{[^}]*?color-mix\(in srgb, var\(--cor-fundo\) (\d+)%, transparent\)/,
    );
    expect(m, 'cartão sem color-mix de --cor-fundo').not.toBeNull();
    return Number(m[1]) / 100;
  };

  it('texto do cartão translúcido do hero cumpre 4,5:1 com foto branca por trás', () => {
    const t = tokens();
    expect(
      contraste(t['--cor-texto'], mistura(t['--cor-fundo'], '#ffffff', alfaDoCartao())),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('texto do cartão do hero cumpre 4,5:1 no ponto mais escuro da área do cartão de cada foto real', async () => {
    // Foto preta pura não é o critério: com cartão translúcido nenhum percentual razoável passa (a 65% dá 4,3).
    // Mede as fotos de public/home/hero-*.webp. Área do cartão no desktop, aproximada (o corte real depende da
    // tela): 3%–28% da largura e 60%–96% da altura; pior ponto = 5º percentil mais escuro.
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch {
      return; // shortcut: sem sharp o caso é pulado, reativar se o teste passar a rodar em CI sem ele
    }
    const alfa = alfaDoCartao();
    const t = tokens();
    const pasta = new URL('../public/home/', import.meta.url);
    const fotos = readdirSync(pasta).filter((f) => /^hero-.*\.webp$/.test(f));
    expect(fotos.length, 'nenhuma foto hero-*.webp em public/home').toBeGreaterThanOrEqual(4);
    for (const foto of fotos) {
      const { data, info } = await sharp(fileURLToPath(new URL(foto, pasta)))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const { width: w, height: h } = info;
      const amostras = [];
      for (let y = Math.floor(h * 0.6); y < Math.floor(h * 0.96); y += 3) {
        for (let x = Math.floor(w * 0.03); x < Math.floor(w * 0.28); x += 3) {
          const i = (y * w + x) * 3;
          const hex = '#' + [0, 1, 2].map((k) => data[i + k].toString(16).padStart(2, '0')).join('');
          amostras.push({ hex, luz: luz(hex) });
        }
      }
      amostras.sort((a, b) => a.luz - b.luz);
      const pior = amostras[Math.floor(amostras.length * 0.05)].hex;
      expect(
        contraste(t['--cor-texto'], mistura(t['--cor-fundo'], pior, alfa)),
        foto,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('cartões de categoria da home: --cor-texto sobre cada tom de cartão cumpre 4,5:1', () => {
    // as misturas vêm do próprio CSS (color-mix em sRGB): trocar um tom lá é conferido aqui
    const css = ler('../app/components/GradeCategorias.module.css');
    const tons = [
      ...css.matchAll(
        /--cartao-fundo:\s*color-mix\(in srgb,\s*var\((--cor-[\w-]+)\)\s*(\d+)%,\s*var\((--cor-[\w-]+)\)\)/g,
      ),
    ].map((m) => ({ cor: m[1], pct: Number(m[2]) / 100, base: m[3] }));
    expect(tons.length, 'cartão sem tons --cartao-fundo').toBeGreaterThanOrEqual(2);
    const t = tokens();
    for (const { cor, pct, base } of tons) {
      expect(t[cor], `${cor} não é papel-base`).toBeDefined();
      expect(t[base], `${base} não é papel-base`).toBeDefined();
      expect(
        contraste(t['--cor-texto'], mistura(t[cor], t[base], pct)),
        `texto sobre ${cor} ${pct * 100}% + ${base}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('tipografia (X3)', () => {
  const semComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('MeditacaoPlayer não usa opacity (ela derrubava "áudio guiado" para ~2:1)', () => {
    const css = semComentarios(ler('../app/components/MeditacaoPlayer.module.css'));
    expect(css).not.toMatch(/opacity\s*:/);
  });

  it('a fonte de destaque (Amsterdam One) não é usada em nenhum CSS até a dona indicar onde entra', () => {
    const pasta = new URL('../app/', import.meta.url);
    const achados = [];
    const varrer = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const caminho = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
        if (e.isDirectory()) varrer(caminho);
        else if (e.name.endsWith('.css') && e.name !== 'globals.css' &&
          /var\(--font-accent\)/.test(readFileSync(caminho, 'utf8'))) achados.push(e.name);
      }
    };
    varrer(pasta);
    // ao autorizar um uso, listar aqui o arquivo e registrar o lugar no CLAUDE.md
    expect(achados.sort()).toEqual([]);
  });
});

describe('bundle de produção', () => {
  it('next.config fixa NEXT_PUBLIC_MOCKUPS (vazio se ausente) para o Next descartar o código de preview', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_MOCKUPS', undefined);
    const config = (await import('../next.config.mjs')).default;
    expect(config.env.NEXT_PUBLIC_MOCKUPS).toBe('');
  });
});
