import { describe, expect, it } from 'vitest';
import {
  LARGURAS,
  MAX_FOTOS,
  TAMANHO_MAX,
  TAMANHO_MAX_ENTRADA,
  arquivosDaFoto,
  caminhoDaUrl,
  dimensoesLimitadas,
  fotoOtimizada,
  retanguloContido,
  srcsetFoto,
  urlLargura,
  urlOg,
  fotosDoProduto,
  mover,
  ordenarFotos,
  tornarPrincipal,
  validarArquivos,
} from '../lib/fotos.js';

const BASE = 'https://x.supabase.co/storage/v1/object/public/produtos/';
const arq = (name, type = 'image/jpeg', size = 1000) => ({ name, type, size });

describe('caminhoDaUrl', () => {
  it('tira o host e o cache-buster', () => {
    expect(caminhoDaUrl(`${BASE}abc/principal.jpg?v=169`)).toBe('abc/principal.jpg');
    expect(caminhoDaUrl(`${BASE}abc/principal.jpg`)).toBe('abc/principal.jpg');
  });

  it('só reconhece o bucket pedido (padrão produtos)', () => {
    const cat = 'https://x.supabase.co/storage/v1/object/public/categorias/id1/f.webp';
    expect(caminhoDaUrl(cat, 'categorias')).toBe('id1/f.webp');
    expect(caminhoDaUrl(cat)).toBeNull();
    expect(caminhoDaUrl(`${BASE}abc/principal.jpg`, 'categorias')).toBeNull();
  });

  it.each([[null], [undefined], [''], ['https://outro.com/foto.jpg'], [`${BASE}`]])('%s vira null', (v) => {
    expect(caminhoDaUrl(v)).toBeNull();
  });
});

describe('ordenarFotos', () => {
  it('ordena por ordem, inclusive negativa (vinda da reconciliação)', () => {
    const r = ordenarFotos([{ caminho: 'b', ordem: 1 }, { caminho: 'a', ordem: -1 }, { caminho: 'c', ordem: 0 }]);
    expect(r.map((f) => f.caminho)).toEqual(['a', 'c', 'b']);
  });

  it('desempata por created_at e não altera a entrada', () => {
    const entrada = [
      { caminho: 'b', ordem: 0, created_at: '2026-02-01' },
      { caminho: 'a', ordem: 0, created_at: '2026-01-01' },
    ];
    expect(ordenarFotos(entrada).map((f) => f.caminho)).toEqual(['a', 'b']);
    expect(entrada[0].caminho).toBe('b');
  });

  it('aceita nulo', () => {
    expect(ordenarFotos(null)).toEqual([]);
  });
});

describe('fotosDoProduto', () => {
  const urlDe = (c) => `${BASE}${c}`;

  it('usa as linhas da tabela, na ordem', () => {
    const r = fotosDoProduto({}, [
      { caminho: 'p/2.jpg', ordem: 1, foco_x: 10, foco_y: 20, zoom: 120, alt: 'lado' },
      { caminho: 'p/1.jpg', ordem: 0, foco_x: 50, foco_y: 50, zoom: 100 },
    ], urlDe);
    expect(r.map((f) => f.caminho)).toEqual(['p/1.jpg', 'p/2.jpg']);
    expect(r[1]).toMatchObject({ url: `${BASE}p/2.jpg`, alt: 'lado', foco_x: 10, zoom: 120 });
  });

  it('caminho local (com "/") vira a própria URL, sem passar pelo Storage', () => {
    const r = fotosDoProduto({}, [{ caminho: '/teste/a-1.webp', ordem: 0 }], urlDe);
    expect(r[0].url).toBe('/teste/a-1.webp');
  });

  it('sem linhas cai em imagem_url e no foco do produto', () => {
    const r = fotosDoProduto(
      { imagem_url: `${BASE}p/principal.jpg?v=1`, imagem_foco_x: 30, imagem_foco_y: 70, imagem_zoom: 150 },
      [],
      urlDe,
    );
    expect(r).toEqual([
      { caminho: 'p/principal.jpg', url: `${BASE}p/principal.jpg?v=1`, alt: null, foco_x: 30, foco_y: 70, zoom: 150 },
    ]);
  });

  it('sem linhas e sem imagem_url devolve vazio', () => {
    expect(fotosDoProduto({ imagem_url: null }, [], urlDe)).toEqual([]);
    expect(fotosDoProduto(null, undefined, urlDe)).toEqual([]);
  });
});

