import { describe, expect, it } from 'vitest';
import {
  MAX_FOTOS,
  TAMANHO_MAX,
  caminhoDaUrl,
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