describe('mover', () => {
  it('troca com o vizinho', () => {
    expect(mover(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(mover(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('nas pontas não faz nada', () => {
    const l = ['a', 'b'];
    expect(mover(l, 0, -1)).toBe(l);
    expect(mover(l, 1, 1)).toBe(l);
  });
});

describe('tornarPrincipal', () => {
  it('leva para o topo mantendo a ordem dos demais', () => {
    expect(tornarPrincipal(['a', 'b', 'c', 'd'], 2)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('a que já é principal (ou índice inválido) não muda', () => {
    const l = ['a', 'b'];
    expect(tornarPrincipal(l, 0)).toBe(l);
    expect(tornarPrincipal(l, 5)).toBe(l);
  });
});

describe('validarArquivos', () => {
  it('aceita JPEG, PNG e WebP', () => {
    const { aceitos, erros } = validarArquivos([arq('a.jpg'), arq('b.png', 'image/png'), arq('c.webp', 'image/webp')]);
    expect(aceitos).toHaveLength(3);
    expect(erros).toEqual([]);
  });

  it('recusa outros tipos (HEIC, PDF)', () => {
    const { aceitos, erros } = validarArquivos([arq('a.heic', 'image/heic'), arq('b.pdf', 'application/pdf')]);
    expect(aceitos).toEqual([]);
    expect(erros).toHaveLength(2);
    expect(erros[0]).toContain('a.heic');
  });

  it('tamanho: no limite passa, acima recusa', () => {
    const { aceitos, erros } = validarArquivos([arq('ok.jpg', 'image/jpeg', TAMANHO_MAX), arq('grande.jpg', 'image/jpeg', TAMANHO_MAX + 1)]);
    expect(aceitos.map((a) => a.name)).toEqual(['ok.jpg']);
    expect(erros).toHaveLength(1);
  });

  it('chega a 8 e recusa o excedente, contando as que já existem', () => {
    const nove = Array.from({ length: 9 }, (_, i) => arq(`${i}.jpg`));
    const vazio = validarArquivos(nove, 0);
    expect(vazio.aceitos).toHaveLength(MAX_FOTOS);
    expect(vazio.erros).toHaveLength(1);

    const comTres = validarArquivos(nove.slice(0, 6), 3);
    expect(comTres.aceitos).toHaveLength(MAX_FOTOS - 3);
    expect(comTres.erros).toHaveLength(1);
  });

  it('já no limite recusa tudo', () => {
    const { aceitos, erros } = validarArquivos([arq('a.jpg')], MAX_FOTOS);
    expect(aceitos).toEqual([]);
    expect(erros).toHaveLength(1);
  });
});

describe('fotos otimizadas', () => {
  const grande = `${BASE}p1/abc-1600.webp`;
  const grandeJpg = `${BASE}p1/abc-1600.jpg`;

  it('reconhece só a versão maior pela convenção de nome', () => {
    expect(fotoOtimizada(grande)).toBe(true);
    expect(fotoOtimizada(grandeJpg)).toBe(true);
    expect(fotoOtimizada('p1/abc-1600.webp')).toBe(true);
    expect(fotoOtimizada(`${BASE}p1/principal.jpg?v=1`)).toBe(false);
    expect(fotoOtimizada(`${BASE}p1/abc-640.webp`)).toBe(false);
    expect(fotoOtimizada('/teste/x-1.webp')).toBe(false);
    expect(fotoOtimizada(null)).toBe(false);
  });

  it('urlLargura escolhe a menor versão que cobre a largura pedida', () => {
    expect(urlLargura(grande, 100)).toBe(`${BASE}p1/abc-320.webp`);
    expect(urlLargura(grande, 320)).toBe(`${BASE}p1/abc-320.webp`);
    expect(urlLargura(grande, 321)).toBe(`${BASE}p1/abc-640.webp`);
    expect(urlLargura(grande, 1080)).toBe(`${BASE}p1/abc-1080.webp`);
    expect(urlLargura(grande, 3840)).toBe(grande);
    expect(urlLargura(grandeJpg, 640)).toBe(`${BASE}p1/abc-640.jpg`);
  });

  it('foto não otimizada passa sem mexer', () => {
    const antiga = `${BASE}p1/principal.png?v=2`;
    expect(urlLargura(antiga, 320)).toBe(antiga);
    expect(srcsetFoto(antiga)).toBe('');
    expect(urlOg(antiga)).toBeNull();
    expect(arquivosDaFoto('p1/principal.png')).toEqual(['p1/principal.png']);
  });

  it('srcset lista as 4 larguras reais', () => {
    expect(srcsetFoto(grande).split(', ')).toEqual(LARGURAS.map((l) => `${BASE}p1/abc-${l}.webp ${l}w`));
  });

  it('urlOg troca para -og.jpg e descarta a query', () => {
    expect(urlOg(`${grande}?v=3`)).toBe(`${BASE}p1/abc-og.jpg`);
  });

  it('arquivosDaFoto devolve as 4 larguras e a prévia', () => {
    expect(arquivosDaFoto('p1/abc-1600.webp')).toEqual([
      'p1/abc-320.webp',
      'p1/abc-640.webp',
      'p1/abc-1080.webp',
      'p1/abc-1600.webp',
      'p1/abc-og.jpg',
    ]);
  });

  it('dimensoesLimitadas mantém a proporção e nunca amplia', () => {
    expect(dimensoesLimitadas(4000, 3000, 1600)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensoesLimitadas(900, 1125, 1600)).toEqual({ largura: 900, altura: 1125 });
  });

  it('retanguloContido centraliza a foto inteira, sem ampliar', () => {
    expect(retanguloContido(800, 1000, 1200, 630)).toEqual({ x: 348, y: 0, largura: 504, altura: 630 });
    expect(retanguloContido(300, 200, 1200, 630)).toEqual({ x: 450, y: 215, largura: 300, altura: 200 });
    expect(retanguloContido(2400, 630, 1200, 630)).toEqual({ x: 0, y: 158, largura: 1200, altura: 315 });
  });

  it('validarArquivos aceita o limite maior de entrada só quando pedido', () => {
    const f = arq('celular.jpg', 'image/jpeg', 12 * 1024 * 1024);
    expect(validarArquivos([f]).erros).toHaveLength(1);
    expect(validarArquivos([f], 0, TAMANHO_MAX_ENTRADA).aceitos).toHaveLength(1);
  });
});
